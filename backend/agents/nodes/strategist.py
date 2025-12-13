"""
Strategist Node

Generates vendor-specific negotiation strategies based on:
- Vendor behavioral profiles from state (fetched by database_fetcher)
- Order requirements and constraints
- Budget and priorities
"""

import logging
from typing import Dict, Any, List, TypedDict
from pydantic import BaseModel, Field
from langchain_anthropic import ChatAnthropic

from langchain_core.messages import HumanMessage
from agents.config import DEFAULT_MODEL, DEFAULT_TEMPERATURE, MAX_NEGOTIATION_ROUNDS
from agents.utils.file_utils import get_file_message_content

logger = logging.getLogger(__name__)


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


def create_strategy_for_vendor(
    vendor: Dict[str, Any],
    order: Dict[str, Any],
    product_id: str = None
) -> StrategyPlan:
    """
    Generate a negotiation strategy for a specific vendor using LLM.
    
    Args:
        vendor: Vendor info from state (includes behavioral_prompt and documents)
        order: Order requirements and constraints
        product_id: Output from evaluator, specific product to negotiate for
        
    Returns:
        StrategyPlan with complete negotiation strategy
    """
    llm = ChatAnthropic(
        model=DEFAULT_MODEL,
        temperature=DEFAULT_TEMPERATURE
    )
    
    # Extract key information
    vendor_id = vendor.get("id", "unknown")
    vendor_name = vendor.get("name", "Unknown Vendor")
    behavioral_prompt = vendor.get("behavioral_prompt", "No behavioral information available")
    vendor_docs = vendor.get("documents", [])
    
    item = order.get("item", "product")
    quantity = order.get("quantity", {})
    quantity_str = f"{quantity.get('min', '?')}-{quantity.get('max', '?')} units (preferred: {quantity.get('preferred', '?')})"
    budget = order.get("budget", 10000)
    currency = order.get("currency", "USD")
    requirements = order.get("requirements", {})
    mandatory = requirements.get("mandatory", [])
    optional = requirements.get("optional", [])
    urgency = order.get("urgency", "medium")
    
    # Prepare system prompt
    system_prompt = f"""You are an expert procurement negotiator. Create a detailed negotiation strategy for this vendor.

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
"""
    if product_id:
        system_prompt += f"\nTARGET PRODUCT ID: {product_id}\nUse the attached documents to find the list price for this specific product to inform your anchor and target prices.\n"
    else:
        system_prompt += "\nNo specific product ID known. Use general market assumptions or any relevant items found in documents.\n"

    system_prompt += """
Create a strategy that:
1. Analyzes the vendor's behavioral profile and adapts to their negotiation style.
2. Sets realistic price targets based on CATALOG PRICES found in documents (if available).
   - Anchor: Aggressive but reasonable starting point (below list price).
   - Target: Realistic goal.
   - Walk-away: Maximum budget or slightly above if justified.
3. Identifies key arguments based on order requirements.
4. Defines concessions in priority order (e.g., payment terms before delivery).
5. Crafts an opening message that establishes rapport and communicates needs clearly.
   - IMPORTANT: This is a CHAT message, NOT an email. DO NOT use a "Subject:" line.
   - Keep it professional but natural.
   - Be specific about the product we want (mention Product ID if available).
6. Notes any assumptions made.

Return a complete StrategyPlan."""

    # Build message content
    content_blocks = []
    content_blocks.append({"type": "text", "text": "Please generate the strategy based on these requirements and the attached documents."})

    # Attach documents
    for doc in vendor_docs:
        filename = doc.get("filename")
        if filename:
            block = get_file_message_content(filename)
            if block:
                content_blocks.append(block)

    messages = [
        ("system", system_prompt),
        HumanMessage(content=content_blocks)
    ]

    # Use structured output to ensure valid schema
    structured_llm = llm.with_structured_output(StrategyPlan)
    
    logger.info(f"[STRATEGIST] Generating strategy for vendor {vendor_name} (Product: {product_id})...")
    
    strategy = structured_llm.invoke(messages)
    
    logger.info(f"[STRATEGIST] ✓ Strategy created for {vendor_name}")
    logger.info(f"[STRATEGIST]   Objective: {strategy.objective}")
    logger.info(f"[STRATEGIST]   Price targets: ${strategy.price_targets.anchor:.2f} → ${strategy.price_targets.target:.2f} (walk-away: ${strategy.price_targets.walk_away:.2f})")
    logger.info(f"[STRATEGIST]   Approach: {strategy.approach}")
    
    return strategy


class GenerateStrategyInput(TypedDict):
    """Input for parallel strategy generation"""
    vendor: Dict[str, Any]
    order: Dict[str, Any]


def generate_strategy_node(input_data: GenerateStrategyInput) -> Dict[str, Any]:
    """
    Generate strategy for a SINGLE vendor (Parallel Node).
    
    Args:
        input_data: Dict with 'vendor' and 'order'
        
    Returns:
        Dict with vendor_strategies update
    """
    vendor = input_data["vendor"]
    order = input_data["order"]
    vendor_id = vendor.get("id")
    vendor_name = vendor.get("name", "Unknown")
    product_id = vendor.get("relevant_product_id") # Propagated from evaluator
    
    print(f"[STRATEGIST] Generating strategy for {vendor_name}...", flush=True)
    
    try:
        # Generate strategy using LLM
        strategy = create_strategy_for_vendor(vendor, order, product_id)
        
        # Return state update for this specific vendor
        return {
            "vendor_strategies": {
                str(vendor_id): strategy.model_dump()
            }
        }
        
    except Exception as e:
        logger.error(f"[STRATEGIST] Failed to create strategy for {vendor_name}: {e}")
        # Create fallback strategy
        fallback = {
            "vendor_id": str(vendor_id),
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
        return {
            "vendor_strategies": {
                str(vendor_id): fallback
            }
        }


def start_strategy_phase(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Dummy/Synchronization node to mark start of strategy phase.
    Acts as a router input for fan-out.
    """
    logger.info("=" * 60)
    logger.info("[STRATEGIST] Starting strategy generation phase")
    logger.info("=" * 60)
    
    relevant_vendors = state.get("relevant_vendors", [])
    
    if not relevant_vendors:
        logger.warning("[STRATEGIST] No relevant vendors found")
        # Ensure we move to next phase even if empty
        return {
             "max_rounds": MAX_NEGOTIATION_ROUNDS,
             "phase": "negotiation"
        }
        
    logger.info(f"[STRATEGIST] Preparing to fan out for {len(relevant_vendors)} vendors")
    return {
        "max_rounds": MAX_NEGOTIATION_ROUNDS
    }
