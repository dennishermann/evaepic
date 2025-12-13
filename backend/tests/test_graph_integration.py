"""
Integration Tests for Full Negotiation Graph

These tests verify the complete end-to-end flow:
- Order extraction (LLM)
- Vendor fetching (API)
- Vendor evaluation (LLM)
- Strategy generation (LLM)
- Negotiation rounds (API + LLM)
- Result aggregation

Requirements:
- ANTHROPIC_API_KEY environment variable
- NEGOTIATION_API_BASE configured
- Network access to both APIs
"""

import pytest
import os
import logging
from agents.graph import run_negotiation, create_negotiation_graph

# Configure logging for tests
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ========== Integration Test Markers ==========

pytestmark = pytest.mark.integration


# ========== Helper Functions ==========

def check_required_env_vars():
    """Check that required environment variables are set"""
    print("\n" + "=" * 70)
    print("🔍 CHECKING ENVIRONMENT VARIABLES")
    print("=" * 70)
    
    required = ["ANTHROPIC_API_KEY"]
    missing = []
    
    for var in required:
        value = os.getenv(var)
        if value:
            print(f"✅ {var}: {'*' * 20} (set)")
        else:
            print(f"❌ {var}: NOT SET")
            missing.append(var)
    
    # Check optional vars
    optional = ["NEGOTIATION_API_BASE", "NEGOTIATION_TEAM_ID", "MAX_NEGOTIATION_ROUNDS"]
    print("\nOptional variables:")
    for var in optional:
        value = os.getenv(var)
        if value:
            if "API" in var:
                print(f"✅ {var}: {value[:50]}...")
            else:
                print(f"✅ {var}: {value}")
        else:
            print(f"⚠️  {var}: Not set (using defaults)")
    
    print("=" * 70 + "\n")
    
    if missing:
        pytest.skip(f"Missing required environment variables: {', '.join(missing)}")


# ========== Core Integration Tests ==========

class TestNegotiationGraphIntegration:
    """End-to-end integration tests for the full negotiation graph"""
    
    @pytest.fixture(autouse=True)
    def _require_integration_flag(self, request):
        if not request.config.getoption("--run-integration"):
            pytest.skip("Integration tests only run with --run-integration flag")
            
    def setup_method(self, method):
        """Check environment before each test"""
        print(f"\n{'='*70}")
        print(f"🧪 STARTING TEST: {method.__name__}")
        print(f"{'='*70}")
        check_required_env_vars()
    
    def teardown_method(self, method):
        """Log after each test"""
        print(f"\n{'='*70}")
        print(f"✅ COMPLETED TEST: {method.__name__}")
        print(f"{'='*70}\n")
    
    def test_buy_one_coffee_machine(self):
        """
        Test buying one coffee machine (simple flow).
        """
        user_input = "I want to buy one coffee machine"
        print(f"\n🚀 Running negotiation for: '{user_input}'")
        
        final_state = run_negotiation(
            user_input=user_input,
            max_rounds=2
        )
        
        assert final_state["order_object"] is not None
        order = final_state["order_object"]
        print(f"   Item: {order['item']}")
        print(f"   Quantity: {order['quantity']}")
        
        # Verify basic flow completion
        assert "coffee" in order["item"].lower()
        assert order["quantity"]["preferred"] == 1
        
        if final_state["relevant_vendors"]:
             assert len(final_state["leaderboard"]) > 0
             print("   ✓ Negotiation completed with at least one vendor")
             
             # Verify final report exists
             assert final_state["final_comparison_report"] is not None
             report = final_state["final_comparison_report"]
             assert "recommended_vendor_id" in report
             print(f"   ✓ Final report recommending: {report.get('recommended_vendor_name')}")
             
        else:
             print("   ⚠️ No relevant vendors found (check if 'coffee' vendors exist in DB)")
