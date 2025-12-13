# LangGraph Multi-Agent Negotiation System

This directory contains the LangGraph-based multi-agent system for automated vendor negotiation.

## Architecture

The system consists of three phases:

### Phase 1: Order Extraction
- **Node**: `extract_order_node`
- **Purpose**: Convert raw user input into structured `OrderObject`
- **Status**: ✅ Fully implemented (adapted from `objectextractor.py`)

### Phase 2: Vendor Filtering (Map)
- **Nodes**: `fetch_vendors_node` → `evaluate_vendor_node` (parallel)
- **Purpose**: Fetch vendors and filter by yes/no relevance evaluation
- **Status**: 📝 Stub implementations

### Phase 3: Negotiation Loop (Map-Reduce with Cycle)
- **Nodes**: `strategist_node` → `negotiate_node` (parallel) → `aggregator_node`
- **Purpose**: Iterative multi-round negotiation
- **Status**: 📝 Stub implementations

## File Structure

```
agents/
├── __init__.py           # Main exports
├── graph.py              # LangGraph definition and compilation
├── state.py              # GraphState schema
├── nodes/
│   ├── __init__.py
│   ├── extractor.py          # ✅ Phase 1: Order extraction (implemented)
│   ├── database_fetcher.py   # 📝 Phase 2: Fetch vendors (stub)
│   ├── vendor_evaluator.py  # 📝 Phase 2: Evaluate vendors (stub)
│   ├── strategist.py         # 📝 Phase 3: Generate strategies (stub)
│   ├── negotiator.py         # 📝 Phase 3: Negotiate (stub)
│   └── aggregator.py         # 📝 Phase 3: Aggregate & decide (stub)
└── utils/
    ├── __init__.py
    ├── vendor_api.py     # 📝 Vendor API client (stub)
    └── webhook.py        # 📝 Webhook notifications (stub)
```

## Usage

### Basic Usage

```python
from agents import run_negotiation

# Run the negotiation graph
result = run_negotiation(
    user_input="I need 50 laptops for under $20,000",
    max_rounds=3
)

# Access the results
print(result["order_object"])
print(result["leaderboard"])
print(result["phase"])
```

### Advanced Usage

```python
from agents import app, GraphState

# Create custom initial state
initial_state = {
    "user_input": "I need 100 Arduino boards, budget is $4500",
    "webhook_url": "https://myapp.com/webhook",
    "max_rounds": 5,
    # ... other state fields
}

# Run the graph
final_state = app.invoke(initial_state)

# Process results
if final_state["phase"] == "complete":
    if final_state.get("error"):
        print(f"Error: {final_state['error']}")
    else:
        best_vendor = min(
            final_state["leaderboard"].items(),
            key=lambda x: x[1]["price"]
        )
        print(f"Best offer: {best_vendor}")
```

## State Schema

The `GraphState` tracks all data flowing through the graph:

```python
{
    # Input
    "user_input": str,
    "webhook_url": Optional[str],
    
    # Phase 1: Extraction
    "order_object": dict,
    
    # Phase 2: Filtering
    "all_vendors": List[dict],
    "relevant_vendors": List[dict],  # Built by parallel yes/no evaluations
    
    # Phase 3: Negotiation
    "vendor_strategies": Dict[str, str],
    "negotiation_history": Dict[str, List[dict]],
    "leaderboard": Dict[str, dict],
    "rounds_completed": int,
    "max_rounds": int,
    
    # Meta
    "phase": str,
    "error": Optional[str]
}
```

## Graph Flow

```
START
  ↓
extract_order (Phase 1)
  ↓
fetch_vendors
  ↓
[evaluate_vendor × N] (parallel map)
  ↓
strategist
  ↓
[negotiate × N] (parallel map)
  ↓
aggregator (reduce)
  ↓
Decision Gate:
  - Success/Max Rounds → END
  - Continue → strategist (loop)
```

## Next Steps

To add functionality to stub nodes:

1. **Database Fetcher**: Implement vendor API calls
2. **Vendor Evaluator**: Add LLM-based yes/no relevance evaluation
3. **Strategist**: Add LLM-based strategy generation
4. **Negotiator**: Add vendor communication logic
5. **Aggregator**: Add quote comparison and decision logic
6. **Utilities**: Implement webhook and vendor API clients
7. **API Layer**: Add FastAPI endpoints for frontend

## Environment Variables

Make sure to set:
- `ANTHROPIC_API_KEY`: For Claude API (used in extractor node)

## Dependencies

Required packages (see `backend/pyproject.toml`):
- `langgraph>=1.0.5`
- `langchain>=1.1.3`
- `langchain-core>=1.2.0`
- `langchain-anthropic`
- `pydantic`
