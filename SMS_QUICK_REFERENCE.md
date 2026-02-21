# 📱 SMS Integration - Quick Reference

## Setup (One-time)

```bash
# 1. Get API key from https://briq.tz/
# 2. Add to .env
BRIQ_API_KEY=your_key_here

# 3. Deploy function
supabase functions deploy send-pool-invitation
supabase secrets set BRIQ_API_KEY=your_key_here
```

## Usage

1. Go to **Savings Group** page
2. Check **"Send SMS Invitations"** ✅
3. Add phone numbers with country code: `+255 XXX XXX XXX`
4. Create pool → SMS sent automatically! 🚀

## Phone Format

✅ **Correct:**
- `+255712345678`
- `+255 712 345 678`
- `+254 712 345 678` (Kenya)

❌ **Wrong:**
- `0712345678` (missing country code)
- `712345678` (missing +255)

## Test

Open `test-sms.html` in browser to test before using in app.

## Troubleshooting

```bash
# Check logs
supabase functions logs send-pool-invitation

# Verify secrets
supabase secrets list

# Test function
# Use test-sms.html
```

## SMS Message Preview

```
You've been added to "Women's Savings Group" savings pool.

Pool Details:
- Target: 500 XLM
- Your contribution: 10 XLM
- Members: 5

Open the app to view details and contribute.

Pool Address: GXXXXXXXX...
```

## Cost

~$0.01-0.02 per SMS (Tanzania/Kenya)

## Support

- Briq: [email protected]
- Phone: +255 788 344 348
- Docs: https://docs.briq.tz/

---

**That's it!** Simple, secure, and ready to demo. 🎉
