
import os
import sys
import logging

# Ensure backend root is in path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from agents.nodes.negotiator import compose_negotiation_message

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_message_composition():
    """Test that compose_negotiation_message includes product ID"""
    
    strategy = {
        "vendor_id": "test_vendor_1",
        "opening_message": "Hi, we want to buy things."
    }
    
    product_id = "PID-TEST-123"
    round_index = 0
    
    logger.info("Testing message composition with product_id...")
    message = compose_negotiation_message(strategy, round_index, product_id=product_id)
    
    logger.info(f"Generated Message: {message}")
    
    if product_id in message:
        logger.info("SUCCESS: Product ID found in message.")
    else:
        logger.error("FAILURE: Product ID NOT found in message.")
        sys.exit(1)

    # Test without product_id
    logger.info("Testing message composition WITHOUT product_id...")
    message_no_id = compose_negotiation_message(strategy, round_index)
    logger.info(f"Generated Message (No ID): {message_no_id}")
    
    if product_id in message_no_id:
        logger.error("FAILURE: Product ID found in message when it shouldn't be.")
        sys.exit(1)
        
    logger.info("SUCCESS: Message clean without product ID.")

if __name__ == "__main__":
    test_message_composition()
