"""
State schema for the LangGraph negotiation system.

The GraphState defines all data that flows through the graph nodes.
"""

from typing import TypedDict, Dict, List, Optional, Annotated


def merge_dicts(left: dict, right: dict) -> dict:
    """Merge two dictionaries, with right values taking precedence"""
    return {**left, **right}


def merge_lists(left: list, right: list) -> list:
    """Merge two lists by concatenation"""
    return left + right


class GraphState(TypedDict):
    """
    Main state object that flows through all nodes in the graph.
    
    Each node receives this state and can update specific fields by returning
    a dict with the keys to update.
    
    Note: Fields updated by parallel nodes (map operations) must use Annotated
    with a reducer function to handle concurrent updates.
    """
    
    # ========== Input ==========
    user_input: str
    webhook_url: Optional[str]
    
    # ========== Phase 1: Order Extraction ==========
    order_object: Optional[dict]  # Will contain OrderObject data
    
    # ========== Phase 2: Vendor Filtering ==========
    all_vendors: List[dict]  # List of Vendor objects from API
    # Annotated because parallel evaluators update this concurrently
    relevant_vendors: Annotated[List[dict], merge_lists]  # Vendors that passed yes/no evaluation
    
    # ========== Phase 3: Negotiation ==========
    vendor_strategies: Dict[str, str]  # vendor_id -> strategy instruction
    # Annotated because parallel negotiators update this concurrently
    negotiation_history: Annotated[Dict[str, List[dict]], merge_dicts]  # vendor_id -> list of messages
    # Annotated because parallel negotiators update this concurrently
    leaderboard: Annotated[Dict[str, dict], merge_dicts]  # vendor_id -> latest Quote object
    # Annotated because parallel negotiators update this concurrently
    conversation_ids: Annotated[Dict[str, str], merge_dicts]  # vendor_id -> conversation_id
    rounds_completed: int
    max_rounds: int
    market_analysis: Optional[dict]  # Market analysis from aggregator
    final_comparison_report: Optional[dict]  # Final comparison report
    
    # ========== Meta ==========
    phase: str  # Current phase: "extraction", "filtering", "negotiation", "complete"
    error: Optional[str]  # Error message if something goes wrong
