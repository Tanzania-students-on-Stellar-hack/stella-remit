# 📋 Deploy Functions via Supabase Dashboard

## Current Status
✅ SMS Integration working (send-pool-invitation deployed)
⚠️ Need to deploy remaining 5 functions to new project

## Your Project Details
- Project ID: `zzvkbxdaayhbytcshwrs`
- Dashboard: https://supabase.com/dashboard/project/zzvkbxdaayhbytcshwrs

---

## Step-by-Step Deployment

### 1. Open Edge Functions
1. Go to: https://supabase.com/dashboard/project/zzvkbxdaayhbytcshwrs/functions
2. You should see "Edge Functions" page

### 2. Deploy Each Function

Click "Deploy a new function" for each one below:

---

#### Function 1: create-wallet
**Purpose:** Creates new Stellar wallets for users

1. Click "Deploy a new function"
2. Name: `create-wallet`
3. Copy ALL code from: `stellar-hackthon/supabase/functions/create-wallet/index.ts`
4. Paste into editor
5. Click "Deploy"

---

#### Function 2: import-wallet
**Purpose:** Imports existing Stellar wallets

1. Click "Deploy a new function"
2. Name: `import-wallet`
3. Copy ALL code from: `stellar-hackthon/supabase/functions/import-wallet/index.ts`
4. Paste into editor
5. Click "Deploy"

---

#### Function 3: send-payment
**Purpose:** Sends XLM payments

1. Click "Deploy a new function"
2. Name: `send-payment`
3. Copy ALL code from: `stellar-hackthon/supabase/functions/send-payment/index.ts`
4. Paste into editor
5. Click "Deploy"

---

#### Function 4: create-escrow
**Purpose:** Creates escrow accounts

1. Click "Deploy a new function"
2. Name: `create-escrow`
3. Copy ALL code from: `stellar-hackthon/supabase/functions/create-escrow/index.ts`
4. Paste into editor
5. Click "Deploy"

---

#### Function 5: release-escrow
**Purpose:** Releases escrow funds

1. Click "Deploy a new function"
2. Name: `release-escrow`
3. Copy ALL code from: `stellar-hackthon/supabase/functions/release-escrow/index.ts`
4. Paste into editor
5. Click "Deploy"

---

## 3. Verify Deployment

After deploying all functions:

1. Go to Edge Functions page
2. You should see 6 functions total:
   - ✅ send-pool-invitation (already deployed)
   - create-wallet
   - import-wallet
   - send-payment
   - create-escrow
   - release-escrow

3. Check that none show red errors
4. All should show green/active status

---

## 4. Test in Your App

1. Start dev server: `npm run dev`
2. Open: http://localhost:8080
3. Try creating a wallet
4. If it works, all functions are deployed correctly!

---

## Troubleshooting

### If you see red errors in dashboard:
- The imports are already fixed (using `https://esm.sh/`)
- Just redeploy the function
- Make sure you copied the ENTIRE file content

### If wallet creation fails:
- Check that all 5 functions are deployed
- Check browser console for errors
- Verify you're logged in to the app

---

## SMS Function Secrets (Already Set)

The `send-pool-invitation` function needs these secrets (already configured):
- `AFRICASTALKING_USERNAME` = `saidi`
- `AFRICASTALKING_API_KEY` = `atsk_03744e74016009cd6e993cf55b89f66a2111e36019076753930fca2fd051dc0db3e164df`

---

## Quick Reference

All function files are in: `stellar-hackthon/supabase/functions/`

Just copy the entire content of each `index.ts` file and paste into the dashboard editor.
