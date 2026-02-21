# 🚀 Deploy ALL Supabase Functions

You have 6 functions that need to be deployed to your new Supabase project.

## Functions to Deploy:

1. ✅ **create-wallet** - Creates Stellar wallets
2. ✅ **import-wallet** - Imports existing wallets
3. ✅ **send-payment** - Sends Stellar payments
4. ✅ **create-escrow** - Creates escrow accounts
5. ✅ **release-escrow** - Releases escrow funds
6. ✅ **send-pool-invitation** - Sends SMS invitations (NEW)

## Quick Deploy Guide

### Step 1: Go to Supabase Dashboard

1. Visit: https://supabase.com/dashboard
2. Select project: **zzvkbxdaayhbytcshwrs**
3. Click **Edge Functions** in sidebar

### Step 2: Deploy Each Function

For EACH function below, do this:
1. Click **Create a new function**
2. Enter the function name
3. Copy the code from the file path shown
4. Paste into editor
5. Click **Deploy**

---

## Function 1: create-wallet

**Name:** `create-wallet`

**Code location:** `stellar-hackthon/supabase/functions/create-wallet/index.ts`

**What it does:** Creates new Stellar wallet accounts

---

## Function 2: import-wallet

**Name:** `import-wallet`

**Code location:** `stellar-hackthon/supabase/functions/import-wallet/index.ts`

**What it does:** Imports existing Stellar wallets using secret key

---

## Function 3: send-payment

**Name:** `send-payment`

**Code location:** `stellar-hackthon/supabase/functions/send-payment/index.ts`

**What it does:** Sends XLM payments on Stellar network

---

## Function 4: create-escrow

**Name:** `create-escrow`

**Code location:** `stellar-hackthon/supabase/functions/create-escrow/index.ts`

**What it does:** Creates escrow accounts for secure transactions

---

## Function 5: release-escrow

**Name:** `release-escrow`

**Code location:** `stellar-hackthon/supabase/functions/release-escrow/index.ts`

**What it does:** Releases funds from escrow

---

## Function 6: send-pool-invitation

**Name:** `send-pool-invitation`

**Code location:** `stellar-hackthon/supabase/functions/send-pool-invitation/index.ts`

**What it does:** Sends SMS invitations via Africa's Talking

**Secrets needed:**
- `AFRICASTALKING_USERNAME` = `saidi`
- `AFRICASTALKING_API_KEY` = `atsk_03744e74016009cd6e993cf55b89f66a2111e36019076753930fca2fd051dc0db3e164df`

---

## Step 3: Set Secrets (Only for send-pool-invitation)

1. Go to **send-pool-invitation** function
2. Click **Settings** or **Secrets**
3. Add:
   - Name: `AFRICASTALKING_USERNAME`, Value: `saidi`
   - Name: `AFRICASTALKING_API_KEY`, Value: `atsk_03744e74016009cd6e993cf55b89f66a2111e36019076753930fca2fd051dc0db3e164df`

---

## Verification

After deploying all functions, test:

1. **Create Wallet** - Try creating account in your app
2. **Send Payment** - Try sending XLM
3. **SMS** - Try creating savings pool with SMS

---

## Quick Copy-Paste for Each Function

I'll create separate files with the exact code for each function...
