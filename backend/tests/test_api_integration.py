#!/usr/bin/env python
"""
Api Integration Test

Tests VendorAPIClient and ConversationAPIClient against the real API.
Ensures correct handling of multipart/form-data for messaging.
"""

import sys
import os
import time
import pytest
from pathlib import Path
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.config import NEGOTIATION_API_BASE, NEGOTIATION_TEAM_ID
from agents.utils.vendor_api import VendorAPIClient
from agents.utils.conversation_api import ConversationAPIClient


def test_api_integration():
    """Run full API integration test flow"""
    print("=" * 70)
    print("🧪 API CLIENT INTEGRATION TEST")
    print("=" * 70)
    print(f"\nAPI Base: {NEGOTIATION_API_BASE}")
    print(f"Team ID: {NEGOTIATION_TEAM_ID}")
    
    # 1. Initialize Clients
    vendor_client = VendorAPIClient(api_base_url=NEGOTIATION_API_BASE)
    conv_client = ConversationAPIClient(api_base_url=NEGOTIATION_API_BASE)
    
    # 2. Test Vendor API
    print("\n📡 [VENDOR] Fetching vendors...")
    try:
        vendors = vendor_client.get_all_vendors(team_id=int(NEGOTIATION_TEAM_ID) if NEGOTIATION_TEAM_ID else 1)
        print(f"✅ [VENDOR] Success! Found {len(vendors)} vendors")
        if not vendors:
            print("❌ [VENDOR] No vendors found, cannot proceed with conversation test")
            return False
            
        test_vendor = vendors[0]
        vendor_id = test_vendor['id']
        vendor_name = test_vendor['name']
        print(f"   Using vendor: {vendor_name} (ID: {vendor_id})")
        
    except Exception as e:
        print(f"❌ [VENDOR] Failed: {e}")
        return False
        
    # 3. Test Create Conversation
    print(f"\n💬 [CONV] Creating conversation with {vendor_name}...")
    try:
        # Rate limit safety
        time.sleep(2)
        conversation_id = conv_client.create_conversation(
            vendor_id=vendor_id, 
            team_id=int(NEGOTIATION_TEAM_ID) if NEGOTIATION_TEAM_ID else 1,
            title="Integration Test Conversation"
        )
        if not conversation_id:
            print("❌ [CONV] Failed to create conversation (returned None)")
            return False
        print(f"✅ [CONV] Created conversation: {conversation_id}")
        
    except Exception as e:
        print(f"❌ [CONV] Failed to create: {e}")
        return False
        
    # 4. Test Send Message (Multipart/Form-Data)
    print(f"\n✉️ [MSG] Sending message...")
    message = "Hello, I am interested in purchasing 500 units of your premium widgets. What is your best price?"
    try:
        # Rate limit safety
        time.sleep(2)
        response = conv_client.send_message(conversation_id, message)
        
        if response:
            print(f"✅ [MSG] Success! Received response:")
            print(f"   '{response[:100]}...'")
        else:
            print("❌ [MSG] Failed (returned None)")
            return False
            
    except Exception as e:
        print(f"❌ [MSG] Failed to send: {e}")
        return False
        
    print("\n🎉 ALL API TESTS PASSED!")
    return True

if __name__ == "__main__":
    success = test_api_integration()
    sys.exit(0 if success else 1)
