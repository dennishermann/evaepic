"""
Negotiator Node

Handles vendor communication via the external negotiation bot API.
Executes strategy plans and adapts based on market feedback.
"""

import logging
import re
import requests
import json
import time
from typing import Dict, Any, TypedDict, Optional, List, Literal
from pydantic import BaseModel, Field

from agents.config import NEGOTIATION_API_BASE, NEGOTIATION_TEAM_ID
from agents.utils.conversation_api import ConversationAPIClient
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from agents.config import DEFAULT_MODEL, DEFAULT_TEMPERATURE

logger = logging.getLogger(__name__)

# API Configuration from centralized config
API_BASE = NEGOTIATION_API_BASE
TEAM_ID = NEGOTIATION_TEAM_ID

# Initialize API Client
api_client = ConversationAPIClient(api_base_url=NEGOTIATION_API_BASE)


class NegotiateInput(TypedDict):
    """Input for parallel negotiation node"""
    vendor_id: str
    vendor_name: str
    strategy: Dict[str, Any]  # StrategyPlan as dict
    round_index: int
    market_analysis: Optional[Dict[str, Any]]  # Market analysis from aggregator
    conversation_id: Optional[str]  # Existing conversation ID (if any)
    last_offer: Optional[Dict[str, Any]]  # Last offer from this vendor
    product_id: Optional[str]  # Specific product ID being negotiated
    order_details: Dict[str, Any]  # Explicit order requirements


class OfferSnapshot(BaseModel):
    """Snapshot of vendor's current offer"""
    vendor_id: str = Field(description="Vendor identifier")
    vendor_name: str = Field(description="Vendor name")
    conversation_id: str = Field(description="Conversation ID for this negotiation")
    round_index: int = Field(description="Current negotiation round (internal)")
    price_total: Optional[float] = Field(default=None, description="Total price offered")
    currency: str = Field(default="USD", description="Currency code")
    delivery_days: Optional[int] = Field(default=None, description="Delivery time in days")
    payment_terms: Optional[str] = Field(default=None, description="Payment terms offered")
    notes: str = Field(default="", description="Additional notes or details")
    status: str = Field(default="in_progress", description="Status: in_progress, finalized, walked_away")
    last_vendor_message: str = Field(default="", description="Last message from vendor")
    
    # Internal metrics from analysis
    sentiment: str = Field(default="neutral", description="Vendor sentiment: flexible, firm, etc.")

    # Enhanced fields for final reporting
    final_offer_summary: str = Field(default="", description="Formatted summary of the deal (items + price)")
    bundled_items: List[str] = Field(default_factory=list, description="List of items included in the offer")
    list_price: Optional[float] = Field(default=None, description="Original list price before negotiation")
    final_price: Optional[float] = Field(default=None, description="Final negotiated price")


class DealExtraction(BaseModel):
    """Extracted details from the full negotiation transcript"""
    final_price: Optional[float] = Field(description="Final negotiated price agreed upon")
    list_price: Optional[float] = Field(description="Original list price mentioned")
    bundled_items: List[str] = Field(description="List of all items included in the final deal")
    summary: str = Field(description="One-line summary of the offer (e.g., 'Item A + Item B for $X')")
    deal_status: Literal["finalized", "in_progress", "walked_away", "no_deal"] = Field(description="Final status of the negotiation")


class VendorResponseAnalysis(BaseModel):
    """LLM analysis of a single vendor response"""
    has_offer: bool = Field(description="Does the response contain a specific price/offer?")
    price: Optional[float] = Field(default=None, description="Extracted price if available")
    currency: Optional[str] = Field(default=None, description="Currency if available")
    sentiment: Literal["flexible", "firm", "deal_agreed", "refused", "info_needed", "neutral"] = Field(description="Vendor's negotiation stance")
    reasoning: str = Field(description="Reasoning for the sentiment classification")
    next_action_suggestion:  Literal["continue", "accept", "walk_away", "clarify"] = Field(description="Suggested next action")


def create_conversation(vendor_id: str, title: str) -> Optional[str]:
    """Create a new conversation with a vendor."""
    team_id = TEAM_ID if TEAM_ID else 1
    return api_client.create_conversation(vendor_id, team_id, title)


def send_message(conversation_id: str, message: str) -> Optional[str]:
    """Send a message in a conversation."""
    return api_client.send_message(conversation_id, message)


# Number of max internal turns to prevent infinite loops (safety brake)
# This is "turns" as in exchanges (User -> Vendor -> User).
MAX_SESSION_TURNS = 15


class NegotiationAgent:
    """
    Agent that handles a multi-turn negotiation conversation with a single vendor.
    Runs a continuous loop until a deal is reached or broken.
    """
    def __init__(self, vendor_id: str, vendor_name: str, strategy: Dict[str, Any], order_details: Dict[str, Any] = None):
        self.vendor_id = vendor_id
        self.vendor_name = vendor_name
        self.strategy = strategy
        self.order_details = order_details or {}
        self.llm = ChatAnthropic(
            model=DEFAULT_MODEL,
            temperature=DEFAULT_TEMPERATURE
        )
        self.structured_analyzer = self.llm.with_structured_output(VendorResponseAnalysis)
        self.deal_extractor = self.llm.with_structured_output(DealExtraction)

    def analyze_response(self, vendor_response: str, history: List[Dict[str, str]]) -> VendorResponseAnalysis:
        """
        Analyze the vendor's response to extract price and sentiment.
        """
        prompt = f"""You are analyzing a negotiation response from a vendor.
        
RESPONSE: "{vendor_response}"

CONTEXT:
We are negotiating for: {self.strategy.get("objective")}
Our Target: ${self.strategy.get("price_targets", {}).get("target")}
Our Walk-away: ${self.strategy.get("price_targets", {}).get("walk_away")}

PREVIOUS EXCHANGES:
{json.dumps(history[-3:], indent=2) if history else "None"}

INSTRUCTIONS:
1. Extract any price mentioned.
2. Determine the vendor's sentiment:
   - 'flexible': Willing to negotiate, asking for counter-offer.
   - 'firm': Stated a final price, refused to lower further.
   - 'deal_agreed': Explicitly agreed to our terms/price.
   - 'refused': Refused to do business or walked away.
   - 'info_needed': asking for clarification (e.g. quantity).
   - 'neutral': General conversation.
3. Suggest next action.

Return JSON matching the schema.
"""
        try:
            return self.structured_analyzer.invoke(prompt)
        except Exception as e:
            logger.error(f"[NEGOTIATOR] Analysis failed: {e}")
            return VendorResponseAnalysis(
                has_offer=False, 
                sentiment="neutral", 
                reasoning="Analysis failed", 
                next_action_suggestion="continue"
            )

    def extract_final_deal_details(self, history: List[Dict[str, str]]) -> DealExtraction:
        """
        Parse the full negotiation transcript to extract final deal details.
        """
        transcript = "\n".join([f"{t['role'].upper()}: {t['content']}" for t in history])
        
        prompt = f"""You are an expert contract analyst.
Review the following negotiation transcript and extract the final deal details.
Pay close attention to BUNDLED items (e.g. "Coffee Machine + Grinder").

TRANSCRIPT:
{transcript}

INSTRUCTIONS:
1. Identify the FINAL negotiated price.
2. Identify the ORIGINAL list price (if mentioned).
3. List ALL items included in the final deal (e.g. ["Eagle One", "Mythos II Pure", "Installation"]).
4. Write a concise summary string (e.g. "Eagle One + Mythos II Pure (incl. Install) for $25,000").
5. Determine the final status (finalized, in_progress, etc.).

Return JSON matching the schema.
"""
        try:
            return self.deal_extractor.invoke(prompt)
        except Exception as e:
            logger.error(f"[NEGOTIATOR] Deal extraction failed: {e}")
            return DealExtraction(
                final_price=None,
                list_price=None,
                bundled_items=[],
                summary="Extraction failed",
                deal_status="in_progress"
            )

    def generate_message(
        self, 
        history: List[Dict[str, str]], 
        analysis: Optional[VendorResponseAnalysis],
        product_id: Optional[str]
    ) -> str:
        """
        Generate the next message to send to the vendor.
        """
        # Context construction
        
        # Extract facts for strict grounding
        item = self.order_details.get("item", "the product")
        qty_info = self.order_details.get("quantity", {})
        # formatting quantity strictly
        if isinstance(qty_info, dict):
            quantity_str = f"{qty_info.get('preferred', 1)}"
        else:
            quantity_str = str(qty_info)
            
        budget_val = self.order_details.get("budget", 0)
        if budget_val and float(budget_val) > 0:
            budget_str = f"{budget_val} (Target)"
        else:
            budget_str = "No strict limit (Get best market price)"
        
        if product_id and product_id not in item:
             item_display = f"{item} (Specific Model: {product_id})"
        else:
             item_display = item

        # Determine Micro-Negotiation Phase based on history length (each interaction is 2 messages)
        turns_completed = len(history) // 2
        
        tactical_phase = "UNKNOWN"
        tactical_instructions = ""
        
        if turns_completed <= 2:
            tactical_phase = "PHASE 1: THE OPENING (Messages 1–3)"
            tactical_instructions = """
TACTICS:
- The "Flinch": If a price is quoted, react as if it's higher than expected (even if it's okay).
- The Anchor: If asked for a target, anchor slightly BELOW your actual target.
- Goal: Set expectations low."""
        elif turns_completed <= 5:
            tactical_phase = "PHASE 2: THE TRADE (Messages 4–7)"
            tactical_instructions = """
TACTICS:
- The "Haggle" Loop: Do not just ask for a discount. Offer a "reason" or "trade".
  - Volume: "If we increase order size..."
  - Speed: "If we pay immediately..."
- The "Split the Difference": If close, offer to meet halfway to close the deal.
- Goal: Trade concessions for price drops."""
        else:
            tactical_phase = "PHASE 3: THE CLOSE (Messages 8+)"
            tactical_instructions = """
TACTICS:
- The "Nibble": Ask for one small extra (e.g., expedited shipping) before saying yes.
- The Confirmation: Explicitly state final terms to avoid ambiguity.
- Goal: Finalize the deal."""

        context = f"""You are an expert procurement negotiator representing an enterprise buyer.
You are negotiating with {self.vendor_name} (ID: {self.vendor_id}).

STRICT FACTS (DO NOT DEVIATE):
- Item: {item_display}
- Quantity: {quantity_str} UNIT(S) ONLY.
- Budget: {budget_str}

NEVER:
- Never invent usage statistics (e.g., "we drink 50 cups a day") unless explicitly provided in the order details.
- Never promise future orders or volume increases to get a discount (unless valid).
- Never change the quantity being negotiated.
- Never agree to a price above your walk-away point.
- NEVER accept the first offer immediately.

YOUR STRATEGY:
- Objective: {self.strategy.get("objective")}
- Tone: {self.strategy.get("tone")} (Chat/Messaging style)
- Price Targets: Anchor=${self.strategy.get("price_targets", {}).get("anchor")}, Target=${self.strategy.get("price_targets", {}).get("target")}, Walk-away=${self.strategy.get("price_targets", {}).get("walk_away")}
- Key Arguments: {", ".join(self.strategy.get("arguments", []))}

CURRENT TACTICAL PHASE: {tactical_phase}
{tactical_instructions}

CONTEXT:
- Product ID: {product_id if product_id else "General item"}
- Current Analysis: {analysis.reasoning if analysis else "Start of conversation"}
- Suggested Action: {analysis.next_action_suggestion if analysis else "Open negotiation"}

COMPETITION CONTEXT:
- We are evaluating other vendors securely. 
- IF ASKED about other vendors: Say "We are evaluating a few other competitive options" but DO NOT disclose specific names or their prices.
- Use the competition as leverage ONLY if necessary ("We have other offers closer to our target").

INSTRUCTIONS:
- Draft the next short, professional CHAT message.
- NO "Subject:" lines. This is instant messaging.
- Be concise (1-3 sentences max).
- Apply the tactics for the CURRENT PHASE.
"""

        # Chat history
        messages = [SystemMessage(content=context)]
        
        # Simplified transcript
        transcript = "\n".join([f"{t['role'].upper()}: {t['content']}" for t in history])
        
        final_prompt = f"""
CONVERSATION HISTORY:
{transcript}

Your turn. Draft the message:"""

        messages.append(HumanMessage(content=final_prompt))
        
        response = self.llm.invoke(messages)
        return response.content.strip()

    def run_negotiation_session(
        self,
        conversation_id: str,
        product_id: Optional[str]
    ) -> Dict[str, Any]:
        """
        Run the full negotiation session until conclusion (or safety limit).
        """
        history = []
        turns = 0
        best_offer: Optional[OfferSnapshot] = None
        current_price = None
        consecutive_firm_responses = 0
        
        # Initial status
        session_status = "completed"
        
        while turns < MAX_SESSION_TURNS:
            # 1. Generate Message
            if turns == 0:
                # Use strategy opening, ensure no Subject line
                msg_text = self.strategy.get("opening_message", "Hello.")
                # Clean up if strategy generated a subject line despite instructions
                if "Subject:" in msg_text:
                    msg_text = msg_text.split("Subject:")[-1].split("\n", 1)[-1].strip()
            else:
                msg_text = self.generate_message(history, last_analysis, product_id)

            logger.info(f"[NEGOTIATOR] {self.vendor_name} (Turn {turns}): Sending: {msg_text}")
            
            # 2. Send
            vendor_response = send_message(conversation_id, msg_text)
            if not vendor_response:
                logger.error("[NEGOTIATOR] Failed to send/receive.")
                session_status = "error"
                break
                
            logger.info(f"[NEGOTIATOR] {self.vendor_name} (Turn {turns}): Received: {vendor_response}")
            
            # Update history
            history.append({"role": "agent", "content": msg_text})
            history.append({"role": "vendor", "content": vendor_response})
            
            # 3. Analyze Response
            last_analysis = self.analyze_response(vendor_response, history)
            
            # 4. Check Termination Conditions
            
            # A. Deal Agreed
            if last_analysis.sentiment == "deal_agreed":
                logger.info("[NEGOTIATOR] Deal agreed!")
                break
                
            # B. Walk Away / Refused
            if last_analysis.sentiment == "refused" or last_analysis.next_action_suggestion == "walk_away":
                 logger.info("[NEGOTIATOR] Negotiation ended (refused/walk-away).")
                 break

            # C. Firm Price (Stalling)
            if last_analysis.sentiment == "firm":
                consecutive_firm_responses += 1
                if consecutive_firm_responses >= 2:
                    logger.info("[NEGOTIATOR] Vendor is firm twice in a row. Stopping.")
                    break
            else:
                consecutive_firm_responses = 0
                
            turns += 1

        # 5. Final Deal Extraction (Post-Session)
        logger.info("[NEGOTIATOR] running final deal extraction...")
        deal_details = self.extract_final_deal_details(history)
        
        # Create final offer snapshot
        best_offer = OfferSnapshot(
            vendor_id=str(self.vendor_id),
            vendor_name=self.vendor_name,
            conversation_id=conversation_id,
            round_index=0,
            price_total=deal_details.final_price,
            currency="USD", # Defaulting for now
            status=deal_details.deal_status,
            last_vendor_message=history[-1]["content"] if history else "No response",
            sentiment="final",
            
            # New fields
            final_offer_summary=deal_details.summary,
            bundled_items=deal_details.bundled_items,
            list_price=deal_details.list_price,
            final_price=deal_details.final_price
        )
            
        return best_offer, history


def negotiate_node(input_data: NegotiateInput) -> Dict[str, Any]:
    """
    Negotiate with a single vendor using the multi-turn NegotiationAgent.
    """
    vendor_id = input_data["vendor_id"]
    vendor_name = input_data["vendor_name"]
    strategy = input_data["strategy"]
    conversation_id = input_data.get("conversation_id")
    product_id = input_data.get("product_id")
    
    logger.info("=" * 60)
    logger.info(f"[NEGOTIATOR] Starting negotiation session with {vendor_name}")
    print(f"[NEGOTIATOR] 💬 contacting {vendor_name}...", flush=True)
    
    # 1. Setup Conversation
    if not conversation_id:
        conversation_id = create_conversation(vendor_id, f"Negotiation {vendor_name}")
        if not conversation_id:
            logger.error("Failed to create conversation")
            return {"leaderboard": {}} 
            
    # 2. Run Agent (Full Session)
    agent = NegotiationAgent(vendor_id, vendor_name, strategy, order_details=input_data.get("order_details"))
    offer, history = agent.run_negotiation_session(conversation_id, product_id)
    
    # 3. Format Output
    price_display = f"${offer.price_total}" if offer.price_total else "No Offer"
    print(f"[NEGOTIATOR]    -> Final Result: {price_display} ({offer.status})", flush=True)

    # Return structure needed for graph state
    history_entry = {
        "round": 0,
        "turns": history,
        "offer": offer.model_dump()
    }
    
    return {
        "negotiation_history": {
            vendor_id: [history_entry]
        },
        "leaderboard": {
            vendor_id: offer.model_dump()
        },
        "conversation_ids": {
            vendor_id: conversation_id
        }
    }
