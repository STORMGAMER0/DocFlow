#!/bin/bash

API_URL="http://localhost:8000"
USERNAME="testuser_$(date +%s)"
PASSWORD="testpassword123"

echo "--- 1. REGISTERING USER ---"
curl -X POST "$API_URL/register" \
     -H "Content-Type: application/json" \
     -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}"

echo -e "\n\n--- 2. LOGGING IN (GETTING TOKEN) ---"
TOKEN=$(curl -s -X POST "$API_URL/token" \
     -d "username=$USERNAME&password=$PASSWORD&grant_type=password" \
     | jq -r '.access_token')

echo "Received Token: ${TOKEN:0:20}..."

echo -e "\n--- 3. UPLOADING DOCUMENT ---"
# Note: Ensure you have a file named 'test.pdf' or 'test.png' in your folder
curl -X POST "$API_URL/upload" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@test.pdf"