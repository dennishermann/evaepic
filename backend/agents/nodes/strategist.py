"""
Strategist Node

Generates vendor-specific negotiation strategies based on:
- Vendor behavioral profiles from API
- Order requirements and constraints
- Budget and priorities
"""

import logging
import os
import requests
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from langchain_anthropic import ChatAnthropic

logger = logging.getLogger(__name__)

# API Configuration from environment variables
API_BASE = os.getenv("NEGOTIATION_API_BASE")
TEAM_ID = os.getenv("NEGOTIATION_TEAM_ID")

# Configurable parameter
MAX_NEGOTIATION_ROUNDS = int(os.getenv("MAX_NEGOTIATION_ROUNDS", "2"))


class PriceTargets(BaseModel):
    """Price negotiation targets"""
    anchor: float = Field(description="Opening/anchor price to start negotiation")
    target: float = Field(description="Ideal target price we aim for")
    walk_away: float = Field(description="Maximum price we're willing to pay")
    currency: str = Field(description="Currency code (USD, EUR, etc)")


class StrategyPlan(BaseModel):
    """Complete negotiation strategy for a vendor"""
    vendor_id: str = Field(description="Vendor identifier")
    vendor_name: str = Field(description="Vendor name for reference")
    objective: str = Field(description="Primary negotiation objective")
    price_targets: PriceTargets = Field(description="Price negotiation targets")
    tone: str = Field(description="Communication tone (professional, casual, firm, etc)")
    approach: str = Field(description="Overall negotiation approach")
    arguments: List[str] = Field(description="Key arguments to use in negotiation")
    concessions: List[str] = Field(description="Ordered list of concessions we can make")
    opening_message: str = Field(description="Initial message to send to vendor")
    assumptions: List[str] = Field(description="Key assumptions made in this strategy")
    behavioral_notes: str = Field(description="Notes about vendor's behavioral profile")


def fetch_vendor_details(vendor_id: str) -> Dict[str, Any]:
    """
    Fetch detailed vendor information from API.
    
    Args:
        vendor_id: Vendor identifier
        
    Returns:
        Vendor details including behavioral_prompt
    """
    try:
        url = f"{API_BASE}/vendors/{vendor_id}"
        logger.info(f"[STRATEGIST] Fetching vendor details: {url}")
        
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        vendor_data = response.json()
        logger.info(f"[STRATEGIST] Retrieved vendor: {vendor_data.get('name', 'Unknown')}")
        return vendor_data
        
    except requests.RequestException as e:
        logger.error(f"[STRATEGIST] Failed to fetch vendor {vendor_id}: {e}")
        return {"error": str(e)}


def create_strategy_for_vendor(
    vendor: Dict[str, Any],
    vendor_details: Dict[str, Any],
    order: Dict[str, Any]
) -> StrategyPlan:
    """
    Generate a negotiation strategy for a specific vendor using LLM.
    
    Args:
        vendor: Basic vendor info from state
        vendor_details: Detailed vendor info from API (includes behavioral_prompt)
        order: Order requirements and constraints
        
    Returns:
        StrategyPlan with complete negotiation strategy
    """
    llm = ChatAnthropic(
        model="claude-sonnet-4-20250514",
        temperature=0
    )
    
    # Extract key information
    vendor_id = vendor.get("id", "unknown")
    vendor_name = vendor.get("name", "Unknown Vendor")
    behavioral_prompt = vendor_details.get("behavioral_prompt", "No behavioral information available")
    
    item = order.get("item", "product")
    quantity = order.get("quantity", {})
    quantity_str = f"{quantity.get('min', '?')}-{quantity.get('max', '?')} units (preferred: {quantity.get('preferred', '?')})"
    budget = order.get("budget", 10000)
    currency = order.get("currency", "USD")
    requirements = order.get("requirements", {})
    mandatory = requirements.get("mandatory", [])
    optional = requirements.get("optional", [])
    urgency = order.get("urgency", "medium")
    
    # Prepare prompt for LLM
    prompt = f"""You are an expert procurement negotiator. Create a detailed negotiation strategy for this vendor.

VENDOR INFORMATION:
- ID: {vendor_id}
- Name: {vendor_name}
- Behavioral Profile: {behavioral_prompt}

ORDER REQUIREMENTS:
- Item: {item}
- Quantity: {quantity_str}
- Budget: {budget} {currency}
- Urgency: {urgency}
- Mandatory Requirements: {', '.join(mandatory) if mandatory else 'None specified'}
- Optional Requirements: {', '.join(optional) if optional else 'None specified'}

Create a strategy that:
1. Analyzes the vendor's behavioral profile and adapts to their negotiation style
2. Sets realistic price targets (anchor at 70% of budget, target at 80%, walk-away at 95%)
3. Identifies key arguments based on order requirements
4. Defines concessions in priority order (e.g., payment terms before delivery)
5. Crafts an opening message that establishes rapport and communicates needs clearly
6. Notes any assumptions made

Return a complete StrategyPlan."""

    # Use structured output to ensure valid schema
    structured_llm = llm.with_structured_output(StrategyPlan)
    
    logger.info(f"[STRATEGIST] Generating strategy for vendor {vendor_name}...")
    
    strategy = structured_llm.invoke(prompt)
    
    logger.info(f"[STRATEGIST] ✓ Strategy created for {vendor_name}")
    logger.info(f"[STRATEGIST]   Objective: {strategy.objective}")
    logger.info(f"[STRATEGIST]   Price targets: ${strategy.price_targets.anchor:.2f} → ${strategy.price_targets.target:.2f} (walk-away: ${strategy.price_targets.walk_away:.2f})")
    logger.info(f"[STRATEGIST]   Approach: {strategy.approach}")
    
    return strategy


def strategist_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate negotiation strategies for each relevant vendor.
    
    This node:
    1. Fetches detailed vendor information from API (including behavioral_prompt)
    2. Analyzes vendor personality and order requirements
    3. Creates tailored StrategyPlan for each vendor using LLM
    4. Stores strategies in state for use by Negotiator
    
    Args:
        state: GraphState with relevant_vendors and order_object
        
    Returns:
        Dict with updated fields: vendor_strategies, max_rounds, phase
    """
    logger.info("=" * 60)
    logger.info("[STRATEGIST] Starting strategy generation phase")
    logger.info("=" * 60)
    
    relevant_vendors = state.get("relevant_vendors", [])
    order = state.get("order_object", {})
    
    if not relevant_vendors:
        logger.warning("[STRATEGIST] No relevant vendors found")
        return {
            "vendor_strategies": {},
            "max_rounds": MAX_NEGOTIATION_ROUNDS,
            "phase": "negotiation"
        }
    
    logger.info(f"[STRATEGIST] Creating strategies for {len(relevant_vendors)} vendors")
    logger.info(f"[STRATEGIST] Max negotiation rounds: {MAX_NEGOTIATION_ROUNDS}")
    
    vendor_strategies = {}
    
    for vendor in relevant_vendors:
        vendor_id = vendor.get("id")
        vendor_name = vendor.get("name", "Unknown")
        
        logger.info(f"[STRATEGIST] Processing vendor: {vendor_name} (ID: {vendor_id})")
        
        try:
            # Fetch detailed vendor information from API
            vendor_details = fetch_vendor_details(vendor_id)
            
            if "error" in vendor_details:
                logger.warning(f"[STRATEGIST] Could not fetch details for {vendor_name}, using basic info")
                vendor_details = vendor  # Fallback to basic info
            
            # Generate strategy using LLM
            strategy = create_strategy_for_vendor(vendor, vendor_details, order)
            
            # Store strategy as dict for state
            vendor_strategies[vendor_id] = strategy.model_dump()
            
        except Exception as e:
            logger.error(f"[STRATEGIST] Failed to create strategy for {vendor_name}: {e}")
            # Create a basic fallback strategy
            vendor_strategies[vendor_id] = {
                "vendor_id": vendor_id,
                "vendor_name": vendor_name,
                "objective": f"Negotiate best price for {order.get('item', 'product')}",
                "price_targets": {
                    "anchor": order.get("budget", 10000) * 0.7,
                    "target": order.get("budget", 10000) * 0.8,
                    "walk_away": order.get("budget", 10000) * 0.95,
                    "currency": order.get("currency", "USD")
                },
                "tone": "professional",
                "approach": "standard negotiation",
                "arguments": ["competitive pricing", "volume commitment"],
                "concessions": ["payment terms", "delivery timeline"],
                "opening_message": f"Hello, we are interested in purchasing {order.get('item', 'product')}. What are your best terms?",
                "assumptions": ["Standard market rates"],
                "behavioral_notes": "Unknown vendor profile"
            }
    
    logger.info(f"[STRATEGIST] ✓ Created {len(vendor_strategies)} strategies")
    logger.info("=" * 60)
    
    return {
        "vendor_strategies": vendor_strategies,
        "max_rounds": MAX_NEGOTIATION_ROUNDS,
        "phase": "negotiation"
    }
