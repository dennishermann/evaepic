"""
Aggregator Node (NOT IMPLEMENTED)

Will analyze all quotes and make decisions.
"""

from typing import Dict, Any


def aggregator_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Aggregate negotiation results and decide next action.
    
    To implement:
    - Collect all quotes from negotiators
    - Update leaderboard with best prices
    - Compare against budget constraint
    - Decide: SUCCESS (found good deal) or CONTINUE (negotiate more) or FAIL (max rounds)
    - If CONTINUE: generate new strategies based on competitor prices
    
    Args:
        state: GraphState with leaderboard and rounds_completed
        
    Returns:
        Dict with updated fields: rounds_completed, vendor_strategies (if continuing)
    """
    raise NotImplementedError("Aggregator node not yet implemented")
