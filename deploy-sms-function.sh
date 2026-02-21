#!/bin/bash

echo "========================================"
echo "Deploying Africa's Talking SMS Integration"
echo "========================================"
echo ""

echo "Step 1: Deploying Supabase function..."
supabase functions deploy send-pool-invitation

echo ""
echo "Step 2: Setting environment variables..."
read -p "Username (sandbox for testing): " AT_USERNAME
read -p "API Key: " AT_API_KEY

supabase secrets set AFRICASTALKING_USERNAME=$AT_USERNAME
supabase secrets set AFRICASTALKING_API_KEY=$AT_API_KEY

echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. If using sandbox, add test numbers at https://account.africastalking.com/"
echo "2. Test the SMS feature in the Savings Group page"
echo "3. Check function logs: supabase functions logs send-pool-invitation"
echo ""
