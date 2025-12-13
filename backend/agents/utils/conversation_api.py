"""
Conversation API Client

Handles messaging and conversation management with external vendor APIs.
"""

import logging
import requests
import json
from typing import Dict, Any, Optional
from requests.exceptions import RequestException

logger = logging.getLogger(__name__)


class ConversationAPIClient:
    """
    Client for interacting with the Conversation and Message APIs.
    """
    
    def __init__(self, api_base_url: str):
        """
        Initialize the conversation API client.
        
        Args:
            api_base_url: Base URL for the API
        """
        self.api_base_url = api_base_url
        logger.info(f"[CONV_API] Initialized with base URL: {self.api_base_url}")
    
    def create_conversation(self, vendor_id: str, team_id: int, title: str = None) -> Optional[str]:
        """
        Create a new conversation with a vendor.
        
        Args:
            vendor_id: Vendor identifier
            team_id: Team identifier (for auth/context)
            title: Optional title for the conversation
            
        Returns:
            Conversation ID or None if failed
        """
        url = f"{self.api_base_url}/conversations/?team_id={team_id}"
        payload = {
            "vendor_id": vendor_id,
            "title": title or f"Negotiation with {vendor_id}"
        }
        
        logger.info(f"[CONV_API] Creating conversation with vendor {vendor_id} (team_id={team_id})")
        
        # Retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.post(url, json=payload, timeout=30)
                response.raise_for_status()
                
                data = response.json()
                # Handle different possible ID fields in response
                raw_id = data.get("id") or data.get("conversation_id")
                conversation_id = str(raw_id) if raw_id is not None else None
                
                logger.info(f"[CONV_API] ✓ Conversation created: {conversation_id}")
                return conversation_id
                
            except requests.RequestException as e:
                logger.warning(f"[CONV_API] Attempt {attempt+1}/{max_retries} failed to create conversation: {e}")
                if attempt < max_retries - 1:
                    import time
                    time.sleep(2 * (attempt + 1))  # Backoff
                else:
                    logger.error(f"[CONV_API] Final attempt failed: {e}")
                    print(f"[CONV_API] ❌ Failed to create conversation: {e}", flush=True)
                    if hasattr(e, 'response') and e.response is not None:
                         print(f"[CONV_API]    Status: {e.response.status_code}", flush=True)
                         print(f"[CONV_API]    Body: {e.response.text}", flush=True)
                    return None

    def send_message(self, conversation_id: str, message: str) -> Optional[str]:
        """
        Send a message in a conversation using multipart/form-data.
        
        Args:
            conversation_id: Conversation identifier
            message: Message content to send
            
        Returns:
            Vendor's response message or None if failed
        """
        url = f"{self.api_base_url}/messages/{conversation_id}"
        
        logger.info(f"[CONV_API] Sending message to conversation {conversation_id}")
        logger.debug(f"[CONV_API] Message content: {message[:100]}...")
        
        files = {
            'content': (None, message)
        }
        
        # Retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    url,
                    files=files,
                    timeout=30
                )
                response.raise_for_status()
                
                response_data = response.json()
                
                # Extract vendor's response
                vendor_response = response_data.get("conversation_response", "")
                if not vendor_response:
                     vendor_response = response_data.get("content", "")
                
                if not vendor_response:
                    logger.warning(f"[CONV_API] Empty response content from API: {response_data}")
                    
                logger.info(f"[CONV_API] ✓ Received vendor response ({len(vendor_response)} chars)")
                return vendor_response
                
            except requests.RequestException as e:
                logger.warning(f"[CONV_API] Attempt {attempt+1}/{max_retries} failed to send message: {e}")
                if attempt < max_retries - 1:
                    import time
                    time.sleep(2 * (attempt + 1))  # Backoff
                else:
                    logger.error(f"[CONV_API] Final attempt failed: {e}")
                    print(f"[CONV_API] ❌ Failed to send message: {e}", flush=True)
                    if hasattr(e, 'response') and e.response is not None:
                         print(f"[CONV_API]    Status: {e.response.status_code}", flush=True)
                         print(f"[CONV_API]    Body: {e.response.text}", flush=True)
                    return None
