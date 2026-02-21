# 📱 Briq SMS Integration - Complete Guide

## Overview

Your Stellar Hackathon app now supports SMS invitations for savings pools using Briq.tz API. When you create a savings pool, members automatically receive SMS notifications with pool details.

## 🎯 What's Been Implemented

### 1. Supabase Edge Function
- **Location:** `supabase/functions/send-pool-invitation/index.ts`
- **Purpose:** Sends SMS via Briq API
- **Features:**
  - Sends to multiple phone numbers
  - Handles errors gracefully
  - Returns detailed results

### 2. Updated SavingsGroup Page
- **Location:** `src/pages/SavingsGroup.tsx`
- **New Features:**
  - Checkbox to enable/disable SMS
  - Dynamic phone number fields
  - Add/remove member phone numbers
  - Automatic SMS sending after pool creation

### 3. Configuration Files
- `.env` - Added BRIQ_API_KEY placeholder
- `supabase/config.toml` - Registered new function
- Deployment scripts for easy setup

## 🚀 Quick Start

### Step 1: Get Briq API Key

1. Visit [https://briq.tz/](https://briq.tz/)
2. Sign up and verify your account
3. Go to Dashboard → API Keys
4. Copy your API key

### Step 2: Configure Environment

Update `.env` file:
```env
BRIQ_API_KEY=your_actual_briq_api_key_here
BRIQ_BASE_URL=https://karibu.briq.tz
```

### Step 3: Deploy Function

**Windows:**
```cmd
deploy-sms-function.bat
```

**Mac/Linux:**
```bash
chmod +x deploy-sms-function.sh
./deploy-sms-function.sh
```

**Manual deployment:**
```bash
supabase functions deploy send-pool-invitation
supabase secrets set BRIQ_API_KEY=your_api_key_here
```

### Step 4: Test Integration

Open `test-sms.html` in your browser to test the SMS functionality before using it in the app.

## 📋 How to Use

### Creating a Pool with SMS Invitations

1. Navigate to **Savings Group** page
2. Fill in pool details:
   - Group name
   - Target amount
   - Contribution per member
   - Number of members

3. Check **"Send SMS Invitations"** checkbox

4. Add member phone numbers:
   - Click "Add Member" to add more fields
   - Enter phone numbers with country code
   - Format: `+255 XXX XXX XXX`

5. Click **"Create Pool"**

6. Members receive SMS:
```
You've been added to "Women's Savings Group" savings pool.

Pool Details:
- Target: 500 XLM
- Your contribution: 10 XLM
- Members: 5

Open the app to view details and contribute.

Pool Address: GXXXXXXXX...
```

## 🌍 Supported Countries

Briq supports East African countries:
- 🇹🇿 Tanzania: +255
- 🇰🇪 Kenya: +254
- 🇺🇬 Uganda: +256
- 🇷🇼 Rwanda: +250
- And more...

Check [Briq documentation](https://docs.briq.tz/) for full list.

## 💰 Pricing

Typical SMS costs (check Briq for current rates):
- Tanzania: ~$0.01-0.02 per SMS
- Kenya: ~$0.01-0.02 per SMS
- Other countries: Similar rates

**Example:** Inviting 10 members = ~$0.10-0.20

## 🔒 Security Features

### What We Send ✅
- Pool name
- Pool address (public blockchain data)
- Target and contribution amounts
- Generic invitation message

### What We DON'T Send ❌
- Secret keys
- Private wallet information
- Authentication tokens
- Sensitive user data

**Result:** Members get notified but must open the secure app to access full functionality.

## 🧪 Testing

### Test with HTML Page
1. Open `test-sms.html` in browser
2. Enter test phone number
3. Fill in pool details
4. Click "Send Test SMS"
5. Check your phone for SMS

### Test in App
1. Create a test pool
2. Enable SMS invitations
3. Add your own phone number
4. Create pool
5. Verify SMS received

### Check Logs
```bash
supabase functions logs send-pool-invitation
```

## 🐛 Troubleshooting

### SMS Not Sending?

**Check API Key:**
```bash
supabase secrets list
```

**Verify Function Deployed:**
```bash
supabase functions list
```

**Check Logs:**
```bash
supabase functions logs send-pool-invitation --tail
```

### Invalid Phone Number?

- ✅ Include country code: `+255712345678`
- ❌ Don't use: `0712345678`
- ✅ Can include spaces: `+255 712 345 678`
- ✅ Can use dashes: `+255-712-345-678`

### Function Error?

1. Check Briq account has credits
2. Verify API key is correct
3. Check phone number format
4. Review Briq API status

## 📊 Monitoring

### View SMS Results

The function returns detailed results:
```json
{
  "success": true,
  "message": "Invitations sent",
  "results": [
    {
      "phoneNumber": "+255712345678",
      "success": true,
      "result": { ... }
    }
  ]
}
```

### Track Usage

Monitor in Briq dashboard:
- SMS sent count
- Delivery status
- Credit balance
- Failed messages

## 🎨 Customization

### Change SMS Message

Edit `supabase/functions/send-pool-invitation/index.ts`:

```typescript
const message = `Your custom message here...`;
```

### Change Sender ID

Update the sender_id in the function:
```typescript
sender_id: "BRIQ", // Default sender ID from Briq
```

Note: "BRIQ" is the default sender ID. Custom sender IDs may require approval from Briq.

### Add WhatsApp Support

Briq also supports WhatsApp. To enable:
1. Update API endpoint in function
2. Get WhatsApp approval from Briq
3. Modify message format for WhatsApp

## 🎓 For Hackathon Demo

### Demo Script

1. **Show the feature:**
   - "We've integrated SMS notifications using Briq API"
   - "When organizers create a pool, members get instant SMS"

2. **Highlight security:**
   - "No sensitive data in SMS"
   - "Members must use the app for actual transactions"

3. **Show the code:**
   - Supabase Edge Function
   - Clean integration with existing flow

4. **Explain the value:**
   - "Perfect for communities without smartphones"
   - "Works with basic feature phones"
   - "Increases accessibility in rural areas"

### Talking Points

- ✅ Real-world integration with African SMS provider
- ✅ Production-ready code
- ✅ Secure implementation
- ✅ Scalable architecture
- ✅ Cost-effective solution

## 📚 Additional Resources

- [Briq Documentation](https://docs.briq.tz/)
- [Briq API Reference](https://docs.briq.tz/api-reference)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stellar Documentation](https://developers.stellar.org/)

## 🆘 Support

**Briq Support:**
- Email: [email protected]
- Phone: +255 788 344 348

**Your App Issues:**
- Check function logs
- Review this guide
- Test with `test-sms.html`

## ✨ Future Enhancements

Potential improvements:
- [ ] WhatsApp integration
- [ ] SMS delivery status tracking
- [ ] Scheduled reminders for contributions
- [ ] Multi-language support (Swahili, etc.)
- [ ] SMS-based contribution confirmations
- [ ] Two-way SMS for simple commands

---

**Ready to go!** Your SMS integration is complete and ready for the hackathon demo. 🚀
