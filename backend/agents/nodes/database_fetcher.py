"""
Database Fetcher Node

Fetches vendors from external API.
"""

import logging
import os
from typing import Dict, Any, List
from agents.utils.vendor_api import VendorAPIClient

logger = logging.getLogger(__name__)

# API Base URL for vendor service
API_BASE = "https://negbot-backend-ajdxh9axb0ddb0e9.westeurope-01.azurewebsites.net/api"


def validate_vendors(vendors: List[Dict[str, Any]]) -> bool:
    """
    Validates the fetched vendor list.
    
    Args:
        vendors: List of vendor dictionaries
        
    Returns:
        True if valid, False otherwise
    """
    if not isinstance(vendors, list):
        logger.warning(f"Validation failed: vendors is not a list (got {type(vendors)})")
        return False
    
    # Check that we have at least some vendors
    if len(vendors) == 0:
        logger.warning("Validation warning: Empty vendor list")
        # Not a hard failure - might be legitimate
        return True
    
    # Validate that each vendor has required fields
    required_fields = ['id', 'name', 'description', 'behavioral_prompt']
    for vendor in vendors:
        if not isinstance(vendor, dict):
            logger.warning(f"Validation failed: vendor is not a dict (got {type(vendor)})")
            return False
        
        for field in required_fields:
            if field not in vendor:
                logger.warning(f"Validation failed: vendor missing required field '{field}'")
                return False
    
    return True


def fetch_vendors_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node function that fetches vendors from external API.
    
    Reads TEAM_ID from environment (optional) and calls the vendor API
    to retrieve all available vendors.
    
    Args:
        state: GraphState
        
    Returns:
        Dict with updated fields: all_vendors, phase
    """
    logger.info("[DATABASE_FETCHER] Starting vendor fetch")
    
    # Read team_id from environment (optional)
    team_id_str = os.getenv("TEAM_ID")
    team_id = None
    if team_id_str:
        try:
            team_id = int(team_id_str)
            logger.info(f"[DATABASE_FETCHER] Using team_id from environment: {team_id}")
        except ValueError:
            logger.warning(f"[DATABASE_FETCHER] Invalid TEAM_ID in environment: {team_id_str}, ignoring")
    else:
        logger.info("[DATABASE_FETCHER] No TEAM_ID in environment, fetching all vendors")
    
    try:
        # Initialize API client
        client = VendorAPIClient(api_base_url=API_BASE)
        
        # Fetch vendors from API
        vendors = client.get_all_vendors(team_id=team_id)
        
        logger.info(f"[DATABASE_FETCHER] Retrieved {len(vendors)} vendors from API")
        
        # Validate the vendor data
        if not validate_vendors(vendors):
            logger.error(f"[DATABASE_FETCHER] Validation failed for vendor data")
            return {
                "phase": "filtering",
                "error": "Vendor data validation failed"
            }
        
        if len(vendors) == 0:
            logger.warning("[DATABASE_FETCHER] No vendors found - negotiation may not be possible")
        
        # Return updated state
        logger.info(f"[DATABASE_FETCHER] Successfully fetched and validated {len(vendors)} vendors")
        return {
            "all_vendors": vendors,
            "phase": "filtering"
        }
        
    except Exception as e:
        logger.error(f"[DATABASE_FETCHER] Error during vendor fetch: {e}")
        return {
            "phase": "filtering",
            "error": f"Vendor fetch failed: {str(e)}"
        }
