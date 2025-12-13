"""
Order Extraction Node

Adapts the existing OrderExtractorAgent to work as a LangGraph node.
This is the only node with full implementation - others are stubs.
"""

import logging
from typing import Dict, Any
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

from models.order import OrderObject
from agents.config import DEFAULT_MODEL, DEFAULT_TEMPERATURE

logger = logging.getLogger(__name__)


class OrderExtractorAgent:
    """Agent that extracts structured order data from user input"""
    
    def __init__(self):
        # Initialize Claude with centralized config
        self.llm = ChatAnthropic(
            model=DEFAULT_MODEL,
            temperature=DEFAULT_TEMPERATURE
        )

        # Setup output parser
        self.parser = PydanticOutputParser(pydantic_object=OrderObject)

        # Create prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert at extracting structured order information from casual user input.

Extract the following information:
- Item: What product/service they want
- Quantity: Min/max/preferred amounts (if range given, calculate preferred as middle)
- Budget: Numeric amount
- Currency: Infer from context ($ = USD, € = EUR, etc)
- Requirements: Separate mandatory vs optional needs
- Urgency: Infer from phrases like "ASAP", "fast", "no rush"

{format_instructions}

Be intelligent about:
- Ranges: "100-150" → min:100, max:150, preferred:125
- Vague amounts: "around 100" → min:90, max:110, preferred:100
- Budget: "4.5k" or "$4500" → 4500
- Requirements: "need warranty" = mandatory, "would be nice to have warranty" = optional
"""),
            ("human", "{user_input}")
        ])

        # Create chain
        self.chain = self.prompt | self.llm | self.parser

    def extract(self, user_input: str) -> OrderObject:
        """Extract order object from user input"""
        result = self.chain.invoke({
            "user_input": user_input,
            "format_instructions": self.parser.get_format_instructions()
        })
        return result


def validate_order(order: OrderObject) -> bool:
    """Validates the extracted order object"""
    if order.budget <= 0:
        logger.warning(f"Validation failed: Budget is non-positive ({order.budget})")
        return False
    if order.quantity.min <= 0:
        logger.warning(f"Validation failed: Minimum quantity is non-positive ({order.quantity.min})")
        return False
    if order.quantity.preferred <= 0:
        logger.warning(f"Validation failed: Preferred quantity is non-positive ({order.quantity.preferred})")
        return False
    return True


def extract_order_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function that extracts order from user input.
    
    Args:
        state: GraphState containing user_input
        
    Returns:
        Dict with updated fields: order_object, phase
    """
    logger.info("[EXTRACTOR] Starting order extraction")
    
    user_input = state.get("user_input", "")
    
    if not user_input:
        logger.error("[EXTRACTOR] No user input provided")
        return {
            "phase": "extraction",
            "error": "No user input provided"
        }
    
    try:
        # Initialize agent and extract order
        agent = OrderExtractorAgent()
        order = agent.extract(user_input)
        
        logger.info(f"[EXTRACTOR] Extracted order for: {order.item}")
        
        # Validate the order
        if not validate_order(order):
            logger.error(f"[EXTRACTOR] Validation failed for order: {order.item}")
            return {
                "phase": "extraction",
                "error": "Order validation failed"
            }
        
        # Return updated state
        logger.info(f"[EXTRACTOR] Successfully extracted and validated order")
        return {
            "order_object": order.model_dump(),
            "phase": "extraction"
        }
        
    except Exception as e:
        logger.error(f"[EXTRACTOR] Error during extraction: {e}")
        return {
            "phase": "extraction",
            "error": f"Extraction failed: {str(e)}"
        }
