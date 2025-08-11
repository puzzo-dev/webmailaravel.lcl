#!/bin/bash

# Test BTCPay settings save via API call (simulating frontend request)

echo "Testing BTCPay settings save via API..."

# Get current settings first
echo "Getting current settings..."
CURRENT_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/admin/system-settings" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json")

echo "Current settings response:"
echo "$CURRENT_RESPONSE" | jq .

# Test saving BTCPay settings
echo -e "\nTesting BTCPay settings save..."

# Create test data
TEST_DATA='{
  "btcpay": {
    "url": "https://test-btcpay.example.com",
    "api_key": "test_key_12345",
    "store_id": "test_store_67890",
    "webhook_secret": "test_webhook_secret",
    "currency": "EUR"
  }
}'

echo "Sending update request with data:"
echo "$TEST_DATA" | jq .

# Make the API call
UPDATE_RESPONSE=$(curl -s -X PUT "http://localhost:8000/api/admin/system-settings" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$TEST_DATA")

echo -e "\nUpdate response:"
echo "$UPDATE_RESPONSE" | jq .

# Verify the update by getting settings again
echo -e "\nVerifying updated settings..."
VERIFY_RESPONSE=$(curl -s -X GET "http://localhost:8000/api/admin/system-settings" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json")

echo "Updated settings:"
echo "$VERIFY_RESPONSE" | jq .data.btcpay

echo -e "\nTest completed."
