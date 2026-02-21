# 🚨 Quick Fix: Edge Function Error

## The Problem
You're getting "Edge Function returned a non-2xx status code" when trying to create a wallet.

## The Cause
The `create-wallet` function is either:
- ❌ Not deployed to your new Supabase project
- ❌ Has errors in the dashboard

---

## ✅ Solution: Deploy All Functions

You changed to a new Supabase project (`zzvkbxdaayhbytcshwrs`), so you need to deploy ALL functions again.

### Step 1: Test Which Functions Are Missing

1. Open: `stellar-hackthon/test-functions.html` in your browser
2. It will show which functions are deployed and which are missing
3. You'll see ✅ (working) or ❌ (missing/error)

---

### Step 2: Deploy Missing Functions

Go to: https://supabase.com/dashboard/project/zzvkbxdaayhbytcshwrs/functions

For each ❌ function, do this:

#### Deploy create-wallet (MOST IMPORTANT - needed for wallet creation)

1. Click "New Edge Function" or "Deploy function"
2. Name: `create-wallet`
3. Copy ALL code from: `stellar-hackthon/supabase/functions/create-wallet/index.ts`
4. Paste into editor
5. Click "Deploy"

#### Deploy import-wallet

1. Click "New Edge Function"
2. Name: `import-wallet`
3. Copy ALL code from: `stellar-hackthon/supabase/functions/import-wallet/index.ts`
4. Paste and deploy

#### Deploy send-payment

1. Click "New Edge Function"
2. Name: `send-payment`
3. Copy ALL code from: `stellar-hackthon/supabase/functions/send-payment/index.ts`
4. Paste and deploy

#### Deploy create-escrow

1. Click "New Edge Function"
2. Name: `create-escrow`
3. Copy ALL code from: `stellar-hackthon/supabase/functions/create-escrow/index.ts`
4. Paste and deploy

#### Deploy release-escrow

1. Click "New Edge Function"
2. Name: `release-escrow`
3. Copy ALL code from: `stellar-hackthon/supabase/functions/release-escrow/index.ts`
4. Paste and deploy

---

### Step 3: Verify Deployment

1. Refresh the test page: `test-functions.html`
2. All functions should show ✅
3. Try creating wallet in your app again

---

## Quick Copy-Paste Guide

### Where to find the code:

```
stellar-hackthon/supabase/functions/
├── create-wallet/index.ts       ← Copy this entire file
├── import-wallet/index.ts       ← Copy this entire file
├── send-payment/index.ts        ← Copy this entire file
├── create-escrow/index.ts       ← Copy this entire file
├── release-escrow/index.ts      ← Copy this entire file
└── send-pool-invitation/index.ts ← Already deployed ✅
```

### How to copy:

1. Open the file in your editor
2. Press `Ctrl+A` (select all)
3. Press `Ctrl+C` (copy)
4. Go to Supabase dashboard
5. Paste into function editor
6. Click Deploy

---

## Expected Result

After deploying all functions, you should see in dashboard:

```
✅ create-wallet       - Active
✅ import-wallet       - Active
✅ send-payment        - Active
✅ create-escrow       - Active
✅ release-escrow      - Active
✅ send-pool-invitation - Active
```

Then wallet creation will work!

---

## Still Getting Errors?

If you still see red errors in the dashboard after deploying:

1. Click on the function name
2. Check the "Logs" tab
3. Look for the error message
4. Share the error with me

Common issues:
- Missing environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- These are automatically set by Supabase, so shouldn't be an issue
- If you see import errors, make sure you copied the ENTIRE file content
