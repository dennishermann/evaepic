"""
Vendor Evaluator Node

Uses LLM to determine vendor relevance (yes/no decision) and extracts specific product ID.
Each vendor is evaluated in parallel as part of a map operation.
"""

import logging
import base64
import os
import mimetypes
import traceback
from pathlib import Path
from typing import Dict, Any, TypedDict, List, Optional
from pydantic import BaseModel, Field, ValidationError
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.messages import HumanMessage

from models.order import OrderObject
from models.vendor import Vendor
from agents.config import DEFAULT_MODEL, DEFAULT_TEMPERATURE

logger = logging.getLogger(__name__)


class EvaluateInput(TypedDict):
    vendor: Dict[str, Any]
    order_requirements: Dict[str, Any]


class SuitabilityResult(BaseModel):
    """Result of vendor suitability evaluation."""
    suitable: bool = Field(description="YES (True) or NO (False)")
    reasoning: str = Field(description="One sentence why")
    product_id: Optional[str] = Field(default=None, description="The ID of the most relevant product found in the catalog. REQUIRED if suitable is True.")


from agents.utils.file_utils import get_file_message_content


class RelevantVendorEvaluatorAgent:
    """Evaluates if a vendor can deliver the product and finds the specific product ID."""

    def __init__(self):
        self.llm = ChatAnthropic(
            model=DEFAULT_MODEL,
            temperature=DEFAULT_TEMPERATURE
        )
        self.parser = PydanticOutputParser(pydantic_object=SuitabilityResult)
        
        # We construct the messages dynamically in evaluate() now to handle attachments
        
    def evaluate(self, vendor: Vendor, order: OrderObject) -> SuitabilityResult:
        """
        Evaluate if a vendor can deliver an order using their documents.
        """
        
        # SYSTEM PROMPT
        system_text = f"""You evaluate if a vendor can deliver an order by checking their documents (catalogs, price lists). 

Your goal is to find ONE single product ID that best matches the order requirements.

RESPOND IN JSON FORMAT.

OUTPUT RULES:
1. 'suitable': boolean. True ONLY if you find a specific product that matches the order.
2. 'product_id': The exact ID of the matching product found in the documents. REQUIRED if suitable is True.
3. 'reasoning': Brief explanation.

CRITERIA FOR 'TRUE':
- You found a specific product in the provided documents that matches the requested item.
- The product ID is clearly identifiable.

CRITERIA FOR 'FALSE':
- No matching product found in documents.
- Vendor category matches but no specific product details are in the documents.
- Cannot handle quantity (if specified in docs).

{self.parser.get_format_instructions()}
"""

        # HUMAN PROMPT CONTEXT
        human_text = f"""Can this vendor deliver?

VENDOR:
Name: {vendor.name}
Categories: {", ".join(vendor.category)}
Rating: {vendor.rating}/5

ORDER:
Item: {order.item}
Quantity: {order.quantity.preferred} units
Requirements: {", ".join(order.requirements.mandatory) if order.requirements.mandatory else "None"}

Please analyze the attached documents to find the product.
"""
        
        # Build message content list
        content_blocks = []
        content_blocks.append({"type": "text", "text": human_text})
        
        # Attach documents
        found_docs_count = 0
        for doc in vendor.documents:
            filename = doc.get("filename")
            if filename:
                block = get_file_message_content(filename)
                if block:
                    content_blocks.append(block)
                    found_docs_count += 1
        
        if found_docs_count == 0:
            logger.warning(f"[EVALUATOR] No readable documents found for {vendor.name}")
            # We add a note that no docs were available, so rely on metadata only (likely False unless very generic)
            content_blocks.append({"type": "text", "text": "\n[WARNING: No documents could be loaded. Evaluate based on metadata only, but be strict.]"})

        # Create message payload
        messages = [
            ("system", system_text),
            HumanMessage(content=content_blocks)
        ]
        
        # Execute chain
        chain = self.llm | self.parser
        
        try:
            result = chain.invoke(messages)
            logger.debug(f"[EVALUATOR] {vendor.name}: {result.reasoning} (ID: {result.product_id})")
            return result
        except Exception as e:
            logger.error(f"[EVALUATOR] Error evaluating {vendor.name}: {e}")
            logger.error(traceback.format_exc())
            raise


def evaluate_vendor_node(input_data: EvaluateInput) -> Dict[str, Any]:
    """
    LangGraph node function.
    """
    vendor_dict = input_data["vendor"]
    order_dict = input_data["order_requirements"]
    
    if not order_dict:
        logger.error(f"[EVALUATOR] Missing order requirements for {vendor_dict.get('name')}")
        return {"relevant_vendors": []}
    
    try:
        vendor = Vendor(**vendor_dict)
        order = OrderObject(**order_dict)
        
        agent = RelevantVendorEvaluatorAgent()
        
        print(f"[EVALUATOR] Evaluating: {vendor.name} ...", flush=True)
        result = agent.evaluate(vendor, order)
        
        if result.suitable:
            print(f"[EVALUATOR] ✓ {vendor.name} - RELEVANT (Product ID: {result.product_id})", flush=True)
            logger.info(f"[EVALUATOR] ✓ {vendor.name} - RELEVANT (ID: {result.product_id})")
            
            # Inject the found product ID into the vendor dict for downstream nodes
            vendor_dict_out = vendor_dict.copy()
            vendor_dict_out["relevant_product_id"] = result.product_id
            return {
                "relevant_vendors": [vendor_dict_out],
                "_evaluated_vendor_id": [str(vendor.id)]
            }
        else:
            print(f"[EVALUATOR] ✗ {vendor.name} - NOT RELEVANT", flush=True)
            logger.info(f"[EVALUATOR] ✗ {vendor.name} - NOT RELEVANT")
            return {
                "relevant_vendors": [],
                "_evaluated_vendor_id": [str(vendor.id)]
            }
            
    except Exception as e:
        vendor_name = vendor_dict.get('name', 'Unknown')
        print(f"[EVALUATOR] CRITICAL ERROR with {vendor_name}: {e}", flush=True)
        print(traceback.format_exc(), flush=True)
        logger.error(f"[EVALUATOR] Error evaluating {vendor_name}: {e}")
        logger.error(traceback.format_exc())
        return {
            "relevant_vendors": [],
            "_evaluated_vendor_id": [str(vendor_dict.get("id"))]
        }
