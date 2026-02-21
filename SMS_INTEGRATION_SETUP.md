# Briq SMS Integration Setup

This guide explains how to set up SMS invitations for savings pool creation using Briq.tz API.

## Features

- ✅ Send SMS invitations when creating a savings pool
- ✅ Notify multiple members at once
- ✅ Secure - no sensitive data sent via SMS
- ✅ Members receive pool details and can open app to contribute

## Setup Instructions

### 1. Get Briq API Key

1. Visit [https://briq.tz/](https://briq.tz/)
2. Sign up for an account
3. Navigate to your dashboard
4. Get your API key from the developer section

### 2. Configure Environment Variables

Add your Briq API key to the `.env` file:

```env
BRIQ_API_KEY=your_actual_api_key_here
BRIQ_BASE_URL=https://karibu.briq.tz
```

### 3. Deploy Supabase Function

Deploy the SMS function to Supabase:

```bash
cd stellar-hackthon
supabase functions deploy send-pool-invitation
```

Set the environment variable in Supabase:

```bash
supabase secrets set BRIQ_API_KEY=your_actual_api_key_here
```

### 4. Test the Integration

1. Go to the Savings Group page
2. Fill in pool details
3. Check "Send SMS Invitations"
4. Add member phone numbers (with country code)
5. Create the pool
6. Members will receive SMS notifications

## SMS Message Format

Members receive:

```
You've been added to "[Pool Name]" savings pool.

Pool Details:
- Target: 500 XLM
- Your contribution: 10 XLM
- Members: 5

Open the app to view details and contribute.

Pool Address: GXXXXXXXX...
```

## Phone Number Format

- Include country code
- Tanzania: +255 XXX XXX XXX
- Kenya: +254 XXX XXX XXX
- Uganda: +256 XXX XXX XXX

## Security Notes

✅ **What we send:**
- Pool name
- Pool address (public on blockchain)
- Target and contribution amounts
- Invitation to open app

❌ **What we DON'T send:**
- Secret keys
- Private wallet information
- Authentication tokens

## Troubleshooting

### SMS not sending?

1. Check API key is correct in `.env`
2. Verify phone numbers have country codes
3. Check Supabase function logs: `supabase functions logs send-pool-invitation`
4. Ensure you have credits in your Briq account

### Invalid phone number?

- Must include country code (+255, +254, etc.)
- Remove spaces or use format: +255XXXXXXXXX
- Check Briq documentation for supported countries

## Cost Estimation

Briq SMS pricing varies by country. Check [Briq pricing](https://briq.tz/pricing) for current rates.

Typical costs:
- Tanzania: ~$0.01-0.02 per SMS
- Kenya: ~$0.01-0.02 per SMS
- Other East African countries: Similar rates

## Alternative: WhatsApp Integration

Briq also supports WhatsApp. To use WhatsApp instead:

1. Update the edge function to use WhatsApp API endpoint
2. Change the API call in `send-pool-invitation/index.ts`
3. WhatsApp may have different approval requirements

## Support

- Briq Support: [email protected]
- Briq Phone: +255 788 344 348
- Documentation: https://docs.briq.tz/
