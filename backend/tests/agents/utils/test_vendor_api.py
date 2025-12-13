"""
Tests for VendorAPIClient

This module contains both unit tests (mocked) and integration tests (real API calls).
"""

import pytest
import responses
from requests.exceptions import Timeout, ConnectionError
from agents.utils.vendor_api import VendorAPIClient


# ========== Unit Tests (Mocked) ==========

@pytest.mark.unit
class TestVendorAPIClientUnit:
    """Unit tests for VendorAPIClient with mocked HTTP responses"""
    
    @responses.activate
    def test_get_all_vendors_success(self, mock_api_base_url, sample_vendor_response):
        """Test successful vendor fetch"""
        # Mock the API response
        responses.add(
            responses.GET,
            f"{mock_api_base_url}/vendors/",
            json=sample_vendor_response,
            status=200
        )
        
        # Call the method
        client = VendorAPIClient(api_base_url=mock_api_base_url)
        vendors = client.get_all_vendors()
        
        # Assertions
        assert isinstance(vendors, list)
        assert len(vendors) == 2
        assert vendors[0]["name"] == "TechParts Direct"
        assert vendors[1]["name"] == "Component World"
    
    @responses.activate
    def test_get_all_vendors_with_team_id(self, mock_api_base_url, sample_vendor_response, mock_team_id):
        """Test vendor fetch with team_id filter"""
        # Mock the API response
        responses.add(
            responses.GET,
            f"{mock_api_base_url}/vendors/",
            json=sample_vendor_response,
            status=200
        )
        
        # Call the method with team_id
        client = VendorAPIClient(api_base_url=mock_api_base_url)
        vendors = client.get_all_vendors(team_id=mock_team_id)
        
        # Check that the request was made with the correct params
        assert len(responses.calls) == 1
        assert "team_id=1" in responses.calls[0].request.url
        
        # Check response
        assert isinstance(vendors, list)
        assert len(vendors) == 2
    
    @responses.activate
    def test_get_all_vendors_empty_list(self, mock_api_base_url):
        """Test handling of empty vendor list"""
        # Mock empty response
        responses.add(
            responses.GET,
            f"{mock_api_base_url}/vendors/",
            json=[],
            status=200
        )
        
        client = VendorAPIClient(api_base_url=mock_api_base_url)
        vendors = client.get_all_vendors()
        
        assert isinstance(vendors, list)
        assert len(vendors) == 0
    
    @responses.activate
    def test_get_all_vendors_404_error(self, mock_api_base_url):
        """Test handling of 404 error"""
        # Mock 404 response
        responses.add(
            responses.GET,
            f"{mock_api_base_url}/vendors/",
            json={"error": "Not found"},
            status=404
        )
        
        client = VendorAPIClient(api_base_url=mock_api_base_url)
        
        with pytest.raises(Exception) as exc_info:
            client.get_all_vendors()
        
        assert "Failed to fetch vendors" in str(exc_info.value)
        assert "404" in str(exc_info.value)
    
    @responses.activate
    def test_get_all_vendors_500_error_with_retry(self, mock_api_base_url):
        """Test handling of 500 error with retry logic"""
        # Mock 500 responses for all retry attempts
        for _ in range(3):
            responses.add(
                responses.GET,
                f"{mock_api_base_url}/vendors/",
                json={"error": "Internal server error"},
                status=500
            )
        
        client = VendorAPIClient(api_base_url=mock_api_base_url)
        
        with pytest.raises(Exception) as exc_info:
            client.get_all_vendors()
        
        # Should have retried 3 times
        assert len(responses.calls) == 3
        assert "Failed to fetch vendors" in str(exc_info.value)
        assert "500" in str(exc_info.value)
    
    @responses.activate
    def test_get_all_vendors_timeout(self, mock_api_base_url):
        """Test handling of timeout"""
        # Mock timeout
        responses.add(
            responses.GET,
            f"{mock_api_base_url}/vendors/",
            body=Timeout()
        )
        
        client = VendorAPIClient(api_base_url=mock_api_base_url)
        
        with pytest.raises(Exception) as exc_info:
            client.get_all_vendors()
        
        assert "timeout" in str(exc_info.value).lower()
    
    @responses.activate
    def test_get_all_vendors_invalid_json(self, mock_api_base_url):
        """Test handling of invalid JSON response"""
        # Mock invalid JSON response
        responses.add(
            responses.GET,
            f"{mock_api_base_url}/vendors/",
            body="Not valid JSON",
            status=200
        )
        
        client = VendorAPIClient(api_base_url=mock_api_base_url)
        
        with pytest.raises(Exception) as exc_info:
            client.get_all_vendors()
        
        assert "Invalid JSON" in str(exc_info.value)
    
    @responses.activate
    def test_get_all_vendors_non_list_response(self, mock_api_base_url):
        """Test handling of non-list response"""
        # Mock response with dict instead of list
        responses.add(
            responses.GET,
            f"{mock_api_base_url}/vendors/",
            json={"vendors": []},  # Wrong structure
            status=200
        )
        
        client = VendorAPIClient(api_base_url=mock_api_base_url)
        
        with pytest.raises(Exception) as exc_info:
            client.get_all_vendors()
        
        assert "Invalid response format" in str(exc_info.value)
    
    @responses.activate
    def test_get_all_vendors_retry_success_on_second_attempt(self, mock_api_base_url, sample_vendor_response):
        """Test successful retry after initial failure"""
        # First call fails with 500
        responses.add(
            responses.GET,
            f"{mock_api_base_url}/vendors/",
            json={"error": "Server error"},
            status=500
        )
        # Second call succeeds
        responses.add(
            responses.GET,
            f"{mock_api_base_url}/vendors/",
            json=sample_vendor_response,
            status=200
        )
        
        client = VendorAPIClient(api_base_url=mock_api_base_url)
        vendors = client.get_all_vendors()
        
        # Should have retried and succeeded
        assert len(responses.calls) == 2
        assert isinstance(vendors, list)
        assert len(vendors) == 2


# ========== Integration Tests (Real API) ==========

@pytest.mark.integration
class TestVendorAPIClientIntegration:
    """Integration tests that call the actual API"""
    
    def test_get_all_vendors_real_api(self, mock_api_base_url):
        """Test fetching vendors from the real API"""
        client = VendorAPIClient(api_base_url=mock_api_base_url)
        
        try:
            vendors = client.get_all_vendors()
            
            # Basic assertions
            assert isinstance(vendors, list)
            
            # If we get vendors, check their structure
            if len(vendors) > 0:
                vendor = vendors[0]
                assert "id" in vendor
                assert "name" in vendor
                assert "description" in vendor
                assert "behavioral_prompt" in vendor
                assert "is_predefined" in vendor
                assert isinstance(vendor["id"], int)
                assert isinstance(vendor["name"], str)
                
                print(f"\n✓ Successfully fetched {len(vendors)} vendors from API")
                print(f"  Sample vendor: {vendor['name']}")
            else:
                print("\n⚠ API returned empty vendor list")
        
        except Exception as e:
            pytest.fail(f"Integration test failed with real API: {e}")
    
    def test_get_all_vendors_with_team_id_real_api(self, mock_api_base_url, mock_team_id):
        """Test fetching vendors with team_id from the real API"""
        client = VendorAPIClient(api_base_url=mock_api_base_url)
        
        try:
            vendors = client.get_all_vendors(team_id=mock_team_id)
            
            # Should return a list (might be empty if team_id doesn't exist)
            assert isinstance(vendors, list)
            
            print(f"\n✓ Successfully fetched {len(vendors)} vendors for team_id={mock_team_id}")
        
        except Exception as e:
            pytest.fail(f"Integration test failed with team_id filter: {e}")
    
    def test_get_all_vendors_invalid_team_id(self, mock_api_base_url):
        """Test fetching with invalid team_id"""
        client = VendorAPIClient(api_base_url=mock_api_base_url)
        
        try:
            # Use a very large team_id that likely doesn't exist
            vendors = client.get_all_vendors(team_id=999999)
            
            # Should return empty list or handle gracefully
            assert isinstance(vendors, list)
            print(f"\n✓ Handled invalid team_id gracefully: returned {len(vendors)} vendors")
        
        except Exception as e:
            # Some APIs might return 404 for invalid team_id
            print(f"\n✓ API returned error for invalid team_id: {e}")

