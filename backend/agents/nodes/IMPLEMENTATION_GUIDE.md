# EVAEPIC Negotiation Nodes Implementation

## Overview

This document describes the complete implementation of the three core negotiation nodes for the EVAEPIC multi-agent procurement negotiation system.

## Implemented Nodes

### 1. Strategist Node (`agents/nodes/strategist.py`)

**Purpose**: Generates vendor-specific negotiation strategies based on vendor behavioral profiles and order requirements.

**Key Features**:
- Fetches detailed vendor information from external API (including `behavioral_prompt`)
- Uses Claude Sonnet 4 (via Anthropic) with structured output to generate comprehensive strategies
- Creates tailored `StrategyPlan` for each vendor with:
  - Price targets (anchor, target, walk-away)
  - Communication tone and approach
  - Key arguments and ordered concessions
  - Opening message customized to vendor personality
  - Behavioral notes and assumptions

**Data Models**:
- `PriceTargets`: Anchor, target, and walk-away prices
- `StrategyPlan`: Complete negotiation strategy for a vendor

**Configuration** (all via environment variables):
- `MAX_NEGOTIATION_ROUNDS`: Maximum negotiation rounds (default: 2)
- `NEGOTIATION_API_BASE`: External negotiation bot API endpoint
- `NEGOTIATION_TEAM_ID`: Team identifier for API calls
- `ANTHROPIC_API_KEY`: Anthropic API key for Claude models

**Output**: Updates state with `vendor_strategies` dict (vendor_id → StrategyPlan)

---

### 2. Negotiator Node (`agents/nodes/negotiator.py`)

**Purpose**: Executes negotiations with vendors via the external API, adapting based on strategy and market feedback.

**Key Features**:
- Creates and manages conversations with vendors via API
- Composes messages based on:
  - Initial round: Uses opening message from strategy
  - Subsequent rounds: Applies competitive pressure using market analysis
- Extracts offer details from vendor responses (price, delivery, payment terms)
- Implements walk-away logic when offers exceed limits
- Maintains conversation continuity across rounds

**Data Models**:
- `NegotiateInput`: Input parameters for parallel execution
- `OfferSnapshot`: Snapshot of vendor's current offer with extracted details

**API Integration**:
- `POST /conversations/?team_id=TEAM_ID`: Create conversation
- `POST /messages/{conversation_id}`: Send message and receive response

**Extraction Logic**:
- Price: Regex patterns for $1,234.56, 1234.56 USD, etc.
- Delivery: Patterns for "5 days", "2 weeks", etc.
- Payment terms: Keyword matching for common terms
- Currency: Detection of $, USD, €, EUR

**Output**: Updates state with:
- `negotiation_history`: Message history per vendor
- `leaderboard`: Latest offer per vendor
- `conversation_ids`: Conversation tracking per vendor

---

### 3. Aggregator Node (`agents/nodes/aggregator.py`)

**Purpose**: Analyzes all vendor offers, computes market benchmarks, ranks vendors, and provides feedback for the next negotiation round.

**Key Features**:
- Calculates market benchmarks:
  - Best price (minimum)
  - Median price
  - Price spread percentage
- Scores vendors using weighted algorithm:
  - Price: 60% weight
  - Delivery: 25% weight
  - Payment terms: 15% weight
- Generates vendor-specific overrides for next round:
  - Suggested next move
  - Pressure level (low/medium/high)
  - Walk-away recommendations
  - Reference prices for competitive pressure
- Creates final comparison report for human decision-making

**Data Models**:
- `MarketBenchmarks`: Price statistics across all offers
- `VendorRanking`: Ranking with score and reasoning
- `VendorOverride`: Next-round guidance per vendor
- `MarketAnalysis`: Complete market analysis
- `VendorComparison`: Final vendor comparison
- `FinalComparisonReport`: Human-readable recommendation

**Scoring Algorithm**:
```
Score = (Price Score × 0.6) + (Delivery Score × 0.25) + (Payment Score × 0.15)

Price Score: best_price / current_price × 100
Delivery Score: max(0, 100 - (delivery_days × 3))
Payment Score: 80 (net 30), 60 (net 60), 40 (advance), 50 (default)
```

**Pressure Levels**:
- **High**: Price > 15% above best OR > 110% of budget
- **Medium**: Price 5-15% above best
- **Low**: Price < 5% above best

**Output**: Updates state with:
- `rounds_completed`: Incremented round counter
- `market_analysis`: Complete market analysis
- `final_comparison_report`: Final recommendation

---

## System Architecture

### State Management

The system uses `GraphState` (in `agents/state.py`) with the following negotiation fields:

```python
vendor_strategies: Dict[str, dict]          # Strategy per vendor
negotiation_history: Dict[str, List[dict]] # Message history per vendor
leaderboard: Dict[str, dict]               # Latest offer per vendor
conversation_ids: Dict[str, str]            # Conversation tracking
rounds_completed: int                       # Current round
max_rounds: int                             # Maximum rounds
market_analysis: Optional[dict]             # Market analysis from aggregator
final_comparison_report: Optional[dict]     # Final report
```

### Workflow

1. **Strategist Phase** (once per negotiation):
   - Fetches vendor details with behavioral prompts
   - Generates StrategyPlan for each vendor
   - Sets `max_rounds` from configuration

2. **Negotiation Loop** (repeats until max_rounds or success):
   - **Negotiator** (parallel for each vendor):
     - Creates/reuses conversation
     - Composes message (initial or competitive)
     - Sends to API and receives response
     - Extracts offer details
     - Updates history and leaderboard
   
   - **Aggregator** (after all negotiators complete):
     - Analyzes all offers
     - Calculates benchmarks
     - Ranks vendors
     - Generates feedback for next round
     - Increments round counter
   
   - **Decision Gate** (in graph):
     - If best price ≤ budget: END (success)
     - If rounds ≥ max_rounds: END (max reached)
     - Otherwise: Loop back to Strategist

3. **Output**:
   - `FinalComparisonReport` with recommended vendor
   - Complete negotiation history
   - Market analysis and rankings

---

## Closed-Loop Feedback

The key innovation is the closed-loop feedback mechanism:

1. **Round 1**: Negotiators send initial messages based on strategies
2. **Aggregator** analyzes responses, finds best price
3. **Round 2**: Negotiators reference best price to pressure other vendors
   - Example: "We have an offer at $X. Can you match or beat it?"
4. **Aggregator** re-analyzes with improved offers
5. Process continues until success or max rounds

This creates competitive pressure and drives better deals.

---

## Configuration

### Environment Variables

All configurations are now stored in `.env` file:

```bash
# Anthropic API Key (for Claude models)
ANTHROPIC_API_KEY=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

# Negotiation Bot API Configuration
NEGOTIATION_API_BASE=https://negbot-backend-ajdxh9axb0ddb0e9.westeurope-01.azurewebsites.net/api
NEGOTIATION_TEAM_ID=989290

# Negotiation Settings
MAX_NEGOTIATION_ROUNDS=2
```

### LLM Configuration

The system uses **Claude Sonnet 4** (via Anthropic) for:
- Strategy generation in Strategist node
- All LLM-powered decision making

Model: `claude-sonnet-4-20250514`

---

## Testing & Demo

### Debug Logging

All nodes include comprehensive logging:
- Vendor being negotiated
- Current best benchmark
- Round count
- Extracted offer numbers
- Pressure levels applied
- Walk-away decisions

### Example Log Output

```
[STRATEGIST] Creating strategies for 3 vendors
[STRATEGIST] Processing vendor: TechSupplier Inc (ID: vendor_123)
[STRATEGIST] ✓ Strategy created for TechSupplier Inc
[STRATEGIST]   Objective: Secure competitive pricing for 100 laptops
[STRATEGIST]   Price targets: $14000.00 → $16000.00 (walk-away: $19000.00)

[NEGOTIATOR] Negotiating with TechSupplier Inc (Round 0)
[NEGOTIATOR] Created new conversation: conv_456
[NEGOTIATOR] ✓ Negotiation round 0 completed
[NEGOTIATOR]   Price: $17500.00 USD
[NEGOTIATOR]   Delivery: 7 days

[AGGREGATOR] Round 1/2 completed
[AGGREGATOR] Best Price: $16500.00
[AGGREGATOR] Vendor Rankings:
[AGGREGATOR]   1. BudgetTech (score: 95.2) - Best overall offer
[AGGREGATOR]   2. TechSupplier Inc (score: 87.3) - Competitive: $17500.00 ($1000 above best)

[NEGOTIATOR] Round 1: Pressure level = medium
[NEGOTIATOR] Vendor vendor_123: Applying competitive pressure ($1000.00 gap)
```

---

## Error Handling

All nodes include robust error handling:
- API timeouts (10-20 second timeouts)
- Failed API calls (with fallbacks)
- Invalid vendor responses
- Missing data (graceful degradation)
- Walk-away scenarios

Example fallback behavior:
- If vendor API fails: Creates basic fallback strategy
- If price extraction fails: Continues with None (logged)
- If conversation creation fails: Returns error state

---

## Dependencies Added

Updated `pyproject.toml` with:
```toml
"pydantic>=2.0.0",
"requests>=2.31.0",
```

---

## Integration with Existing Code

The implementation integrates seamlessly with existing nodes:
- Uses existing `GraphState` structure
- Follows existing node patterns (database_fetcher, extractor, filter, vendor_evaluator)
- Compatible with existing `OrderObject` and `Vendor` models
- Leverages existing LangGraph orchestration in `agents/graph.py`

---

## Files Modified

1. `agents/nodes/strategist.py` - Complete implementation (282 lines)
2. `agents/nodes/negotiator.py` - Complete implementation (380 lines)
3. `agents/nodes/aggregator.py` - Complete implementation (424 lines)
4. `agents/state.py` - Added market_analysis, final_comparison_report, conversation_ids
5. `agents/graph.py` - Updated continue_to_negotiation to pass state data
6. `backend/pyproject.toml` - Added pydantic and requests dependencies

---

## Next Steps

1. The `.env` file has been created with your Anthropic API key and all configurations
2. Install updated dependencies: `uv pip install -e .` or `pip install -e .`
3. Implement stub nodes (database_fetcher, filter, vendor_evaluator) if needed
4. Test with real vendor API
5. Monitor debug logs during execution
6. Adjust MAX_NEGOTIATION_ROUNDS in `.env` based on results

---

## Summary

All three nodes are fully implemented with:
- ✅ External API integration (conversations, messages)
- ✅ LLM-powered strategy generation
- ✅ Offer extraction from natural language
- ✅ Market analysis and vendor ranking
- ✅ Closed-loop feedback mechanism
- ✅ Comprehensive error handling
- ✅ Debug logging for demo reliability
- ✅ Configurable parameters
- ✅ Type-safe Pydantic models
- ✅ Full state management
- ✅ Human-readable reports

The system is ready for hackathon demonstration.
