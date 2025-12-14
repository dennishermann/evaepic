"""
Tests for Vendor Evaluator Node

This module contains tests for the vendor evaluation logic,
including both the agent class and the LangGraph node function.
"""

import pytest
from unittest.mock import Mock, patch
from pydantic import ValidationError

from agents.nodes.vendor_evaluator import (
    RelevantVendorEvaluatorAgent,
    SuitabilityResult,
    evaluate_vendor_node,
    EvaluateInput
)
from models.vendor import Vendor
from models.order import OrderObject, QuantityRange, Requirements


# ========== Fixtures ==========

@pytest.fixture
def steel_vendor():
    """Fixture for a steel supplier vendor"""
    return Vendor(
        id=1,
        name="Giuseppe (Steel Supplier)",
        description="Italian steel supplier",
        behavioral_prompt="Warm Italian",
        is_predefined=True,
        team_id=20,
        documents=[],
        api_endpoint="",
        category=["Steel", "Metal"],
        rating=4.8,
        metadata={}
    )


@pytest.fixture
def electronics_vendor():
    """Fixture for an electronics supplier vendor"""
    return Vendor(
        id=2,
        name="Diana (Electronics)",
        description="Electronics supplier",
        behavioral_prompt="Aggressive",
        is_predefined=True,
        team_id=20,
        documents=[],
        api_endpoint="",
        category=["Electronics", "Arduino"],
        rating=4.2,
        metadata={}
    )


@pytest.fixture
def fruits_vendor():
    """Fixture for a fruits supplier vendor"""
    return Vendor(
        id=3,
        name="Bob (Fruits)",
        description="Fruit supplier",
        behavioral_prompt="Friendly",
        is_predefined=False,
        team_id=20,
        documents=[],
        api_endpoint="",
        category=["Fruits", "Food"],
        rating=4.5,
        metadata={}
    )


@pytest.fixture
def steel_order():
    """Fixture for a steel order"""
    return OrderObject(
        item="steel beams",
        quantity=QuantityRange(min=500, max=6000, preferred=5000),
        budget=50000,
        currency="EUR",
        urgency="medium",
        requirements=Requirements(mandatory=[], optional=[])
    )


@pytest.fixture
def arduino_order():
    """Fixture for an Arduino order"""
    return OrderObject(
        item="Arduino boards",
        quantity=QuantityRange(min=100, max=200, preferred=150),
        budget=3000,
        currency="USD",
        urgency="high",
        requirements=Requirements(mandatory=[], optional=[])
    )


# ========== Unit Tests for Agent Class ==========

@pytest.mark.unit
class TestRelevantVendorEvaluatorAgent:
    """Unit tests for RelevantVendorEvaluatorAgent"""
    
    def test_agent_initialization(self):
        """Test that agent initializes correctly"""
        agent = RelevantVendorEvaluatorAgent()
        assert agent.llm is not None
        assert agent.parser is not None
        assert agent.prompt is not None
        assert agent.chain is not None
    
    @patch('agents.nodes.vendor_evaluator.RelevantVendorEvaluatorAgent.evaluate')
    def test_evaluate_matching_vendor(self, mock_evaluate, steel_vendor, steel_order):
        """Test evaluating a vendor that matches the order"""
        mock_evaluate.return_value = True
        
        agent = RelevantVendorEvaluatorAgent()
        result = agent.evaluate(steel_vendor, steel_order)
        
        assert result is True
        mock_evaluate.assert_called_once()
    
    @patch('agents.nodes.vendor_evaluator.RelevantVendorEvaluatorAgent.evaluate')
    def test_evaluate_non_matching_vendor(self, mock_evaluate, fruits_vendor, steel_order):
        """Test evaluating a vendor that doesn't match the order"""
        mock_evaluate.return_value = False
        
        agent = RelevantVendorEvaluatorAgent()
        result = agent.evaluate(fruits_vendor, steel_order)
        
        assert result is False
        mock_evaluate.assert_called_once()


# ========== Unit Tests for Node Function ==========

@pytest.mark.unit
class TestEvaluateVendorNode:
    """Unit tests for evaluate_vendor_node function"""
    
    @patch('agents.nodes.vendor_evaluator.RelevantVendorEvaluatorAgent.evaluate')
    def test_node_returns_relevant_vendor(self, mock_evaluate, steel_vendor, steel_order):
        """Test that node returns vendor dict when relevant"""
        mock_evaluate.return_value = True
        
        input_data: EvaluateInput = {
            "vendor": steel_vendor.model_dump(),
            "order_requirements": steel_order.model_dump()
        }
        
        result = evaluate_vendor_node(input_data)
        
        assert "relevant_vendors" in result
        assert len(result["relevant_vendors"]) == 1
        assert result["relevant_vendors"][0]["id"] == steel_vendor.id
        assert result["relevant_vendors"][0]["name"] == steel_vendor.name
    
    @patch('agents.nodes.vendor_evaluator.RelevantVendorEvaluatorAgent.evaluate')
    def test_node_returns_empty_for_non_relevant_vendor(self, mock_evaluate, fruits_vendor, steel_order):
        """Test that node returns empty list when vendor is not relevant"""
        mock_evaluate.return_value = False
        
        input_data: EvaluateInput = {
            "vendor": fruits_vendor.model_dump(),
            "order_requirements": steel_order.model_dump()
        }
        
        result = evaluate_vendor_node(input_data)
        
        assert "relevant_vendors" in result
        assert len(result["relevant_vendors"]) == 0
    
    def test_node_handles_invalid_vendor_data(self, steel_order):
        """Test that node handles invalid vendor data gracefully"""
        input_data: EvaluateInput = {
            "vendor": {"id": 999, "name": "Invalid"},  # Missing required fields
            "order_requirements": steel_order.model_dump()
        }
        
        result = evaluate_vendor_node(input_data)
        
        # Should return empty list instead of crashing
        assert "relevant_vendors" in result
        assert len(result["relevant_vendors"]) == 0
    
    def test_node_handles_invalid_order_data(self, steel_vendor):
        """Test that node handles invalid order data gracefully"""
        input_data: EvaluateInput = {
            "vendor": steel_vendor.model_dump(),
            "order_requirements": {"item": "test"}  # Missing required fields
        }
        
        result = evaluate_vendor_node(input_data)
        
        # Should return empty list instead of crashing
        assert "relevant_vendors" in result
        assert len(result["relevant_vendors"]) == 0
    
    @patch('agents.nodes.vendor_evaluator.RelevantVendorEvaluatorAgent.evaluate')
    def test_node_handles_evaluation_exception(self, mock_evaluate, steel_vendor, steel_order):
        """Test that node handles exceptions during evaluation gracefully"""
        mock_evaluate.side_effect = Exception("LLM API error")
        
        input_data: EvaluateInput = {
            "vendor": steel_vendor.model_dump(),
            "order_requirements": steel_order.model_dump()
        }
        
        result = evaluate_vendor_node(input_data)
        
        # Should return empty list instead of crashing
        assert "relevant_vendors" in result
        assert len(result["relevant_vendors"]) == 0


# ========== Integration Tests (Scenario-based) ==========

@pytest.mark.integration
@pytest.mark.skipif(
    not pytest.config.getoption("--run-integration"),
    reason="Integration tests only run with --run-integration flag"
)
class TestVendorEvaluatorScenarios:
    """Integration tests for real-world vendor evaluation scenarios"""
    
    def test_steel_vendor_with_steel_order(self, steel_vendor, steel_order):
        """Test: Steel vendor should match steel order"""
        agent = RelevantVendorEvaluatorAgent()
        result = agent.evaluate(steel_vendor, steel_order)
        
        # Steel vendor should be suitable for steel order
        assert result is True
    
    def test_electronics_vendor_with_steel_order(self, electronics_vendor, steel_order):
        """Test: Electronics vendor should NOT match steel order"""
        agent = RelevantVendorEvaluatorAgent()
        result = agent.evaluate(electronics_vendor, steel_order)
        
        # Electronics vendor should not be suitable for steel order
        assert result is False
    
    def test_steel_vendor_with_arduino_order(self, steel_vendor, arduino_order):
        """Test: Steel vendor should NOT match Arduino order"""
        agent = RelevantVendorEvaluatorAgent()
        result = agent.evaluate(steel_vendor, arduino_order)
        
        # Steel vendor should not be suitable for Arduino order
        assert result is False
    
    def test_electronics_vendor_with_arduino_order(self, electronics_vendor, arduino_order):
        """Test: Electronics vendor should match Arduino order"""
        agent = RelevantVendorEvaluatorAgent()
        result = agent.evaluate(electronics_vendor, arduino_order)
        
        # Electronics vendor should be suitable for Arduino order
        assert result is True
    
    def test_fruits_vendor_with_steel_order(self, fruits_vendor, steel_order):
        """Test: Fruits vendor should NOT match steel order"""
        agent = RelevantVendorEvaluatorAgent()
        result = agent.evaluate(fruits_vendor, steel_order)
        
        # Fruits vendor should not be suitable for steel order
        assert result is False


# ========== Test Suitability Result Model ==========

@pytest.mark.unit
class TestSuitabilityResult:
    """Tests for SuitabilityResult Pydantic model"""
    
    def test_suitability_result_creation(self):
        """Test creating a SuitabilityResult"""
        result = SuitabilityResult(
            suitable=True,
            reasoning="Vendor category matches order item"
        )
        
        assert result.suitable is True
        assert "matches" in result.reasoning.lower()
    
    def test_suitability_result_validation(self):
        """Test that SuitabilityResult validates fields"""
        # Should require both fields
        with pytest.raises(ValidationError):
            SuitabilityResult(suitable=True)  # Missing reasoning
        
        with pytest.raises(ValidationError):
            SuitabilityResult(reasoning="Test")  # Missing suitable

