# EvaEpic Backend - Multi-Agent Negotiation System

Backend system for automated vendor negotiation using LangGraph and LangChain.

## Overview

This system uses a LangGraph-based multi-agent architecture to:
1. Extract order requirements from natural language
2. Find and evaluate relevant vendors
3. Negotiate with multiple vendors in parallel
4. Return the best quotes within budget

## Architecture

The system consists of three main phases:

### Phase 1: Order Extraction
- Converts raw user input (e.g., "I need 50 laptops for $20k") into structured data
- Uses Claude (Anthropic) for extraction
- **Status**: ✅ Fully implemented

### Phase 2: Vendor Filtering (Map-Reduce)
- Fetches vendors from external API
- Evaluates each vendor in parallel for relevance
- Filters to only relevant vendors
- **Status**: 📝 Stub implementations (ready for real logic)

### Phase 3: Negotiation Loop (Map-Reduce with Cycle)
- Generates negotiation strategies
- Negotiates with vendors in parallel
- Aggregates results and decides whether to continue
- Loops for multiple rounds if needed
- **Status**: 📝 Stub implementations (ready for real logic)

## Project Structure

```
backend/
├── agents/                      # LangGraph system
│   ├── graph.py                # Main graph definition
│   ├── state.py                # State schema
│   ├── nodes/                  # Individual graph nodes
│   │   ├── extractor.py       # ✅ Order extraction (implemented)
│   │   ├── database_fetcher.py # 📝 Fetch vendors (stub)
│   │   ├── vendor_evaluator.py # 📝 Evaluate vendors (stub)
│   │   ├── filter.py           # 📝 Filter vendors (stub)
│   │   ├── strategist.py       # 📝 Generate strategies (stub)
│   │   ├── negotiator.py       # 📝 Negotiate (stub)
│   │   └── aggregator.py       # 📝 Aggregate results (stub)
│   └── utils/                  # Utility modules
│       ├── vendor_api.py       # 📝 Vendor API client (stub)
│       └── webhook.py          # 📝 Webhook notifications (stub)
├── models/                      # Pydantic data models
│   ├── order.py                # Order/requirements model
│   ├── vendor.py               # Vendor model
│   └── quote.py                # Quote model
├── main.py                      # FastAPI app (to be implemented)
├── test_graph.py               # Test script
└── pyproject.toml              # Dependencies

See agents/README.md for detailed graph documentation.
```

## Setup

### 1. Install Dependencies

Using `uv` (recommended):
```bash
cd backend
uv sync
```

Or using pip:
```bash
cd backend
pip install -e .
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Required for order extraction (Claude API)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Vendor API configuration (for future implementation)
# VENDOR_API_URL=https://api.vendors.example.com
# VENDOR_API_KEY=your_vendor_api_key
```

Get an Anthropic API key from: https://console.anthropic.com/

### 3. Test the System

Run the test script to verify everything works:

```bash
cd backend
python test_graph.py
```

This will:
- Test that the graph structure compiles correctly
- Run an end-to-end test with mock data
- Show you the flow through all phases

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
print(f"Order: {result['order_object']}")
print(f"Best Quotes: {result['leaderboard']}")
```

### Advanced Usage

```python
from agents import app

# Create custom initial state
initial_state = {
    "user_input": "I need 100 Arduino boards, budget is $4500",
    "webhook_url": "https://myapp.com/webhook",
    "max_rounds": 5,
    "order_object": None,
    "all_vendors": [],
    "vendor_scores": {},
    "relevant_vendors": [],
    "vendor_strategies": {},
    "negotiation_history": {},
    "leaderboard": {},
    "rounds_completed": 0,
    "phase": "starting",
    "error": None
}

# Run the graph
final_state = app.invoke(initial_state)

# Process results
if final_state["phase"] == "complete":
    print("Negotiation completed!")
```

## Development

### Current Status

**✅ Completed:**
- Graph structure with all nodes and edges
- State schema definition
- Order extraction node (full implementation)
- Data models (Order, Vendor, Quote)
- Stub implementations for all other nodes

**📝 To Implement:**
- Database fetcher: Connect to vendor API
- Vendor evaluator: Add LLM-based relevance scoring
- Strategist: Add LLM-based strategy generation
- Negotiator: Add vendor communication logic
- Aggregator: Add quote comparison and decision logic
- Webhook utilities: Add HTTP POST functionality
- Vendor API client: Add HTTP client for vendor APIs
- FastAPI endpoints: REST API for frontend

### Adding Functionality

To implement a stub node:

1. Open the node file (e.g., `agents/nodes/negotiator.py`)
2. Replace the stub logic with real implementation
3. Use the existing state schema - don't change it
4. Return a dict with the fields you want to update
5. Test with `test_graph.py`

Example:
```python
def negotiate_node(state: Dict[str, Any]) -> Dict[str, Any]:
    vendor_id = state.get("vendor_id")
    strategy = state.get("strategy")
    
    # YOUR IMPLEMENTATION HERE
    # - Call vendor API
    # - Get quote
    # - Parse response
    
    return {
        "leaderboard": {vendor_id: quote},
        "negotiation_history": updated_history
    }
```

## API Endpoints (Future)

When implemented, the FastAPI app will expose:

- `POST /negotiate` - Start negotiation
- `GET /status/{run_id}` - Check status
- WebSocket or SSE for real-time updates

## Dependencies

Key packages:
- `langgraph` - Graph execution framework
- `langchain` - LLM orchestration
- `langchain-anthropic` - Claude integration
- `fastapi` - REST API framework
- `pydantic` - Data validation

See `pyproject.toml` for full list.

## Troubleshooting

### "ANTHROPIC_API_KEY not set"
- Create a `.env` file in `backend/` directory
- Add `ANTHROPIC_API_KEY=your_key_here`

### Import errors
- Make sure you're in the backend directory
- Run `uv sync` or `pip install -e .`

### Graph execution fails
- Check logs for which node failed
- Stub nodes should all work - they just return mock data
- Only the extractor node needs the API key

## Contributing

When implementing a node:
1. Keep the function signature the same
2. Don't modify the state schema
3. Add logging for debugging
4. Handle errors gracefully
5. Update the node's docstring

## License

[Add your license here]
