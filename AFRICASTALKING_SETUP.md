# 🌍 Africa's Talking SMS Integration Setup

## Why Africa's Talking?

- ✅ **Well documented** - Clear API docs
- ✅ **East Africa focused** - Great coverage in Tanzania, Kenya, Uganda
- ✅ **Reliable** - Used by thousands of African businesses
- ✅ **Affordable** - Competitive rates
- ✅ **Sandbox mode** - Free testing before going live

## Quick Setup (5 Minutes)

### Step 1: Create Account

1. Go to https://account.africastalking.com/auth/register
2. Sign up with your email
3. Verify your email
4. You'll get **sandbox** access immediately (free for testing)

### Step 2: Get API Key

1. Log into https://account.africastalking.com/
2. Go to **Settings** → **API Key**
3. Click **Generate API Key**
4. Copy your API key (looks like: `atsk_xxxxxxxxxxxxx`)

### Step 3: Add Test Phone Number (Sandbox Only)

For sandbox testing:
1. Go to **Sandbox** → **SMS** → **Test Numbers**
2. Add your phone number: `+255683859574`
3. This allows you to receive test SMS for free

### Step 4: Configure Environment

Update `.env` file:

```env
# For Sandbox (Testing)
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_API_KEY=atsk_your_actual_api_key_here

# For Production (After testing)
# AFRICASTALKING_USERNAME=your_actual_username
# AFRICASTALKING_API_KEY=atsk_your_actual_api_key_here
```

### Step 5: Test the Integration

```bash
# Update the API key in test-africastalking.cjs first
node test-africastalking.cjs
```

### Step 6: Deploy to Supabase

```bash
# Deploy the function
supabase functions deploy send-pool-invitation

# Set environment variables
supabase secrets set AFRICASTALKING_USERNAME=sandbox
supabase secrets set AFRICASTALKING_API_KEY=atsk_your_key_here
```

## Sandbox vs Production

### Sandbox Mode (Free Testing)
- **Username:** `sandbox`
- **Cost:** FREE
- **Limitation:** Must add test numbers in dashboard
- **Use for:** Development and testing

### Production Mode (Real SMS)
- **Username:** Your actual username (from dashboard)
- **Cost:** ~$0.01-0.02 per SMS
- **Limitation:** Need to add credits
- **Use for:** Live application

## SMS Pricing (Production)

| Country | Cost per SMS |
|---------|--------------|
| Tanzania | ~$0.015 |
| Kenya | ~$0.012 |
| Uganda | ~$0.015 |
| Rwanda | ~$0.018 |

**Example:** Inviting 10 members = ~$0.12-0.18

## Testing Your Integration

### Test 1: Direct API Test

```bash
node test-africastalking.cjs
```

Expected output:
```json
{
  "SMSMessageData": {
    "Message": "Sent to 1/1 Total Cost: TZS 0.8000",
    "Recipients": [{
      "statusCode": 101,
      "number": "+255683859574",
      "status": "Success",
      "cost": "TZS 0.8000",
      "messageId": "ATXid_xxxxx"
    }]
  }
}
```

### Test 2: Through Supabase Function

After deploying, test through your app:
1. Go to Savings Group page
2. Check "Send SMS Invitations"
3. Add phone number: `+255683859574`
4. Create pool
5. Check your phone!

## Troubleshooting

### Error: "Invalid API Key"
- Check your API key is correct
- Make sure it starts with `atsk_`
- Regenerate if needed

### Error: "Recipient not in test numbers"
- You're in sandbox mode
- Add your number in dashboard: Sandbox → SMS → Test Numbers

### Error: "Insufficient balance"
- You're in production mode
- Add credits: https://account.africastalking.com/billing

### SMS not received?
- Check phone number format: `+255683859574` (with country code)
- Verify number is added in sandbox (if testing)
- Check function logs: `supabase functions logs send-pool-invitation`

## Going to Production

When ready for real SMS:

1. **Get your username:**
   - Dashboard → Settings → Username

2. **Add credits:**
   - Dashboard → Billing → Add Credits
   - Minimum: $5-10 to start

3. **Update environment:**
   ```bash
   supabase secrets set AFRICASTALKING_USERNAME=your_username
   supabase secrets set AFRICASTALKING_API_KEY=atsk_your_key
   ```

4. **Update .env:**
   ```env
   AFRICASTALKING_USERNAME=your_username
   AFRICASTALKING_API_KEY=atsk_your_key
   ```

5. **Test with real number** (no need to add to test numbers)

## Sender ID (Optional)

You can customize the sender name:

**Default:** Shows your shortcode or number  
**Custom:** Shows your brand name (e.g., "SAVINGS")

To get custom sender ID:
1. Dashboard → SMS → Sender IDs
2. Request sender ID (requires approval)
3. Takes 1-3 days for approval

## API Response Codes

| Code | Meaning |
|------|---------|
| 101 | Success |
| 102 | Queued |
| 401 | Risk hold |
| 402 | Invalid sender ID |
| 403 | Invalid phone number |
| 404 | Unsupported number |
| 405 | Insufficient balance |

## Support

- 📚 **Docs:** https://developers.africastalking.com/docs/sms/overview
- 💬 **Community:** https://help.africastalking.com/
- 📧 **Email:** support@africastalking.com
- 📱 **Phone:** Check website for regional numbers

## Quick Reference

```bash
# Test API
node test-africastalking.cjs

# Deploy function
supabase functions deploy send-pool-invitation

# Set secrets
supabase secrets set AFRICASTALKING_USERNAME=sandbox
supabase secrets set AFRICASTALKING_API_KEY=atsk_xxxxx

# Check logs
supabase functions logs send-pool-invitation

# Test in app
# Go to Savings Group → Enable SMS → Add number → Create pool
```

## Next Steps

1. ✅ Sign up at https://account.africastalking.com/
2. ✅ Get API key
3. ✅ Add test number (your phone)
4. ✅ Update `.env` file
5. ✅ Run `node test-africastalking.cjs`
6. ✅ Deploy to Supabase
7. ✅ Test in your app
8. ✅ Demo at hackathon! 🎉

---

**Ready to send your first SMS!** 🚀
