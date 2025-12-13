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

