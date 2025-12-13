
import os
import sys
import logging
from unittest.mock import MagicMock

# Ensure backend root is in path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from agents.nodes import negotiator
# Patch the global api_client in the negotiator module
negotiator.api_client = MagicMock()

from agents.nodes.negotiator import NegotiationAgent, NegotiateInput, negotiate_node

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_negotiation_loop():
    """Test that the agent loops until it gets a price"""
    
    # Setup mocks
    mock_client = negotiator.api_client
    mock_client.create_conversation.return_value = "123" # Use string representation of int
    
    # Mock send_message to simulate conversation
    # Turn 0: Agent says "Hello", Vendor says "How can I help?" (No price)
    # Turn 1: Agent says "Price?", Vendor says "$8000" (Price) -> Stop
    
    responses = iter([
        "Hi there, how can I help you?",
        "Sure, the price is $8000 for that item."
    ])
    
    def side_effect(conv_id, msg):
        logger.info(f"Agent sent: {msg}")
        return next(responses)
    
    mock_client.send_message.side_effect = side_effect
    
    # Input Data
    strategy = {
        "vendor_id": "v1",
        "objective": "Get best price",
        "price_targets": {"anchor": 7000, "target": 8000, "walk_away": 9000},
        "opening_message": "Hello, interested in product."
    }
    
    agent = NegotiationAgent("v1", "Test Vendor", strategy)
    
    logger.info("Starting run_turn...")
    offer, history = agent.run_turn("123", 0, None, "PID-123")
    
    logger.info(f"Turns taken: {len(history)/2}") # History has agent+vendor msg per turn
    logger.info(f"Final Offer Price: {offer.price_total}")
    
    assert len(history) == 4 # 2 turns, 4 messages
    assert offer.price_total == 8000.0
    logger.info("SUCCESS: Agent negotiated and extracted price.")

if __name__ == "__main__":
    test_negotiation_loop()
