"""
Order model definition

Reused from the ObjectExtractor agent.
"""

from pydantic import BaseModel, Field
from typing import List


class QuantityRange(BaseModel):
    """Quantity details"""
    min: int = Field(description="Minimum quantity needed")
    max: int = Field(description="Maximum quantity willing to order")
    preferred: int = Field(description="Preferred/target quantity")


class Requirements(BaseModel):
    """Order requirements"""
    mandatory: List[str] = Field(description="Must-have requirements")
    optional: List[str] = Field(description="Nice-to-have requirements")


class OrderObject(BaseModel):
    """Structured order object extracted from user input"""
    item: str = Field(description="The product/item being ordered")
    quantity: QuantityRange = Field(description="Quantity range")
    budget: float = Field(description="Budget amount in numeric form")
    currency: str = Field(description="Currency code (USD, EUR, etc)")
    requirements: Requirements = Field(description="Mandatory and optional requirements")
    urgency: str = Field(description="Delivery urgency: low, medium, high, urgent")
