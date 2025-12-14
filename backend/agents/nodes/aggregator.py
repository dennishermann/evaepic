"""
Aggregator Node

Analyzes all vendor offers, computes market benchmarks, ranks vendors,
and provides feedback for the next negotiation round.
"""

import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from statistics import median

logger = logging.getLogger(__name__)


class MarketBenchmarks(BaseModel):
    """Market pricing benchmarks"""
    best_price: Optional[float] = Field(default=None, description="Lowest price offered")
    median_price: Optional[float] = Field(default=None, description="Median price across all offers")
    spread_percent: Optional[float] = Field(default=None, description="Price spread as percentage of best price")
    total_vendors: int = Field(description="Total number of vendors with offers")


class VendorRanking(BaseModel):
    """Vendor ranking information"""
    vendor_id: str = Field(description="Vendor identifier")
    vendor_name: str = Field(description="Vendor name")
    rank: int = Field(description="Rank (1 = best)")
    score: float = Field(description="Calculated score")
    price: float = Field(description="Price offered")
    reason: str = Field(description="Reason for ranking")


class VendorOverride(BaseModel):
    """Specific guidance for a vendor in next round"""
    suggested_next_move: str = Field(description="Suggested action for next round")
    pressure_level: str = Field(description="Pressure level: low, medium, high")
    walkaway_recommended: bool = Field(default=False, description="Should we walk away from this vendor")
    reference_price: Optional[float] = Field(default=None, description="Best competitor price to reference")


class MarketAnalysis(BaseModel):
    """Complete market analysis for current round"""
    round_index: int = Field(description="Current round number")
    benchmarks: MarketBenchmarks = Field(description="Market benchmarks")
    rankings: List[VendorRanking] = Field(description="Vendor rankings")
    vendor_overrides: Dict[str, VendorOverride] = Field(description="Vendor-specific guidance")
    summary: str = Field(description="Overall market summary")


class VendorComparison(BaseModel):
    """Final comparison for a single vendor"""
    vendor_id: str = Field(description="Vendor identifier")
    vendor_name: str = Field(description="Vendor name")
    final_offer: Dict[str, Any] = Field(description="Final offer details")
    rank: int = Field(description="Final rank")
    score: float = Field(description="Final score")
    delta_to_best: Optional[float] = Field(default=None, description="Price difference from best offer")
    status: str = Field(description="Status: completed, walked_away, no_offer")


class FinalComparisonReport(BaseModel):
    """Final comparison report for human decision"""
    recommended_vendor_id: str = Field(description="Recommended vendor ID")
    recommended_vendor_name: str = Field(description="Recommended vendor name")
    recommendation_reason: str = Field(description="Why this vendor is recommended")
    vendors: List[VendorComparison] = Field(description="All vendor comparisons")
    human_action: str = Field(default="Select supplier and confirm purchase", description="Next action for human")
    market_summary: str = Field(description="Overall market summary")


def calculate_vendor_score(offer: Dict[str, Any], best_price: float, order: Dict[str, Any]) -> float:
    """
    Calculate vendor score based on offer.
    
    Scoring rules:
    - Price: 60% weight (lower is better)
    - Delivery: 25% weight (faster is better)
    - Payment terms: 15% weight
    
    Args:
        offer: Vendor's offer snapshot
        best_price: Best price in market
        order: Order requirements
        
    Returns:
        Score (0-100, higher is better)
    """
    score = 0.0
    
    # Price score (60% weight)
    price = offer.get("price_total")
    if price and best_price:
        # Inverse relationship: lower price = higher score
        price_ratio = best_price / price
        price_score = min(100, price_ratio * 100)
        score += price_score * 0.6
    
    # Delivery score (25% weight)
    delivery_days = offer.get("delivery_days")
    if delivery_days:
        # Assume reasonable range: 1-30 days
        # Lower days = higher score
        delivery_score = max(0, 100 - (delivery_days * 3))
        score += delivery_score * 0.25
    else:
        # No delivery info = average score
        score += 50 * 0.25
    
    # Payment terms score (15% weight)
    payment_terms = offer.get("payment_terms") or ""
    if "net 30" in payment_terms.lower() or "30 days" in payment_terms.lower():
        score += 80 * 0.15
    elif "net 60" in payment_terms.lower() or "60 days" in payment_terms.lower():
        score += 60 * 0.15
    elif "advance" in payment_terms.lower() or "upfront" in payment_terms.lower():
        score += 40 * 0.15
    else:
        score += 50 * 0.15
    
    return round(score, 2)


def create_market_analysis(leaderboard: Dict[str, Dict[str, Any]], order: Dict[str, Any], rounds_completed: int) -> MarketAnalysis:
    """
    Create market analysis from current leaderboard.
    """
    # Filter valid offers (must have price)
    valid_offers = {}
    for vid, offer in leaderboard.items():
        # Ensure offer is a dict
        if not isinstance(offer, dict):
             if hasattr(offer, "model_dump"):
                 offer = offer.model_dump()
             else:
                 offer = dict(offer)
                 
        if offer.get("price_total") and float(offer.get("price_total", 0)) > 0:
            valid_offers[vid] = offer
            
    if not valid_offers:
        return MarketAnalysis(
            round_index=rounds_completed,
            benchmarks=MarketBenchmarks(total_vendors=0),
            rankings=[],
            vendor_overrides={},
            summary="No valid offers received yet"
        )
    
    # Calculate benchmarks
    quantity = order.get("quantity", {}).get("preferred", 1)
    
    prices = [float(offer["price_total"]) * quantity for offer in valid_offers.values()]
    best_price = min(prices)
    median_price = median(prices) if len(prices) > 1 else best_price
    spread = ((max(prices) - best_price) / best_price * 100) if best_price > 0 else 0
    
    benchmarks = MarketBenchmarks(
        best_price=best_price,
        median_price=median_price,
        spread_percent=round(spread, 2),
        total_vendors=len(valid_offers)
    )
    
    logger.info(f"[AGGREGATOR] Benchmarks: Best=${best_price:.2f}, Median=${median_price:.2f}, Spread={spread:.1f}%")
    
    # Calculate scores and rank vendors
    scored_vendors = []
    for vendor_id_raw, offer in valid_offers.items():
        score = calculate_vendor_score(offer, best_price, order)
        
        # Safe string conversion
        vendor_id_str = str(vendor_id_raw)
        if hasattr(offer, "get"):
             v_name = offer.get("vendor_name", "Unknown")
             v_unit_price = float(offer.get("price_total", 0))
             v_price = v_unit_price * quantity
        else:
             v_name = "Unknown"
             v_price = 0
             
        scored_vendors.append({
            "vendor_id": vendor_id_str,
            "vendor_name": v_name,
            "score": score,
            "price": v_price,
            "offer": offer
        })
    
    # Sort by score (descending)
    scored_vendors.sort(key=lambda x: x["score"], reverse=True)
    
    # Create rankings
    rankings = []
    for rank, v_data in enumerate(scored_vendors, 1):
        price = float(v_data["price"]) if v_data["price"] else 0.0
        delta = price - best_price if price else 0
        
        if rank == 1:
            reason = f"Best overall offer: ${price:.2f}"
        elif delta < best_price * 0.05:
            reason = f"Competitive: ${price:.2f} (${delta:.2f} above best)"
        else:
            reason = f"Higher price: ${price:.2f} (${delta:.2f} above best)"
        
        rankings.append(VendorRanking(
            vendor_id=v_data["vendor_id"], # Already str
            vendor_name=v_data["vendor_name"],
            rank=rank,
            score=v_data["score"],
            price=price,
            reason=reason
        ))
    
    # Create vendor-specific overrides for next round
    budget = order.get("budget", float('inf'))
    if not budget or budget == 0:
        budget = float('inf')
        
    vendor_overrides = {}
    
    for v_data in scored_vendors:
        try:
            vendor_id = v_data["vendor_id"]
            price = float(v_data["price"]) if v_data["price"] else 0.0
            # We need to find the rank from the iteration.
            current_rank = scored_vendors.index(v_data) + 1
        except Exception as e:
            print(f"DEBUG: CRASH in overrides loop. v_data type: {type(v_data)}", flush=True)
            print(f"DEBUG: v_data content: {v_data}", flush=True)
            raise e
        
        # Determine pressure level and suggested move
        if current_rank == 1:
            # Best vendor: maintain position
            override = VendorOverride(
                suggested_next_move="You have the best offer. Can you provide any additional value or services?",
                pressure_level="low",
                walkaway_recommended=False,
                reference_price=best_price
            )
        else:
            delta = price - best_price
            delta_percent = (delta / best_price * 100) if best_price > 0 else 0
            
            if price > budget * 1.1:
                # Far above budget: recommend walk-away
                override = VendorOverride(
                    suggested_next_move=f"Your price of ${price:.2f} significantly exceeds our budget. We may need to consider other options.",
                    pressure_level="high",
                    walkaway_recommended=True,
                    reference_price=best_price
                )
            elif delta_percent > 15:
                # Significantly higher: high pressure
                override = VendorOverride(
                    suggested_next_move=f"We have an offer at ${best_price:.2f}. To move forward, we need you to match or beat this price.",
                    pressure_level="high",
                    walkaway_recommended=False,
                    reference_price=best_price
                )
            elif delta_percent > 5:
                # Moderately higher: medium pressure
                override = VendorOverride(
                    suggested_next_move=f"Your offer is competitive, but we have a better price at ${best_price:.2f}. Can you improve your terms?",
                    pressure_level="medium",
                    walkaway_recommended=False,
                    reference_price=best_price
                )
            else:
                # Close to best: low pressure
                override = VendorOverride(
                    suggested_next_move=f"You're very close to the best offer at ${best_price:.2f}. Any improvement would be appreciated.",
                    pressure_level="low",
                    walkaway_recommended=False,
                    reference_price=best_price
                )
        
        vendor_overrides[vendor_id] = override
    
    # Create summary
    if best_price <= budget:
        summary = f"MARKET STATUS: SUCCESS. Best offer is ${best_price:.2f} (Budget: ${budget:.2f}). You can accept this or try to get slightly lower."
    else:
        summary = f"MARKET STATUS: EXCEEDS BUDGET. Best offer is ${best_price:.2f} (Budget: ${budget:.2f}). YOU MUST NEGOTIATE LOWER."
    
    return MarketAnalysis(
        round_index=rounds_completed,
        benchmarks=benchmarks,
        rankings=rankings,
        vendor_overrides=vendor_overrides,
        summary=summary
    )


def create_final_comparison_report(leaderboard: Dict[str, Dict[str, Any]], order: Dict[str, Any]) -> FinalComparisonReport:
    """
    Create final comparison report for human decision-making.
    
    Args:
        leaderboard: Final offers from all vendors
        order: Order requirements
        
    Returns:
        FinalComparisonReport with recommendation
    """
    # Filter valid offers
    valid_offers = {vid: offer for vid, offer in leaderboard.items() if offer.get("price_total") is not None}
    
    if not valid_offers:
        logger.warning("[AGGREGATOR] No valid offers for final report")
        return FinalComparisonReport(
            recommended_vendor_id="none",
            recommended_vendor_name="None",
            recommendation_reason="No valid offers received",
            vendors=[],
            human_action="Review negotiation logs and consider alternative suppliers",
            market_summary="No successful negotiations"
        )
    
    # Calculate scores
    quantity = order.get("quantity", {}).get("preferred", 1)
    prices = [float(offer["price_total"]) * quantity for offer in valid_offers.values()]
    best_price = min(prices)
    
    vendor_comparisons = []
    for vendor_id_raw, offer in valid_offers.items():
        score = calculate_vendor_score(offer, best_price, order)
        unit_price = offer.get("price_total")
        
        if unit_price is not None:
            price = float(unit_price) * quantity
            delta = price - best_price
        else:
            price = None
            delta = None
        
        # Update final offer with total price for display
        final_offer_dict = dict(offer)
        final_offer_dict["price_total"] = price
        if "final_price" in final_offer_dict and final_offer_dict["final_price"]:
            final_offer_dict["final_price"] = float(final_offer_dict["final_price"]) * quantity

        vendor_comparisons.append({
            "vendor_id": str(vendor_id_raw),
            "vendor_name": offer.get("vendor_name", "Unknown"),
            "final_offer": final_offer_dict,
            "score": score,
            "delta": delta,
            "status": offer.get("status", "completed")
        })
    
    # Sort by score
    vendor_comparisons.sort(key=lambda x: x["score"], reverse=True)
    
    # Assign ranks
    comparisons_list = []
    for rank, vc in enumerate(vendor_comparisons, 1):
        # Extract summary if available, else fall back to default string
        offer_data = vc["final_offer"]
        summary = offer_data.get("final_offer_summary")
        if not summary:
            # Fallback construction
            price = offer_data.get("price_total")
            currency = offer_data.get("currency", "USD")
            items = offer_data.get("bundled_items", [])
            item_str = f" ({', '.join(items)})" if items else ""
            summary = f"Offer of {currency} {price}{item_str}"
            
        comparisons_list.append(VendorComparison(
            vendor_id=vc["vendor_id"],
            vendor_name=vc["vendor_name"],
            final_offer=vc["final_offer"],
            rank=rank,
            score=vc["score"],
            delta_to_best=vc["delta"],
            status=vc["status"]
        ))
    
    # Recommend best vendor
    if comparisons_list:
        best_vendor = comparisons_list[0]
        recommended_id = best_vendor.vendor_id
        recommended_name = best_vendor.vendor_name
        
        # Use exact final price usually carried in the offer dict
        # We've already updated final_offer in the comparing loop to be total price
        final_price = best_vendor.final_offer.get("final_price") or best_vendor.final_offer.get("price_total")
        offer_summary = best_vendor.final_offer.get("final_offer_summary", f"${final_price}")
        
        budget = order.get("budget", float('inf'))
        if final_price and final_price <= budget:
            reason = f"Best Value Option: {offer_summary} (Within Budget)"
        else:
            reason = f"Best Available Option: {offer_summary}"
            
        if best_vendor.status == "finalized":
            reason += " - DEAL AGREED"
    else:
        recommended_id = "none"
        recommended_name = "None"
        reason = "No valid offers available."

    market_summary = f"Evaluated {len(valid_offers)} vendors. Price range: ${best_price:.2f} - ${max(prices):.2f}"
    
    logger.info(f"[AGGREGATOR] Final recommendation: {recommended_name} - {reason}")
    
    return FinalComparisonReport(
        recommended_vendor_id=recommended_id,
        recommended_vendor_name=recommended_name,
        recommendation_reason=reason,
        vendors=comparisons_list,
        human_action="Review the recommendation and confirm your selection to proceed with purchase",
        market_summary=market_summary
    )


def aggregator_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Aggregate negotiation results and provide market analysis.
    
    This node:
    1. Collects all current offers from leaderboard
    2. Calculates market benchmarks (best/median/spread)
    3. Ranks vendors by score
    4. Generates vendor-specific feedback for next round
    5. Creates final comparison report if negotiation is complete
    
    Args:
        state: GraphState with leaderboard, rounds_completed, order_object
        
    Returns:
        Dict with updated fields: rounds_completed, market_analysis, phase
    """
    logger.info("=" * 60)
    logger.info("[AGGREGATOR] Starting market analysis")
    logger.info("=" * 60)
    
    leaderboard = state.get("leaderboard", {})
    rounds_completed = state.get("rounds_completed", 0)
    max_rounds = state.get("max_rounds", 3)
    order = state.get("order_object", {})
    
    # Increment round counter
    rounds_completed += 1
    
    logger.info(f"[AGGREGATOR] Round {rounds_completed}/{max_rounds} completed")
    logger.info(f"[AGGREGATOR] Analyzing {len(leaderboard)} vendor offers")
    print(f"[AGGREGATOR] Analyzing round {rounds_completed} results ({len(leaderboard)} offers)...", flush=True)
    
    # Create market analysis
    market_analysis = create_market_analysis(leaderboard, order, rounds_completed)
    
    # Log analysis results
    logger.info(f"[AGGREGATOR] Market Summary: {market_analysis.summary}")
    if market_analysis.benchmarks.best_price:
        logger.info(f"[AGGREGATOR] Best Price: ${market_analysis.benchmarks.best_price:.2f}")
    if market_analysis.benchmarks.median_price:
        logger.info(f"[AGGREGATOR] Median Price: ${market_analysis.benchmarks.median_price:.2f}")
    
    logger.info(f"[AGGREGATOR] Vendor Rankings:")
    if market_analysis.benchmarks.best_price:
        print(f"[AGGREGATOR] Market Analysis: Best=${market_analysis.benchmarks.best_price:.2f} | Median=${market_analysis.benchmarks.median_price:.2f}", flush=True)
    for ranking in market_analysis.rankings:
        logger.info(f"[AGGREGATOR]   {ranking.rank}. {ranking.vendor_name} (score: {ranking.score:.1f}) - {ranking.reason}")
        print(f"[AGGREGATOR]   #{ranking.rank} {ranking.vendor_name}: ${ranking.price} (Score: {ranking.score:.1f})", flush=True)
    
    # Create final comparison report (will be used if negotiation ends)
    final_report = create_final_comparison_report(leaderboard, order)
    
    logger.info("=" * 60)
    
    return {
        "rounds_completed": rounds_completed,
        "market_analysis": market_analysis.model_dump(),
        "final_comparison_report": final_report.model_dump(),
        "phase": "negotiation"
    }
