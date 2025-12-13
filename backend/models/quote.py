"""
Quote model definition
"""

from pydantic import BaseModel, Field
from typing import List
from datetime import datetime


class Quote(BaseModel):
    """Quote data model representing a vendor's offer"""
    vendor_id: str = Field(description="ID of the vendor providing the quote")
    price: float = Field(description="Total price offered")
    currency: str = Field(description="Currency code (USD, EUR, etc)")
    quantity: int = Field(description="Quantity quoted for")
    delivery_time: str = Field(description="Estimated delivery time")
    terms: List[str] = Field(default_factory=list, description="Terms and conditions")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="When this quote was generated")
    sentiment: str = Field(default="neutral", description="Vendor sentiment: positive, neutral, negative")
