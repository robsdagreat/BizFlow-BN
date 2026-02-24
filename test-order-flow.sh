#!/bin/bash

# Configuration
API_URL="http://localhost:3000"

echo "---------------------------------------------------"
echo "0. Seeding Test Data"
echo "---------------------------------------------------"
# Load env vars for the seed script
if [ -f .env ]; then
  export $(cat .env | xargs)
fi
SEED_OUTPUT=$(npx ts-node prisma/seed-e2e.ts)
echo "$SEED_OUTPUT"

# Parse JSON using jq
BUSINESS_ID=$(echo "$SEED_OUTPUT" | jq -r '.businessId')
PRODUCT_ID=$(echo "$SEED_OUTPUT" | jq -r '.productId')
SELLER_EMAIL=$(echo "$SEED_OUTPUT" | jq -r '.sellerEmail')
SELLER_PASSWORD=$(echo "$SEED_OUTPUT" | jq -r '.sellerPassword')

echo "Using Business: $BUSINESS_ID"
echo "Using Product:  $PRODUCT_ID"
echo "Using Seller:   $SELLER_EMAIL"

if [ "$BUSINESS_ID" == "null" ] || [ -z "$BUSINESS_ID" ]; then
  echo "Failed to seed data. Exiting."
  exit 1
fi

echo "---------------------------------------------------"
echo "1. Creating Public Order"
echo "---------------------------------------------------"
ORDER_RESPONSE=$(curl -s -X POST "$API_URL/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "'"$BUSINESS_ID"'",
    "customerName": "John Doe",
    "customerPhone": "+1234567890",
    "items": [
      {
        "productId": "'"$PRODUCT_ID"'",
        "quantity": 2
      }
    ]
  }')

echo "$ORDER_RESPONSE"
ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Created Order ID: $ORDER_ID"

if [ -z "$ORDER_ID" ]; then
  echo "Failed to create order. Exiting."
  exit 1
fi

echo "---------------------------------------------------"
echo "2. Login as Seller"
echo "---------------------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'"$SELLER_EMAIL"'",
    "password": "'"$SELLER_PASSWORD"'"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
# echo "Seller Token: ${TOKEN:0:10}..."

if [ -z "$TOKEN" ]; then
  echo "Failed to login. Exiting."
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "---------------------------------------------------"
echo "3. Fetch Seller Orders"
echo "---------------------------------------------------"
curl -s -X GET "$API_URL/orders/my-business" \
  -H "Authorization: Bearer $TOKEN"

echo "---------------------------------------------------"
echo "4. Update Order Status"
echo "---------------------------------------------------"
curl -s -X PATCH "$API_URL/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONFIRMED"
  }'

echo "---------------------------------------------------"
echo "Done."
echo "---------------------------------------------------"
