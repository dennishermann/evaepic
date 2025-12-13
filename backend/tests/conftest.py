"""
Pytest configuration and shared fixtures
"""

import pytest
import os
from typing import Dict, Any


@pytest.fixture
def mock_api_base_url() -> str:
    """Fixture providing the API base URL"""
    return "https://negbot-backend-ajdxh9axb0ddb0e9.westeurope-01.azurewebsites.net/api"


@pytest.fixture
def sample_vendor_response() -> list[Dict[str, Any]]:
    """Fixture providing a sample vendor API response"""
    return [
        {
            "id": 1,
            "name": "TechParts Direct",
            "description": "Electronics supplier",
            "behavioral_prompt": "You are tough negotiator focused on maintaining profit margins.",
            "is_predefined": True,
            "team_id": None,
            "documents": []
        },
        {
            "id": 2,
            "name": "Component World",
            "description": "Component supplier",
            "behavioral_prompt": "You are friendly and eager to make deals.",
            "is_predefined": True,
            "team_id": None,
            "documents": []
        }
    ]


@pytest.fixture
def mock_team_id() -> int:
    """Fixture providing a test team ID"""
    return 1


@pytest.fixture(autouse=True)
def clear_env_vars():
    """Clear environment variables before each test"""
    if "TEAM_ID" in os.environ:
        del os.environ["TEAM_ID"]
    yield

