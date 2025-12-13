#!/usr/bin/env python
"""
Simple integration test - Tests get_all_vendors() with the real API.

Run: python test_integration.py
"""

import sys
import requests

API_BASE = "https://negbot-backend-ajdxh9axb0ddb0e9.westeurope-01.azurewebsites.net/api"

print("=" * 70)
print("🧪 INTEGRATION TEST: Vendor API")
print("=" * 70)
print(f"\nAPI Endpoint: {API_BASE}/vendors/")

# Test 1: Get all vendors
print("\n📡 Test 1: Fetching all vendors...")
try:
    response = requests.get(f"{API_BASE}/vendors/", timeout=10)
    response.raise_for_status()
    
    vendors = response.json()
    
    print(f"✅ SUCCESS!")
    print(f"   Status Code: {response.status_code}")
    print(f"   Vendors Found: {len(vendors)}")
    
    if vendors:
        print(f"\n📋 Sample Vendor:")
        v = vendors[0]
        print(f"   ID: {v['id']}")
        print(f"   Name: {v['name']}")
        print(f"   Description: {v['description']}")
        print(f"   Is Predefined: {v['is_predefined']}")
        print(f"   Team ID: {v.get('team_id', 'None')}")
        
        # Validate structure
        required_fields = ['id', 'name', 'description', 'behavioral_prompt', 'is_predefined']
        for field in required_fields:
            assert field in v, f"Missing field: {field}"
        
        print(f"\n   ✓ All required fields present")
        test1_passed = True
    else:
        print("   ⚠️  No vendors found")
        test1_passed = False
        
except Exception as e:
    print(f"❌ FAILED: {e}")
    test1_passed = False

# Test 2: Get vendors with team_id
print("\n📡 Test 2: Fetching vendors with team_id=1...")
try:
    response = requests.get(f"{API_BASE}/vendors/", params={"team_id": 1}, timeout=10)
    response.raise_for_status()
    
    vendors = response.json()
    
    print(f"✅ SUCCESS!")
    print(f"   Vendors Found: {len(vendors)}")
    test2_passed = True
    
except Exception as e:
    print(f"❌ FAILED: {e}")
    test2_passed = False

# Summary
print("\n" + "=" * 70)
print("RESULTS:")
print("=" * 70)
print(f"Test 1 (All vendors):     {'✅ PASSED' if test1_passed else '❌ FAILED'}")
print(f"Test 2 (With team_id):    {'✅ PASSED' if test2_passed else '❌ FAILED'}")
print("=" * 70)

if test1_passed and test2_passed:
    print("\n🎉 All tests passed!")
    sys.exit(0)
else:
    print("\n⚠️  Some tests failed")
    sys.exit(1)
