# ⚠️ Briq API Endpoint Configuration Needed

## Current Issue

The SMS test is returning a 404 error, which means we need to verify the correct API endpoint.

## What We Tried

- Endpoint: `https://karibu.briq.tz/v1/messages`
- Method: POST
- Headers: Authorization Bearer token
- Response: 404 Not Found

## Next Steps

### 1. Check Briq Dashboard

Log into your Briq account at https://briq.tz/ and look for:
- API Documentation section
- Developer/API settings
- Example API calls
- Correct endpoint URL

### 2. Possible Endpoint Variations

The endpoint might be one of these:
- `https://karibu.briq.tz/api/v1/messages`
- `https://karibu.briq.tz/v1/sms/send`
- `https://api.karibu.briq.tz/v1/messages`
- `https://karibu.briq.tz/messages`

### 3. Check API Documentation

Look for:
- Base URL
- Endpoint path
- Required headers
- Request body format
- Authentication method

### 4. Contact Briq Support

If documentation is unclear:
- Email: [email protected]
- Phone: +255 788 344 348
- Ask for: "SMS API endpoint documentation"

## Test Phone Number

Ready to test with: **+255683859574**

## Once You Have the Correct Endpoint

Update these files:
1. `supabase/functions/send-pool-invitation/index.ts` - Line 3 (BRIQ_API_URL)
2. `test-sms-direct.cjs` - Line 5 (BRIQ_BASE_URL and path)

Then run:
```bash
node test-sms-direct.cjs
```

## Alternative: Use Briq Dashboard

If API integration is complex, you can:
1. Manually test SMS from Briq dashboard
2. Verify your account works
3. Then integrate the API

## Current API Key

Your API key is configured: `3Orys0634DQ3gfToRVWGAonxcfXO3ovilUZQEfNtrrI`

Make sure this key has:
- SMS sending permissions
- Sufficient credits
- Correct workspace access
