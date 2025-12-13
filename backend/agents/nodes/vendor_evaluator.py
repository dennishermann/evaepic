"""
Vendor Evaluator Node (NOT IMPLEMENTED)

Will use LLM to determine vendor relevance.
"""

from typing import Dict, Any, TypedDict


class EvaluateInput(TypedDict):
    vendor: Dict[str, Any]
    order_requirements: Dict[str, Any]


def evaluate_vendor_node(input_data: EvaluateInput) -> Dict[str, Any]:
    """
    Evaluate a single vendor's relevance to the order.
    
    To implement:
    - Use LLM to analyze vendor capabilities
    - Compare against order requirements
    - Return relevance score (0-100)
    
    Note: This node runs in parallel for each vendor (map operation)
    
    Args:
        input_data: specific input containing 'vendor' and 'order_requirements'
        
    Returns:
        Dict with updated vendor_scores
    """
    raise NotImplementedError("Vendor evaluator node not yet implemented")
