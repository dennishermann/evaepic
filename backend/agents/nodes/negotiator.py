"""
Negotiator Node

Handles vendor communication via the external negotiation bot API.
Executes strategy plans and adapts based on market feedback.
"""

import logging
import os
import re
import requests
import time
from typing import Dict, Any, TypedDict, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# API Configuration from environment variables
API_BASE = os.getenv("NEGOTIATION_API_BASE")
TEAM_ID = os.getenv("NEGOTIATION_TEAM_ID")


class NegotiateInput(TypedDict):
    """Input for parallel negotiation node"""
    vendor_id: str
    vendor_name: str
    strategy: Dict[str, Any]  # StrategyPlan as dict
    round_index: int
    market_analysis: Optional[Dict[str, Any]]  # Market analysis from aggregator
    conversation_id: Optional[str]  # Existing conversation ID (if any)
    last_offer: Optional[Dict[str, Any]]  # Last offer from this vendor


class OfferSnapshot(BaseModel):
    """Snapshot of vendor's current offer"""
    vendor_id: str = Field(description="Vendor identifier")
    vendor_name: str = Field(description="Vendor name")
    conversation_id: str = Field(description="Conversation ID for this negotiation")
    round_index: int = Field(description="Current negotiation round")
    price_total: Optional[float] = Field(default=None, description="Total price offered")
    currency: str = Field(default="USD", description="Currency code")
    delivery_days: Optional[int] = Field(default=None, description="Delivery time in days")
    payment_terms: Optional[str] = Field(default=None, description="Payment terms offered")
    notes: str = Field(default="", description="Additional notes or details")
    status: str = Field(default="in_progress", description="Status: in_progress, finalized, walked_away")
    last_vendor_message: str = Field(default="", description="Last message from vendor")


def create_conversation(vendor_id: str, title: str) -> Optional[str]:
    """
    Create a new conversation with a vendor.
    
    Args:
        vendor_id: Vendor identifier
        title: Conversation title
        
    Returns:
        Conversation ID or None if failed
    """
    try:
        url = f"{API_BASE}/conversations/?team_id={TEAM_ID}"
        payload = {
            "vendor_id": vendor_id,
            "title": title
        }
        
        logger.info(f"[NEGOTIATOR] Creating conversation with vendor {vendor_id}")
        
        response = requests.post(url, json=payload, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        conversation_id = data.get("id") or data.get("conversation_id")
        
        logger.info(f"[NEGOTIATOR] ✓ Conversation created: {conversation_id}")
        return conversation_id
        
    except requests.RequestException as e:
        logger.error(f"[NEGOTIATOR] Failed to create conversation: {e}")
        return None


def send_message(conversation_id: str, message: str) -> Optional[str]:
    """
    Send a message in a conversation.
    
    Args:
        conversation_id: Conversation identifier
        message: Message content to send
        
    Returns:
        Vendor's response message or None if failed
    """
    try:
        url = f"{API_BASE}/messages/{conversation_id}"
        
        # API expects form-data with 'data' field containing JSON
        data_payload = {"content": message}
        
        logger.info(f"[NEGOTIATOR] Sending message to conversation {conversation_id}")
        logger.debug(f"[NEGOTIATOR] Message content: {message[:100]}...")
        
        response = requests.post(
            url,
            data={"data": str(data_payload)},
            timeout=20
        )
        response.raise_for_status()
        
        response_data = response.json()
        
        # Extract vendor's response
        vendor_response = response_data.get("response", "")
        if not vendor_response:
            # Try alternative keys
            vendor_response = response_data.get("content", "") or response_data.get("message", "")
        
        logger.info(f"[NEGOTIATOR] ✓ Received vendor response ({len(vendor_response)} chars)")
        logger.debug(f"[NEGOTIATOR] Response preview: {vendor_response[:150]}...")
        
        return vendor_response
        
    except requests.RequestException as e:
        logger.error(f"[NEGOTIATOR] Failed to send message: {e}")
        return None


def extract_offer_from_response(response: str, vendor_id: str, vendor_name: str, conversation_id: str, round_index: int) -> OfferSnapshot:
    """
    Extract offer details from vendor's response using simple pattern matching.
    
    Args:
        response: Vendor's response message
        vendor_id: Vendor identifier
        vendor_name: Vendor name
        conversation_id: Conversation ID
        round_index: Current round
        
    Returns:
        OfferSnapshot with extracted information
    """
    # Initialize with defaults
    offer = OfferSnapshot(
        vendor_id=vendor_id,
        vendor_name=vendor_name,
        conversation_id=conversation_id,
        round_index=round_index,
        last_vendor_message=response,
        status="in_progress"
    )
    
    # Extract price (look for patterns like $1,234.56, 1234.56, etc.)
    price_patterns = [
        r'\$\s*([0-9,]+\.?[0-9]*)',  # $1,234.56
        r'([0-9,]+\.?[0-9]*)\s*(?:USD|dollars|EUR|euros)',  # 1234.56 USD
        r'(?:price|total|cost).*?([0-9,]+\.?[0-9]*)',  # price: 1234.56
    ]
    
    for pattern in price_patterns:
        match = re.search(pattern, response, re.IGNORECASE)
        if match:
            price_str = match.group(1).replace(',', '')
            try:
                offer.price_total = float(price_str)
                logger.info(f"[NEGOTIATOR] Extracted price: ${offer.price_total:.2f}")
                break
            except ValueError:
                continue
    
    # Extract delivery time (look for patterns like "5 days", "2 weeks", etc.)
    delivery_patterns = [
        r'(\d+)\s*days?',
        r'(\d+)\s*weeks?',
        r'delivery.*?(\d+)',
    ]
    
    for pattern in delivery_patterns:
        match = re.search(pattern, response, re.IGNORECASE)
        if match:
            days = int(match.group(1))
            if 'week' in match.group(0).lower():
                days *= 7
            offer.delivery_days = days
            logger.info(f"[NEGOTIATOR] Extracted delivery: {offer.delivery_days} days")
            break
    
    # Extract payment terms
    payment_keywords = ['net 30', 'net 60', 'payment', 'terms', 'advance', 'upfront']
    for keyword in payment_keywords:
        if keyword in response.lower():
            # Extract surrounding context
            idx = response.lower().find(keyword)
            context = response[max(0, idx-20):min(len(response), idx+50)]
            offer.payment_terms = context.strip()
            logger.info(f"[NEGOTIATOR] Extracted payment terms: {offer.payment_terms[:50]}...")
            break
    
    # Extract currency
    if '$' in response or 'usd' in response.lower() or 'dollar' in response.lower():
        offer.currency = "USD"
    elif '€' in response or 'eur' in response.lower() or 'euro' in response.lower():
        offer.currency = "EUR"
    
    return offer


def compose_negotiation_message(
    strategy: Dict[str, Any],
    round_index: int,
    market_analysis: Optional[Dict[str, Any]] = None,
    last_offer: Optional[OfferSnapshot] = None
) -> str:
    """
    Compose a negotiation message based on strategy and market feedback.
    
    Args:
        strategy: StrategyPlan as dict
        round_index: Current round (0 = first contact)
        market_analysis: Market analysis from aggregator (if available)
        last_offer: Last offer received from this vendor
        
    Returns:
        Message to send to vendor
    """
    vendor_id = strategy.get("vendor_id", "unknown")
    
    # First contact: use opening message from strategy
    if round_index == 0:
        message = strategy.get("opening_message", "Hello, we would like to discuss a potential order.")
        logger.info(f"[NEGOTIATOR] Round 0: Using opening message for vendor {vendor_id}")
        return message
    
    # Subsequent rounds: use market analysis to apply pressure
    if market_analysis and last_offer:
        vendor_overrides = market_analysis.get("vendor_overrides", {}).get(vendor_id, {})
        best_price = market_analysis.get("benchmarks", {}).get("best_price")
        pressure_level = vendor_overrides.get("pressure_level", "medium")
        suggested_move = vendor_overrides.get("suggested_next_move", "")
        walkaway_recommended = vendor_overrides.get("walkaway_recommended", False)
        
        logger.info(f"[NEGOTIATOR] Round {round_index}: Pressure level = {pressure_level}")
        
        if walkaway_recommended:
            message = f"Thank you for your offer. Unfortunately, it exceeds our budget constraints. We'll need to explore other options."
            logger.info(f"[NEGOTIATOR] Vendor {vendor_id}: Walk-away recommended")
        elif best_price and last_offer.price_total and last_offer.price_total > best_price:
            # Competitive pressure
            price_gap = last_offer.price_total - best_price
            message = f"Thank you for your offer of ${last_offer.price_total:.2f}. However, we have received a competing offer at ${best_price:.2f}. "
            
            if pressure_level == "high":
                message += f"To move forward with you, we would need you to match or beat this price. Can you improve your offer?"
            elif pressure_level == "medium":
                message += f"We value working with you, but there's a ${price_gap:.2f} gap. Can you adjust your pricing?"
            else:
                message += f"We're comparing options. Is there any flexibility in your pricing?"
            
            logger.info(f"[NEGOTIATOR] Vendor {vendor_id}: Applying competitive pressure (${price_gap:.2f} gap)")
        else:
            # General improvement request
            message = f"Thank you for your offer. {suggested_move if suggested_move else 'Can you provide your best possible terms?'}"
            logger.info(f"[NEGOTIATOR] Vendor {vendor_id}: General improvement request")
    else:
        # Fallback message
        message = "Thank you for your previous response. Can you provide your best pricing and terms?"
        logger.info(f"[NEGOTIATOR] Vendor {vendor_id}: Fallback message (no market analysis)")
    
    return message


def negotiate_node(input_data: NegotiateInput) -> Dict[str, Any]:
    """
    Negotiate with a single vendor using their strategy plan.
    
    This node:
    1. Creates or reuses conversation with vendor
    2. Composes message based on strategy and market feedback
    3. Sends message to vendor API
    4. Extracts offer details from response
    5. Updates negotiation history and leaderboard
    
    Note: This node runs in parallel for each vendor (map operation)
    
    Args:
        input_data: Contains vendor_id, vendor_name, strategy, round_index,
                   market_analysis, conversation_id, last_offer
        
    Returns:
        Dict with updated negotiation_history, leaderboard, and conversation_ids
    """
    vendor_id = input_data["vendor_id"]
    vendor_name = input_data["vendor_name"]
    strategy = input_data["strategy"]
    round_index = input_data["round_index"]
    market_analysis = input_data.get("market_analysis")
    conversation_id = input_data.get("conversation_id")
    last_offer_dict = input_data.get("last_offer")
    
    logger.info("=" * 60)
    logger.info(f"[NEGOTIATOR] Negotiating with {vendor_name} (Round {round_index})")
    logger.info("=" * 60)
    
    # Convert last_offer dict to OfferSnapshot if available
    last_offer = None
    if last_offer_dict:
        try:
            last_offer = OfferSnapshot(**last_offer_dict)
        except Exception as e:
            logger.warning(f"[NEGOTIATOR] Could not parse last offer: {e}")
    
    # Create or reuse conversation
    if not conversation_id:
        conversation_id = create_conversation(vendor_id, f"Procurement Negotiation - {vendor_name}")
        if not conversation_id:
            logger.error(f"[NEGOTIATOR] Failed to create conversation for {vendor_name}")
            return {
                "negotiation_history": {
                    vendor_id: [{
                        "round": round_index,
                        "status": "error",
                        "message": "Failed to create conversation"
                    }]
                },
                "leaderboard": {},
                "conversation_ids": {}
            }
        logger.info(f"[NEGOTIATOR] Created new conversation: {conversation_id}")
    else:
        logger.info(f"[NEGOTIATOR] Reusing conversation: {conversation_id}")
    
    # Compose message
    message = compose_negotiation_message(strategy, round_index, market_analysis, last_offer)
    
    # Send message and get response
    vendor_response = send_message(conversation_id, message)
    
    if not vendor_response:
        logger.error(f"[NEGOTIATOR] Failed to get response from {vendor_name}")
        return {
            "negotiation_history": {
                vendor_id: [{
                    "round": round_index,
                    "status": "error",
                    "message": "Failed to get vendor response"
                }]
            },
            "leaderboard": {}
        }
    
    # Extract offer from response
    offer = extract_offer_from_response(vendor_response, vendor_id, vendor_name, conversation_id, round_index)
    
    # Check walk-away condition
    walk_away_price = strategy.get("price_targets", {}).get("walk_away", float('inf'))
    if offer.price_total and offer.price_total > walk_away_price:
        logger.warning(f"[NEGOTIATOR] {vendor_name}: Price ${offer.price_total:.2f} exceeds walk-away ${walk_away_price:.2f}")
        offer.status = "walked_away"
    
    # Log results
    logger.info(f"[NEGOTIATOR] ✓ Negotiation round {round_index} completed for {vendor_name}")
    if offer.price_total:
        logger.info(f"[NEGOTIATOR]   Price: ${offer.price_total:.2f} {offer.currency}")
    if offer.delivery_days:
        logger.info(f"[NEGOTIATOR]   Delivery: {offer.delivery_days} days")
    logger.info(f"[NEGOTIATOR]   Status: {offer.status}")
    logger.info("=" * 60)
    
    # Update negotiation history
    history_entry = {
        "round": round_index,
        "conversation_id": conversation_id,
        "message_sent": message,
        "response_received": vendor_response,
        "offer": offer.model_dump()
    }
    
    # Update leaderboard with latest offer
    leaderboard_entry = offer.model_dump()
    
    return {
        "negotiation_history": {
            vendor_id: [history_entry]
        },
        "leaderboard": {
            vendor_id: leaderboard_entry
        },
        "conversation_ids": {
            vendor_id: conversation_id
        }
    }
