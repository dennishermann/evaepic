"""
Vendor model definition
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class Vendor(BaseModel):
    """Vendor data model"""
    id: str = Field(description="Unique vendor identifier")
    name: str = Field(description="Vendor company name")
    api_endpoint: str = Field(description="API endpoint for communication")
    category: List[str] = Field(description="Product categories this vendor supplies")
    rating: Optional[float] = Field(default=None, description="Vendor rating (0-5)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional vendor information")
