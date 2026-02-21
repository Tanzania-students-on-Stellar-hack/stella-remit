# ✅ SMS Integration Deployment Checklist

## Pre-Deployment

- [ ] Sign up for Briq account at https://briq.tz/
- [ ] Verify your Briq account
- [ ] Get API key from Briq dashboard
- [ ] Add credits to Briq account (for testing)
- [ ] Install Supabase CLI (`npm install -g supabase`)
- [ ] Login to Supabase CLI (`supabase login`)

## Configuration

- [ ] Update `.env` with your Briq API key
  ```env
  BRIQ_API_KEY=your_actual_key_here
  BRIQ_BASE_URL=https://karibu.briq.tz
  ```
- [ ] Verify Supabase project ID in `.env`
- [ ] Check `supabase/config.toml` has `send-pool-invitation` function registered

## Deployment

- [ ] Deploy the edge function:
  ```bash
  supabase functions deploy send-pool-invitation
  ```
- [ ] Set the secret in Supabase:
  ```bash
  supabase secrets set BRIQ_API_KEY=your_key_here
  ```
- [ ] Verify function is deployed:
  ```bash
  supabase functions list
  ```
- [ ] Check secrets are set:
  ```bash
  supabase secrets list
  ```

## Testing

- [ ] Open `test-sms.html` in browser
- [ ] Enter your own phone number (with country code)
- [ ] Fill in test pool details
- [ ] Click "Send Test SMS"
- [ ] Verify SMS received on your phone
- [ ] Check function logs:
  ```bash
  supabase functions logs send-pool-invitation
  ```

## App Testing

- [ ] Start your development server
- [ ] Navigate to Savings Group page
- [ ] Check "Send SMS Invitations" checkbox appears
- [ ] Add a test phone number
- [ ] Create a test pool
- [ ] Verify SMS is received
- [ ] Check toast notification shows success
- [ ] Verify pool is created on Stellar

## Verification

- [ ] SMS message format is correct
- [ ] Phone number validation works
- [ ] Multiple phone numbers can be added
- [ ] Remove phone number button works
- [ ] SMS sending doesn't block pool creation
- [ ] Error handling works (try invalid phone)
- [ ] Function logs show successful sends

## Production Readiness

- [ ] API key is stored securely (not in code)
- [ ] Error messages are user-friendly
- [ ] Loading states are shown
- [ ] Success/failure feedback is clear
- [ ] Phone number format hints are visible
- [ ] Documentation is complete

## Demo Preparation

- [ ] Test with real phone numbers
- [ ] Prepare demo script
- [ ] Have backup plan if SMS fails
- [ ] Know your Briq account balance
- [ ] Have screenshots of SMS received
- [ ] Understand the code flow
- [ ] Can explain security approach

## Troubleshooting Checks

If SMS not working:

- [ ] Check Briq API key is correct
- [ ] Verify Briq account has credits
- [ ] Check phone number format (+255...)
- [ ] Review function logs for errors
- [ ] Test with `test-sms.html` first
- [ ] Verify internet connection
- [ ] Check Briq API status

## Cost Management

- [ ] Know your SMS costs per country
- [ ] Monitor Briq dashboard for usage
- [ ] Set up billing alerts in Briq
- [ ] Calculate demo costs (# of tests × cost)
- [ ] Have backup credits for demo day

## Documentation Review

- [ ] Read `BRIQ_SMS_GUIDE.md`
- [ ] Review `SMS_INTEGRATION_SETUP.md`
- [ ] Check `SMS_QUICK_REFERENCE.md`
- [ ] Understand `SMS_IMPLEMENTATION_SUMMARY.md`

## Final Checks

- [ ] All files committed to git
- [ ] `.env` is in `.gitignore`
- [ ] Function is deployed to production
- [ ] Tested end-to-end at least once
- [ ] Demo phone numbers ready
- [ ] Backup plan prepared
- [ ] Team knows how to use feature

## Demo Day

- [ ] Briq account has sufficient credits
- [ ] Test SMS before presenting
- [ ] Have phone ready to show SMS
- [ ] Know how to access function logs
- [ ] Can explain technical implementation
- [ ] Can discuss security approach
- [ ] Can answer questions about Briq

---

## Quick Test Command

```bash
# Test everything in one go
supabase functions deploy send-pool-invitation && \
supabase secrets set BRIQ_API_KEY=your_key && \
echo "✅ Deployed! Now test with test-sms.html"
```

## Emergency Contacts

- **Briq Support:** [email protected]
- **Briq Phone:** +255 788 344 348
- **Briq Docs:** https://docs.briq.tz/

---

**When all boxes are checked, you're ready to demo!** 🚀✨
