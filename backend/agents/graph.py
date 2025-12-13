"""
Main LangGraph Definition

Constructs the multi-agent negotiation graph with:
- Phase 1: Order extraction
- Phase 2: Vendor filtering (map-reduce)
- Phase 3: Negotiation loop (map-reduce with cycle)
"""

import logging
from typing import Any, Dict, List, Literal
from langgraph.graph import StateGraph, END, START
from langgraph.types import Send

from agents.state import GraphState
from agents.nodes.extractor import extract_order_node
from agents.nodes.database_fetcher import fetch_vendors_node
from agents.nodes.vendor_evaluator import evaluate_vendor_node
from agents.nodes.filter import filter_vendors_node
from agents.nodes.strategist import strategist_node
from agents.nodes.negotiator import negotiate_node
from agents.nodes.aggregator import aggregator_node

logger = logging.getLogger(__name__)


# ========== Conditional Edge Functions ==========

def continue_to_evaluation(state: GraphState) -> List[Send]:
    """
    Fan-out function for parallel vendor evaluation (Map operation).
    
    Creates a Send() object for each vendor to evaluate them in parallel.
    """
    all_vendors = state.get("all_vendors", [])
    order = state.get("order_object", {})
    logger.info(f"[ROUTER] Fanning out to evaluate {len(all_vendors)} vendors in parallel")
    
    # Create a Send for each vendor
    return [
        Send("evaluate_vendor", {
            "vendor": vendor,
            "order_requirements": order
        })
        for vendor in all_vendors
    ]


def continue_to_negotiation(state: GraphState) -> List[Send]:
    """
    Fan-out function for parallel negotiation (Map operation).
    
    Creates a Send() object for each vendor to negotiate with them in parallel.
    """
    relevant_vendors = state.get("relevant_vendors", [])
    vendor_strategies = state.get("vendor_strategies", {})
    rounds_completed = state.get("rounds_completed", 0)
    market_analysis = state.get("market_analysis")
    conversation_ids = state.get("conversation_ids", {})
    leaderboard = state.get("leaderboard", {})
    
    logger.info(f"[ROUTER] Fanning out to negotiate with {len(relevant_vendors)} vendors in parallel")
    
    # Create a Send for each vendor with their strategy
    return [
        Send("negotiate", {
            "vendor_id": vendor["id"],
            "vendor_name": vendor.get("name", "Unknown Vendor"),
            "strategy": vendor_strategies.get(vendor["id"], {}),
            "round_index": rounds_completed,
            "market_analysis": market_analysis,
            "conversation_id": conversation_ids.get(vendor["id"]),
            "last_offer": leaderboard.get(vendor["id"])
        })
        for vendor in relevant_vendors
    ]


def should_continue_negotiation(state: GraphState) -> Literal["continue_negotiating", "end"]:
    """
    Decision gate: Should we continue negotiating or end?
    
    Logic:
    - If best quote <= budget: SUCCESS → end
    - If rounds >= max_rounds: MAX_ROUNDS → end
    - Otherwise: CONTINUE → loop back to strategist
    """
    leaderboard = state.get("leaderboard", {})
    order = state.get("order_object") or {}
    budget = order.get("budget", 20000) if order else 20000
    rounds_completed = state.get("rounds_completed", 0)
    max_rounds = state.get("max_rounds", 3)
    
    if not leaderboard:
        logger.info("[DECISION_GATE] No quotes - ending")
        return "end"
    
    # Find best price
    best_price = min([quote["price"] for quote in leaderboard.values()])
    
    logger.info(f"[DECISION_GATE] Round {rounds_completed}/{max_rounds}, Best: ${best_price:.2f}, Budget: ${budget:.2f}")
    
    # Decision logic
    if best_price <= budget:
        logger.info("[DECISION_GATE] ✓ Found quote within budget - SUCCESS")
        return "end"
    elif rounds_completed >= max_rounds:
        logger.info("[DECISION_GATE] ✗ Max rounds reached - ENDING")
        return "end"
    else:
        logger.info("[DECISION_GATE] → Continuing negotiation")
        return "continue_negotiating"


# ========== Build the Graph ==========

def create_negotiation_graph() -> StateGraph:
    """
    Creates and compiles the negotiation graph.
    
    Returns:
        Compiled StateGraph ready for execution
    """
    logger.info("Building negotiation graph...")
    
    # Initialize graph with state schema
    workflow = StateGraph(GraphState)
    
    # ========== Add Nodes ==========
    workflow.add_node("extract_order", extract_order_node)
    workflow.add_node("fetch_vendors", fetch_vendors_node)
    workflow.add_node("evaluate_vendor", evaluate_vendor_node)
    workflow.add_node("filter_vendors", filter_vendors_node)
    workflow.add_node("strategist", strategist_node)
    workflow.add_node("negotiate", negotiate_node)
    workflow.add_node("aggregator", aggregator_node)
    
    # ========== Define Edges ==========
    
    # Entry point
    workflow.add_edge(START, "extract_order")
    
    # Phase 1: Extraction → Fetching
    workflow.add_edge("extract_order", "fetch_vendors")
    
    # Phase 2: Vendor filtering (Map-Reduce)
    # Map: Fan out to parallel evaluators
    workflow.add_conditional_edges(
        "fetch_vendors",
        continue_to_evaluation,
        ["evaluate_vendor"]
    )
    # Reduce: All evaluators → Filter
    workflow.add_edge("evaluate_vendor", "filter_vendors")
    
    # Phase 3: Negotiation initialization
    workflow.add_edge("filter_vendors", "strategist")
    
    # Phase 3: Negotiation loop (Map-Reduce with cycle)
    # Map: Fan out to parallel negotiators
    workflow.add_conditional_edges(
        "strategist",
        continue_to_negotiation,
        ["negotiate"]
    )
    # Reduce: All negotiators → Aggregator
    workflow.add_edge("negotiate", "aggregator")
    
    # Decision gate: Continue or End
    workflow.add_conditional_edges(
        "aggregator",
        should_continue_negotiation,
        {
            "continue_negotiating": "strategist",  # Loop back
            "end": END
        }
    )
    
    logger.info("Graph built successfully")
    
    # Compile the graph
    return workflow.compile()


# ========== Create the app ==========

# This is the main graph instance that can be imported and used
app = create_negotiation_graph()

logger.info("Negotiation graph compiled and ready")


# ========== Helper function to run the graph ==========

def run_negotiation(user_input: str, webhook_url: str = None, max_rounds: int = 3) -> Dict[str, Any]:
    """
    Helper function to run the negotiation graph.
    
    Args:
        user_input: Raw user request (e.g., "I need 50 laptops for under 20k")
        webhook_url: Optional webhook URL for status updates
        max_rounds: Maximum negotiation rounds (default: 3)
        
    Returns:
        Final state after graph execution
    """
    logger.info("=" * 60)
    logger.info("STARTING NEGOTIATION GRAPH")
    logger.info("=" * 60)
    
    # Initialize state
    initial_state = {
        "user_input": user_input,
        "webhook_url": webhook_url,
        "order_object": None,
        "all_vendors": [],
        "vendor_scores": {},
        "relevant_vendors": [],
        "vendor_strategies": {},
        "negotiation_history": {},
        "leaderboard": {},
        "conversation_ids": {},
        "rounds_completed": 0,
        "max_rounds": max_rounds,
        "market_analysis": None,
        "final_comparison_report": None,
        "phase": "starting",
        "error": None
    }
    
    # Run the graph
    final_state = app.invoke(initial_state)
    
    logger.info("=" * 60)
    logger.info("NEGOTIATION GRAPH COMPLETED")
    logger.info("=" * 60)
    
    return final_state
