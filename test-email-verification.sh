#!/bin/bash

BASE_URL="http://localhost:3000"
EMAIL="seller_verified@example.com"
PASSWORD="password123"

echo "=== 1. Registering User (Trigger Email) ==="
REGISTER_RES=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"fullName\": \"Verified Seller\", \"phone\": \"5555555555\"}")

echo "Register Response: $REGISTER_RES"

# Start listening for the verification token from the logs since we can't check email
# In a real test, we'd mock the mail service or use a mailtrap type service.
# For now, we will rely on manual checking or checking the database for the token if we can.
# But wait, we are hashing the token in DB, so we can't reverse it.
# The log in MailService prints the link? No, I implemented it to print "Verification email sent to..." but not the link with token.
# Wait, I should update MailService to log the link in development mode for easier testing!

# Let's just try to login and see if we can create a business (Should FAIL)
echo "=== 2. Logging in ==="
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RES" | jq -r '.access_token')

if [ "$TOKEN" == "null" ]; then
  echo "Login failed"
  exit 1
fi

echo "=== 3. Trying to Create Business (Should FAIL) ==="
FAIL_RES=$(curl -s -X POST "$BASE_URL/businesses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Should Fail Biz", "description": "desc", "category": "Retail", "city": "NYC"}')

echo "Create Business Response (Expected 403/409): $FAIL_RES"

# To test success, we need the token. 
# Since I can't easily get the token from the email service in this script without more complex setup,
# I will output instructions to manually verify if needed, or I can query the DB for the hash and ... wait hashing is one way.
# I actually need the raw token.
# Modified idea: I will temporarily update MailService to log the token for dev purposes.

