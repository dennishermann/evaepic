"""
Vendor model definition
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class Vendor(BaseModel):
    """Vendor data model matching the external API response"""
    id: int = Field(description="Unique vendor identifier")
    name: str = Field(description="Vendor company name")
    description: str = Field(description="Vendor description")
    behavioral_prompt: str = Field(description="Behavioral prompt for negotiation agent")
    is_predefined: bool = Field(description="Whether this is a predefined vendor")
    team_id: Optional[int] = Field(default=None, description="Associated team ID")
    documents: List[Dict[str, Any]] = Field(default_factory=list, description="Vendor documents")
    
    # Optional fields for backward compatibility
    api_endpoint: Optional[str] = Field(default=None, description="API endpoint for communication")
    category: List[str] = Field(default_factory=list, description="Product categories this vendor supplies")
    rating: Optional[float] = Field(default=None, description="Vendor rating (0-5)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional vendor information")
    relevant_product_id: Optional[str] = Field(default=None, description="ID of the specific product matched")
