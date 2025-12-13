import os
from typing import List
from pydantic import BaseModel, Field
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

from backend.models.order import OrderObject, QuantityRange, Requirements
from backend.models.vendor import Vendor


class SuitabilityResult(BaseModel):
    """YES or NO - can this vendor deliver?"""
    suitable: bool = Field(description="YES (True) or NO (False)")
    reasoning: str = Field(description="One sentence why")


class RelevantVendorEvaluatorAgent:
    """Simple YES/NO filter - can vendor deliver the product?"""

    def __init__(self):
        self.llm = ChatAnthropic(
            model="claude-3-haiku-20240307", # Changed model name to a widely available one
            temperature=0
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

""") # Removed 'YES or NO?'
        ])
        
        self.chain = self.prompt | self.llm | self.parser

    def evaluate(self, vendor: Vendor, order: OrderObject) -> bool:
        """
        Returns: True (YES) or False (NO)
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
            
            print(f"{'✅ YES' if result.suitable else '❌ NO'} - {vendor.name}: {result.reasoning}")
            return result.suitable
            
        except Exception as e:
            print(f"❌ ERROR - {vendor.name}: {e}")
            return False


def evaluate_vendors_for_order(
    vendor: Vendor,
    order: OrderObject
) -> bool:
    """
    Returns: List of vendors who can deliver (filtered to YES only)
    """
    agent = RelevantVendorEvaluatorAgent()
    return agent.evaluate(vendor, order)


# ============================================================
# TESTS FOR COLAB
# ============================================================

if __name__ == "__main__":
    print("="*60)
    print("VENDOR EVALUATOR - YES/NO TEST")
    print("="*60)

    # Test vendors
    vendor1 = Vendor(
        id=1,
        name="Giuseppe (Steel Supplier)",
        description="Italian steel supplier",
        behavioral_prompt="Warm Italian",
        is_predefined=True,
        team_id=20,
        documents=[],
        api_endpoint="",
        category=["Steel", "Metal"],
        rating=4.8,
        metadata={}
    )
    
    vendor2 = Vendor(
        id=2,
        name="Diana (Electronics)", # Removed extra closing parenthesis here
        description="Electronics supplier",
        behavioral_prompt="Aggressive",
        is_predefined=True,
        team_id=20,
        documents=[],
        api_endpoint="",
        category=["Electronics", "Arduino"],
        rating=4.2,
        metadata={}
    )
    
    vendor3 = Vendor(
        id=3,
        name="Bob (Fruits)",
        description="Fruit supplier",
        behavioral_prompt="Friendly",
        is_predefined=False,
        team_id=20,
        documents=[],
        api_endpoint="",
        category=["Fruits", "Food"],
        rating=4.5,
        metadata={}
    )

    # TEST 1: Steel order
    print("\nTEST 1: Who can deliver STEEL?")
    order1 = OrderObject(
        item="steel beams",
        quantity=QuantityRange(min=500, max=6000, preferred=5000),
        budget=50000,
        currency="EUR",
        urgency="medium",
        requirements=Requirements(mandatory=[], optional=[])
    )
    
    suitable1 = evaluate_vendors_for_order(vendor2, order1)
    print(f"Answer: {suitable1}")

    # TEST 2: Arduino order
    print("\nTEST 2: Who can deliver ARDUINO?")
    order2 = OrderObject(
        item="Arduino boards",
        quantity=QuantityRange(min=100, max=200, preferred=150),
        budget=3000,
        currency="USD",
        urgency="high",
        requirements=Requirements(mandatory=[], optional=[])
    )
    
    suitable2 = evaluate_vendors_for_order(vendor1, order2)
    print(f"Answer: {suitable1}")

    print("\n" + "="*60)
    print("DONE ✅")
    print("="*60)