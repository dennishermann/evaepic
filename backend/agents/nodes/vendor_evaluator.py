"""
Vendor Evaluator Node

Uses LLM to determine vendor relevance (yes/no decision).
Each vendor is evaluated in parallel as part of a map operation.
"""

import logging
from typing import Dict, Any, TypedDict
from pydantic import BaseModel, Field, ValidationError
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

from models.order import OrderObject
from models.vendor import Vendor
from agents.config import DEFAULT_MODEL, DEFAULT_TEMPERATURE

logger = logging.getLogger(__name__)


class EvaluateInput(TypedDict):
    vendor: Dict[str, Any]
    order_requirements: Dict[str, Any]


class SuitabilityResult(BaseModel):
    """YES or NO - can this vendor deliver?"""
    suitable: bool = Field(description="YES (True) or NO (False)")
    reasoning: str = Field(description="One sentence why")


class RelevantVendorEvaluatorAgent:
    """Simple YES/NO filter - can vendor deliver the product?"""

    def __init__(self):
        self.llm = ChatAnthropic(
            model=DEFAULT_MODEL,
            temperature=DEFAULT_TEMPERATURE
        )
        self.parser = PydanticOutputParser(pydantic_object=SuitabilityResult)
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You evaluate if a vendor can deliver an order. For the 'suitable' field, respond with a boolean 'true' or 'false'.

'true' if:
- Vendor's category matches the order item
- They can handle the quantity
- They meet mandatory requirements

'false' if:
- Product mismatch
- Cannot handle quantity
- Missing mandatory requirements

{format_instructions}"""),
            ("human", """Can this vendor deliver?

VENDOR:
Name: {vendor_name}
Categories: {vendor_category}
Rating: {vendor_rating}/5

ORDER:
Item: {order_item}
Quantity: {order_quantity_preferred} units
Requirements: {order_requirements_mandatory}

""")
        ])
        
        self.chain = self.prompt | self.llm | self.parser

    def evaluate(self, vendor: Vendor, order: OrderObject) -> bool:
        """
        Evaluate if a vendor can deliver an order.
        
        Args:
            vendor: Vendor object to evaluate
            order: Order requirements
            
        Returns:
            True if vendor is suitable, False otherwise
        """
        try:
            result = self.chain.invoke({
                "vendor_name": vendor.name,
                "vendor_category": ", ".join(vendor.category),
                "vendor_rating": vendor.rating,
                "order_item": order.item,
                "order_quantity_preferred": order.quantity.preferred,
                "order_requirements_mandatory": ", ".join(order.requirements.mandatory) if order.requirements.mandatory else "None",
                "format_instructions": self.parser.get_format_instructions()
            })
            
            logger.debug(f"[EVALUATOR] {vendor.name}: {result.reasoning}")
            return result.suitable
            
        except Exception as e:
            logger.error(f"[EVALUATOR] Error evaluating {vendor.name}: {e}")
            raise


def evaluate_vendor_node(input_data: EvaluateInput) -> Dict[str, Any]:
    """
    LangGraph node function that evaluates a single vendor's relevance to the order.
    
    This node runs in parallel for each vendor (map operation).
    The relevant_vendors field uses a list merger to accumulate results from parallel nodes.
    
    Args:
        input_data: Dict containing 'vendor' and 'order_requirements'
        
    Returns:
        Dict with relevant_vendors containing [vendor] if relevant, or [] if not
    """
    vendor_dict = input_data["vendor"]
    order_dict = input_data["order_requirements"]
    
    try:
        # Convert dicts to Pydantic models
        vendor = Vendor(**vendor_dict)
        order = OrderObject(**order_dict)
        
        # Initialize agent and evaluate
        agent = RelevantVendorEvaluatorAgent()
        
        print(f"[EVALUATOR] Evaluating: {vendor.name} ...", flush=True)
        is_relevant = agent.evaluate(vendor, order)
        
        # Return in LangGraph format
        if is_relevant:
            print(f"[EVALUATOR] ✓ {vendor.name} - RELEVANT", flush=True)
            logger.info(f"[EVALUATOR] ✓ {vendor.name} - RELEVANT")
            return {"relevant_vendors": [vendor_dict]}
        else:
            print(f"[EVALUATOR] ✗ {vendor.name} - NOT RELEVANT", flush=True)
            logger.info(f"[EVALUATOR] ✗ {vendor.name} - NOT RELEVANT")
            return {"relevant_vendors": []}
            
    except ValidationError as e:
        print(f"[EVALUATOR] Error invalid input for {vendor_dict.get('name')}: {e}", flush=True)
        logger.error(f"[EVALUATOR] Invalid input data for vendor {vendor_dict.get('name', 'Unknown')}: {e}")
        return {"relevant_vendors": []}
    except Exception as e:
        vendor_name = vendor_dict.get('name', 'Unknown')
        print(f"[EVALUATOR] CRITICAL ERROR with {vendor_name}: {e}", flush=True)
        logger.error(f"[EVALUATOR] Error evaluating {vendor_name}: {e}")
        return {"relevant_vendors": []}
