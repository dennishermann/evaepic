# Backend Tests

This directory contains the test suite for the backend application.

## Setup

Install test dependencies:

```bash
# Install dev dependencies including pytest
uv pip install -e ".[dev]"

# Or with pip
pip install -e ".[dev]"
```

## Running Tests

### Run all tests

```bash
pytest
```

### Run only unit tests (fast, no API calls)

```bash
pytest -m unit
```

### Run only integration tests (calls real API)

```bash
pytest -m integration
```

### Run specific test file

```bash
pytest tests/agents/utils/test_vendor_api.py
```

### Run specific test

```bash
pytest tests/agents/utils/test_vendor_api.py::TestVendorAPIClientUnit::test_get_all_vendors_success
```

### Run with verbose output

```bash
pytest -v
```

### Run with print statements

```bash
pytest -s
```

## Test Structure

```
tests/
├── __init__.py
├── conftest.py              # Shared fixtures and configuration
├── README.md                # This file
├── agents/
│   ├── __init__.py
│   └── utils/
│       ├── __init__.py
│       └── test_vendor_api.py  # Tests for VendorAPIClient
```

## Test Categories

Tests are marked with pytest markers:

- **`@pytest.mark.unit`**: Fast unit tests with mocked dependencies
- **`@pytest.mark.integration`**: Integration tests that call real external APIs
- **`@pytest.mark.slow`**: Tests that take a long time to run

## Writing Tests

### Unit Tests

Unit tests should be fast and isolated. Use the `responses` library to mock HTTP requests:

```python
import responses

@pytest.mark.unit
@responses.activate
def test_my_api_call():
    responses.add(
        responses.GET,
        "https://api.example.com/data",
        json={"result": "success"},
        status=200
    )
    # Your test code here
```

### Integration Tests

Integration tests can call real APIs but should be marked appropriately:

```python
@pytest.mark.integration
def test_real_api_call():
    # Test that calls actual external API
    pass
```

## Fixtures

Common test fixtures are defined in `conftest.py`:

- `mock_api_base_url`: The API base URL
- `sample_vendor_response`: Sample vendor data
- `mock_team_id`: A test team ID
- `clear_env_vars`: Automatically clears environment variables before each test

## Continuous Integration

When running in CI, you may want to skip integration tests:

```bash
pytest -m "not integration"
```

## Coverage

To run tests with coverage:

```bash
pytest --cov=agents --cov=models --cov-report=html
```

Then open `htmlcov/index.html` in your browser.

## Graph Integration Tests

### Full Negotiation Graph Test Suite

The file `test_graph_integration.py` contains end-to-end integration tests for the complete negotiation workflow.

**Requirements:**
- `ANTHROPIC_API_KEY` environment variable (for LLM calls)
- `NEGOTIATION_API_BASE` configured in `.env`
- `NEGOTIATION_TEAM_ID` configured (optional)
- Network access to both Anthropic and vendor negotiation APIs

**Running:**
```bash
# Run all graph integration tests
pytest tests/test_graph_integration.py --run-integration -v

# Run specific test
pytest tests/test_graph_integration.py::TestNegotiationGraphIntegration::test_simple_order_flow_electronics --run-integration -v

# Run smoke tests only (faster validation)
pytest tests/test_graph_integration.py::TestGraphSmoke --run-integration -v
```

**What's Tested:**

The integration tests verify the complete workflow:

1. **Order Extraction** - Natural language → structured order (LLM)
2. **Vendor Fetching** - Retrieve vendors from external API
3. **Vendor Evaluation** - Filter relevant vendors using LLM
4. **Strategy Generation** - Create vendor-specific negotiation strategies (LLM)
5. **Negotiation Rounds** - Multi-round negotiations via external API
6. **Result Aggregation** - Analyze offers, rank vendors, provide recommendations
7. **Parallel Execution** - Verify map-reduce patterns work correctly
8. **State Management** - Ensure state consistency throughout flow
9. **Error Handling** - Graceful handling of edge cases

**Test Scenarios:**

- `test_simple_order_flow_electronics` - Complete flow with electronics order
- `test_generic_product_order` - Order with high vendor match probability
- `test_multiple_negotiation_rounds` - Multi-round negotiation behavior
- `test_max_rounds_limit_enforced` - Verify max rounds constraint
- `test_high_budget_early_success` - Generous budget scenario
- `test_order_extraction_with_complex_requirements` - Complex requirement parsing
- `test_error_handling_empty_input` - Error handling validation
- `test_quantity_range_extraction` - Range parsing accuracy
- `test_state_consistency_throughout_flow` - State integrity checks
- `test_parallel_vendor_evaluation` - Parallel evaluation verification
- `test_parallel_negotiation` - Parallel negotiation verification

**Example Output:**

```
test_graph_integration.py::TestNegotiationGraphIntegration::test_simple_order_flow_electronics PASSED
test_graph_integration.py::TestNegotiationGraphIntegration::test_multiple_negotiation_rounds PASSED
```

**Performance Note:**

Integration tests involve real API calls and LLM invocations, so they:
- Take longer to run (30-120 seconds per test)
- Consume API credits
- Require network connectivity
- May have variable results based on vendor availability

Use `--run-integration` flag to explicitly enable them.

