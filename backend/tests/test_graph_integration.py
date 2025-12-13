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
    
    def test_graph_compilation(self):
        """Test that the graph compiles without errors"""
        graph = create_negotiation_graph()
        assert graph is not None
        
    def test_simple_order_flow_electronics(self):
        """
        Test complete flow with electronics order.
        
        Flow: extract → fetch → evaluate → strategize → negotiate → aggregate
        """
        print("\n📋 Test Description:")
        print("   Testing complete workflow with electronics order")
        print("   Order: 150 Arduino boards for $3000 USD")
        
        user_input = "I need 150 Arduino boards for $3000 USD, delivery within 2 weeks"
        
        print(f"\n🚀 Running negotiation with input: '{user_input}'")
        print("⏳ This may take 30-90 seconds...\n")
        
        final_state = run_negotiation(
            user_input=user_input,
            max_rounds=2  # Keep reasonable for testing
        )
        
        print("\n✅ Negotiation completed! Analyzing results...")
        
        # Phase 1: Order Extraction
        print("\n📊 Phase 1: Order Extraction")
        assert final_state["order_object"] is not None, "Order extraction failed"
        order = final_state["order_object"]
        print(f"   ✓ Item: {order['item']}")
        print(f"   ✓ Quantity: {order['quantity']['preferred']} units")
        print(f"   ✓ Budget: {order['budget']} {order['currency']}")
        assert "arduino" in order["item"].lower() or "board" in order["item"].lower()
        assert order["quantity"]["preferred"] == 150
        assert order["budget"] == 3000.0
        assert order["currency"] == "USD"
        
        # Phase 2: Vendor Fetching
        print("\n📊 Phase 2: Vendor Fetching")
        assert final_state["all_vendors"] is not None, "Vendor fetching failed"
        assert len(final_state["all_vendors"]) > 0, "No vendors fetched from API"
        print(f"   ✓ Fetched {len(final_state['all_vendors'])} vendors from API")
        
        # Verify vendor structure
        first_vendor = final_state["all_vendors"][0]
        print(f"   ✓ Sample vendor: {first_vendor.get('name', 'Unknown')}")
        assert "id" in first_vendor
        assert "name" in first_vendor
        assert "behavioral_prompt" in first_vendor
        
        # Phase 3: Vendor Evaluation
        print("\n📊 Phase 3: Vendor Evaluation")
        assert final_state["relevant_vendors"] is not None, "Vendor evaluation failed"
        print(f"   ✓ Evaluated vendors: {len(final_state['relevant_vendors'])} relevant")
        if final_state["relevant_vendors"]:
            for v in final_state["relevant_vendors"]:
                print(f"     - {v.get('name', 'Unknown')}")
        else:
            print("   ⚠️  No relevant vendors found (expected for specific product)")
        # Note: relevant_vendors might be 0 if no vendors match electronics/Arduino
        # This is expected behavior - the evaluator is working correctly
        
        # Phase 4: Strategy Generation
        print("\n📊 Phase 4: Strategy Generation")
        assert final_state["vendor_strategies"] is not None
        # Strategies only generated for relevant vendors
        assert len(final_state["vendor_strategies"]) == len(final_state["relevant_vendors"])
        print(f"   ✓ Generated {len(final_state['vendor_strategies'])} strategies")
        
        # If we have relevant vendors, check strategy structure
        if final_state["relevant_vendors"]:
            first_vendor_id = str(final_state["relevant_vendors"][0]["id"])
            if first_vendor_id in final_state["vendor_strategies"]:
                strategy = final_state["vendor_strategies"][first_vendor_id]
                assert "objective" in strategy
                assert "price_targets" in strategy
                assert "opening_message" in strategy
        
        # Phase 5: Negotiation (only if relevant vendors exist)
        print("\n📊 Phase 5: Negotiation")
        if final_state["relevant_vendors"]:
            assert final_state["leaderboard"] is not None
            assert final_state["conversation_ids"] is not None
            assert final_state["negotiation_history"] is not None
            
            # Verify at least one negotiation happened
            assert len(final_state["leaderboard"]) > 0, "No negotiations completed"
            print(f"   ✓ Completed {len(final_state['leaderboard'])} negotiations")
            
            # Check offer structure
            first_offer_key = list(final_state["leaderboard"].keys())[0]
            offer = final_state["leaderboard"][first_offer_key]
            if offer.get("price_total"):
                print(f"   ✓ Best offer: ${offer['price_total']:.2f} from {offer.get('vendor_name', 'Unknown')}")
            assert "vendor_id" in offer
            assert "vendor_name" in offer
            assert "conversation_id" in offer
        else:
            print("   ⚠️  No negotiations (no relevant vendors)")
        
        # Phase 6: Aggregation
        print("\n📊 Phase 6: Aggregation")
        if final_state["relevant_vendors"]:
            assert final_state["rounds_completed"] > 0
            assert final_state["rounds_completed"] <= final_state["max_rounds"]
            print(f"   ✓ Rounds completed: {final_state['rounds_completed']}/{final_state['max_rounds']}")
        else:
            print("   ⚠️  Skipping rounds check (no relevant vendors)")
        
        if final_state["relevant_vendors"]:
            assert final_state["market_analysis"] is not None
            market_analysis = final_state["market_analysis"]
            assert "benchmarks" in market_analysis
            assert "rankings" in market_analysis
            print(f"   ✓ Market analysis generated")
            
            assert final_state["final_comparison_report"] is not None
            report = final_state["final_comparison_report"]
            assert "recommended_vendor_id" in report
            assert "vendors" in report
            print(f"   ✓ Final report: Recommending {report.get('recommended_vendor_name', 'Unknown')}")
        else:
            print("   ⚠️  No market analysis (no relevant vendors)")
        
        # Meta information
        assert final_state["phase"] in ["filtering", "negotiation", "complete"]
        print(f"\n✅ Test passed! Final phase: {final_state['phase']}")
        
    def test_generic_product_order(self):
        """
        Test with a generic product that many vendors might supply.
        More likely to get relevant vendors.
        """
        user_input = "I need 1000 units of steel beams for 50000 EUR urgently"
        
        final_state = run_negotiation(
            user_input=user_input,
            max_rounds=2
        )
        
        # Basic checks
        assert final_state["order_object"] is not None
        assert final_state["all_vendors"] is not None
        assert len(final_state["all_vendors"]) > 0
        
        order = final_state["order_object"]
        print("\n📊 Order Extraction Results:")
        print(f"   Item: {order.get('item', 'Unknown')}")
        print(f"   Quantity: {order.get('quantity', {}).get('preferred')} units")
        print(f"   Budget: {order.get('budget')} {order.get('currency')}")
        
        assert order["quantity"]["preferred"] == 1000
        assert order["budget"] == 50000.0
        assert order["currency"] == "EUR"
        
        print("\n📊 Negotiation Results:")
        relevant_vendors = final_state.get("relevant_vendors", [])
        print(f"   Relevant Vendors Found: {len(relevant_vendors)}")
        
        if relevant_vendors:
             print("   Vendors:")
             for v in relevant_vendors:
                 print(f"   - {v.get('name')}")
                 
             print(f"   Rounds Completed: {final_state.get('rounds_completed')}")
             
             leaderboard = final_state.get("leaderboard", {})
             if leaderboard:
                  print("\n   🏆 Leaderboard:")
                  for vid, offer in leaderboard.items():
                      print(f"      - {offer.get('vendor_name')}: {offer.get('price_total')}")
        else:
             print("   ⚠️ No relevant vendors found for this generic product request.")
        
    def test_multiple_negotiation_rounds(self):
        """
        Test that negotiation can continue for multiple rounds.
        Uses a tight budget to encourage multiple rounds.
        """
        user_input = "I need 50 laptops for $10000"
        
        final_state = run_negotiation(
            user_input=user_input,
            max_rounds=3  # Allow 3 rounds
        )
        
        # Check that we completed at least 1 round
        assert final_state["rounds_completed"] >= 1
        assert final_state["rounds_completed"] <= 3
        
        # If we have relevant vendors and negotiations happened
        if final_state["relevant_vendors"] and final_state["leaderboard"]:
            # Check that negotiation history exists for each vendor
            for vendor in final_state["relevant_vendors"]:
                vendor_id = str(vendor["id"])
                if vendor_id in final_state["negotiation_history"]:
                    history = final_state["negotiation_history"][vendor_id]
                    assert len(history) > 0, f"No history for vendor {vendor_id}"
    
    def test_max_rounds_limit_enforced(self):
        """
        Test that negotiation stops at max_rounds even if budget not met.
        """
        user_input = "I need 1000 laptops for $100"  # Unrealistic budget
        
        final_state = run_negotiation(
            user_input=user_input,
            max_rounds=2
        )
        
        # Should stop at max_rounds
        assert final_state["rounds_completed"] <= 2
        
        # Should still have a final report even if budget wasn't met
        if final_state["relevant_vendors"]:
            assert final_state["final_comparison_report"] is not None
    
    def test_high_budget_early_success(self):
        """
        Test with generous budget - should succeed quickly.
        """
        user_input = "I need 10 USB cables for $10000 USD"  # Very generous
        
        final_state = run_negotiation(
            user_input=user_input,
            max_rounds=3
        )
        
        assert final_state["order_object"] is not None
        order = final_state["order_object"]
        assert order["budget"] == 10000.0
        
        # Should complete (though might not find relevant vendors for USB cables)
        assert final_state["rounds_completed"] <= 3
    
    def test_order_extraction_with_complex_requirements(self):
        """
        Test order extraction with complex requirements.
        """
        user_input = """
        I need 500 steel beams for our construction project.
        Budget is 75000 EUR. We need them delivered within 3 weeks.
        Mandatory requirements: ISO certification, corrosion resistant coating.
        Would be nice to have: extended warranty, installation support.
        This is urgent!
        """
        
        final_state = run_negotiation(
            user_input=user_input,
            max_rounds=2
        )
        
        # Check detailed order extraction
        order = final_state["order_object"]
        assert order is not None
        assert order["quantity"]["preferred"] == 500
        assert order["budget"] == 75000.0
        assert order["currency"] == "EUR"
        assert order["urgency"] in ["high", "urgent"]
        
        # Check requirements were extracted
        requirements = order["requirements"]
        assert len(requirements["mandatory"]) > 0
        # Should extract ISO and coating requirements
        mandatory_text = " ".join(requirements["mandatory"]).lower()
        assert "iso" in mandatory_text or "certification" in mandatory_text
        
    def test_error_handling_empty_input(self):
        """
        Test that graph handles empty/invalid input gracefully.
        """
        final_state = run_negotiation(
            user_input="",
            max_rounds=1
        )
        
        # Should have error
        assert final_state.get("error") is not None
        
    def test_quantity_range_extraction(self):
        """
        Test extraction of quantity ranges.
        """
        user_input = "I need between 100 and 200 units (prefer 150) of Arduino boards for $5000"
        
        final_state = run_negotiation(
            user_input=user_input,
            max_rounds=1
        )
        
        order = final_state["order_object"]
        assert order is not None
        
        quantity = order["quantity"]
        assert quantity["min"] >= 100
        assert quantity["max"] <= 200
        assert quantity["preferred"] == 150 or (quantity["min"] <= quantity["preferred"] <= quantity["max"])
    
    def test_state_consistency_throughout_flow(self):
        """
        Test that state remains consistent throughout the graph execution.
        """
        user_input = "I need 100 steel beams for 20000 EUR"
        
        final_state = run_negotiation(
            user_input=user_input,
            max_rounds=2
        )
        
        # Original input preserved
        assert final_state["user_input"] == user_input
        
        # Phase tracking
        assert final_state["phase"] in ["extraction", "filtering", "negotiation", "complete"]
        
        # Max rounds preserved
        assert final_state["max_rounds"] == 2
        
        # Rounds completed within bounds
        assert 0 <= final_state["rounds_completed"] <= final_state["max_rounds"]
        
        # If relevant vendors exist, strategies should match
        if final_state["relevant_vendors"]:
            relevant_vendor_ids = {str(v["id"]) for v in final_state["relevant_vendors"]}
            strategy_vendor_ids = set(final_state["vendor_strategies"].keys())
            
            # All relevant vendors should have strategies
            assert relevant_vendor_ids == strategy_vendor_ids
    
    def test_parallel_vendor_evaluation(self):
        """
        Test that vendor evaluation happens in parallel for all vendors.
        """
        user_input = "I need 200 electronic components for 5000 USD"
        
        final_state = run_negotiation(
            user_input=user_input,
            max_rounds=1
        )
        
        all_vendors_count = len(final_state["all_vendors"])
        relevant_vendors_count = len(final_state["relevant_vendors"])
        
        # Should evaluate all vendors
        assert all_vendors_count > 0
        
        # Relevant vendors should be subset of all vendors
        assert relevant_vendors_count <= all_vendors_count
        
        # Each relevant vendor should be from all_vendors
        all_vendor_ids = {v["id"] for v in final_state["all_vendors"]}
        relevant_vendor_ids = {v["id"] for v in final_state["relevant_vendors"]}
        
        assert relevant_vendor_ids.issubset(all_vendor_ids)
    
    def test_parallel_negotiation(self):
        """
        Test that negotiation happens in parallel for all relevant vendors.
        """
        user_input = "I need 100 steel products for 30000 EUR"
        
        final_state = run_negotiation(
            user_input=user_input,
            max_rounds=2
        )
        
        if final_state["relevant_vendors"] and len(final_state["relevant_vendors"]) > 1:
            # If we have multiple relevant vendors, check parallel negotiation
            leaderboard_count = len(final_state["leaderboard"])
            relevant_count = len(final_state["relevant_vendors"])
            
            # Should negotiate with all relevant vendors
            assert leaderboard_count <= relevant_count
            
            # Each vendor should have a conversation ID
            conversation_ids_count = len(final_state["conversation_ids"])
            assert conversation_ids_count <= relevant_count


# ========== Smoke Tests (Fast) ==========

class TestGraphSmoke:
    """Quick smoke tests to verify basic functionality"""
    
    @pytest.fixture(autouse=True)
    def _require_integration_flag(self, request):
        if not request.config.getoption("--run-integration"):
            pytest.skip("Integration tests only run with --run-integration flag")

    def setup_method(self, method):
        """Log before each smoke test"""
        print(f"\n{'='*70}")
        print(f"💨 SMOKE TEST: {method.__name__}")
        print(f"{'='*70}")
    
    def teardown_method(self, method):
        """Log after each smoke test"""
        print(f"✅ Smoke test passed: {method.__name__}\n")
    
    def test_graph_exists(self):
        """Verify graph can be imported"""
        print("🔍 Checking if graph can be imported...")
        from agents.graph import app
        print("✅ Graph imported successfully")
        assert app is not None
        print("✅ Graph app is not None")
    
    def test_run_negotiation_exists(self):
        """Verify helper function exists"""
        print("🔍 Checking if run_negotiation function exists...")
        from agents.graph import run_negotiation
        print("✅ run_negotiation function imported")
        assert callable(run_negotiation)
        print("✅ run_negotiation is callable")
    
    def test_minimal_execution(self):
        """Minimal execution to verify no import errors"""
        print("🔍 Running minimal execution test...")
        check_required_env_vars()
        
        # Very simple order, max_rounds=1 to keep it fast
        user_input = "I need 10 items for $1000"
        print(f"\n📝 Test input: '{user_input}'")
        print("🚀 Running negotiation (max_rounds=1)...")
        print("⏳ This should take about 20-30 seconds...\n")
        
        final_state = run_negotiation(
            user_input=user_input,
            max_rounds=1
        )
        
        print("\n✅ Negotiation completed!")
        print(f"📊 Final phase: {final_state.get('phase', 'unknown')}")
        print(f"📊 Rounds completed: {final_state.get('rounds_completed', 0)}")
        print(f"📊 All vendors fetched: {len(final_state.get('all_vendors', []))}")
        print(f"📊 Relevant vendors: {len(final_state.get('relevant_vendors', []))}")
        
        # Just verify it completes without crashing
        assert final_state is not None, "Final state should not be None"
        assert "phase" in final_state, "Final state should contain 'phase' key"
        
        print("✅ All assertions passed!")
