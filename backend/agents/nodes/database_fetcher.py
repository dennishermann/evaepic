"""
Database Fetcher Node (NOT IMPLEMENTED)

Will fetch vendors from external API.
"""

from typing import Dict, Any


def fetch_vendors_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch vendors from external API.
    
    To implement:
    - Call external vendor API
    - Retrieve all potential vendors
    - Populate state.all_vendors
    
    Args:
        state: GraphState
        
    Returns:
        Dict with updated fields: all_vendors, phase
    """
    raise NotImplementedError("Database fetcher node not yet implemented")
