"""
Filter Node (NOT IMPLEMENTED)

Will filter vendors by relevance score threshold.
"""

from typing import Dict, Any


def filter_vendors_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Filter vendors based on relevance scores.
    
    To implement:
    - Apply score threshold
    - Filter out irrelevant vendors
    - Populate state.relevant_vendors
    
    Args:
        state: GraphState with all_vendors and vendor_scores
        
    Returns:
        Dict with updated fields: relevant_vendors, phase
    """
    raise NotImplementedError("Filter node not yet implemented")
