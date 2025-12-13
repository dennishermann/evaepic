"""
Vendor API Client

Handles communication with external vendor APIs.
"""

import logging
import requests
from typing import List, Dict, Any, Optional
from requests.exceptions import RequestException, Timeout, ConnectionError

logger = logging.getLogger(__name__)


class VendorAPIClient:
    """
    Client for interacting with vendor APIs.
    
    Will eventually:
    - Fetch vendor list from external API
    - Send negotiation messages to vendors
    - Receive and parse vendor responses
    
    For now: Stub implementation
    """
    
    def __init__(self, api_base_url: str = None):
        """
        Initialize the vendor API client.
        
        Args:
            api_base_url: Base URL for the vendor API
        """
        self.api_base_url = api_base_url or "https://api.vendors.example.com"
        logger.info(f"[VENDOR_API] Initialized with base URL: {self.api_base_url}")
    
    def get_all_vendors(self, team_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Fetch all vendors from external API.
        
        Makes HTTP GET request to /vendors/ endpoint with optional team_id filter.
        Includes retry logic for transient failures.
        
        Args:
            team_id: Optional team ID to filter vendors
            
        Returns:
            List of vendor dictionaries
            
        Raises:
            Exception: If API request fails after retries
        """
        endpoint = f"{self.api_base_url}/vendors/"
        params = {}
        if team_id is not None:
            params['team_id'] = team_id
            
        logger.info(f"[VENDOR_API] Fetching vendors from {endpoint} with params: {params}")
        
        # Retry logic for transient failures
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                response = requests.get(
                    endpoint,
                    params=params,
                    timeout=30  # 30 second timeout
                )
                
                # Log response status
                logger.info(f"[VENDOR_API] Response status: {response.status_code}")
                
                # Raise exception for HTTP errors (4xx, 5xx)
                response.raise_for_status()
                
                # Parse JSON response
                vendors = response.json()
                
                if not isinstance(vendors, list):
                    logger.error(f"[VENDOR_API] Expected list response, got {type(vendors)}")
                    raise ValueError("Invalid response format: expected list of vendors")
                
                logger.info(f"[VENDOR_API] Successfully fetched {len(vendors)} vendors")
                return vendors
                
            except Timeout as e:
                retry_count += 1
                logger.warning(f"[VENDOR_API] Timeout (attempt {retry_count}/{max_retries}): {e}")
                if retry_count >= max_retries:
                    logger.error(f"[VENDOR_API] Max retries reached for timeout")
                    raise Exception(f"Failed to fetch vendors: Request timeout after {max_retries} attempts")
                    
            except ConnectionError as e:
                retry_count += 1
                logger.warning(f"[VENDOR_API] Connection error (attempt {retry_count}/{max_retries}): {e}")
                if retry_count >= max_retries:
                    logger.error(f"[VENDOR_API] Max retries reached for connection error")
                    raise Exception(f"Failed to fetch vendors: Connection error after {max_retries} attempts")
                    
            except requests.HTTPError as e:
                # Don't retry on client errors (4xx), only on server errors (5xx)
                if 400 <= response.status_code < 500:
                    logger.error(f"[VENDOR_API] Client error {response.status_code}: {e}")
                    raise Exception(f"Failed to fetch vendors: HTTP {response.status_code}")
                else:
                    retry_count += 1
                    logger.warning(f"[VENDOR_API] Server error (attempt {retry_count}/{max_retries}): {e}")
                    if retry_count >= max_retries:
                        logger.error(f"[VENDOR_API] Max retries reached for server error")
                        raise Exception(f"Failed to fetch vendors: HTTP {response.status_code} after {max_retries} attempts")
                        
            except ValueError as e:
                # JSON parsing error - don't retry
                logger.error(f"[VENDOR_API] JSON parsing error: {e}")
                raise Exception(f"Failed to fetch vendors: Invalid JSON response")
                
            except RequestException as e:
                # Generic request exception
                retry_count += 1
                logger.warning(f"[VENDOR_API] Request error (attempt {retry_count}/{max_retries}): {e}")
                if retry_count >= max_retries:
                    logger.error(f"[VENDOR_API] Max retries reached for request error")
                    raise Exception(f"Failed to fetch vendors: {str(e)}")
        
        # Should not reach here, but just in case
        raise Exception("Failed to fetch vendors: Unknown error")
    
    def get_vendor_details(self, vendor_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific vendor.
        
        Args:
            vendor_id: ID of the vendor
            
        Returns:
            Vendor details dictionary
        """
        endpoint = f"{self.api_base_url}/vendors/{vendor_id}"
        logger.info(f"[VENDOR_API] Fetching vendor details from {endpoint}")
        
        try:
            response = requests.get(endpoint, timeout=15)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"[VENDOR_API] Failed to fetch vendor details: {e}")
            raise
