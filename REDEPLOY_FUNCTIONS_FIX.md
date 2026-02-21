# 🔧 Fix: Invalid JWT Error - Redeploy Functions

## The Problem
```
❌ Function Error
Status: 401
{ "code": 401, "message": "Invalid JWT" }
```

## The Cause
The functions were using the wrong Supabase client to validate user JWTs. They need to use the ANON key for auth validation, not the SERVICE_ROLE key.

## ✅ Solution: Redeploy All Functions

I've fixed the code in all 5 functions. Now you need to redeploy them.

---

## Step 1: Go to Edge Functions

https://supabase.com/dashboard/project/zzvkbxdaayhbytcshwrs/functions

---

## Step 2: Redeploy Each Function

For EACH function below, click on it, then click "Edit" or "Redeploy", copy the new code, and deploy.

### Function 1: create-wallet

1. Click on `create-wallet` function
2. Click "Edit" or open the editor
3. Copy ALL code from: `stellar-hackthon/supabase/functions/create-wallet/index.ts`
4. Paste and click "Deploy"

### Function 2: import-wallet

1. Click on `import-wallet` function
2. Click "Edit"
3. Copy ALL code from: `stellar-hackthon/supabase/functions/import-wallet/index.ts`
4. Paste and click "Deploy"

### Function 3: send-payment

1. Click on `send-payment` function
2. Click "Edit"
3. Copy ALL code from: `stellar-hackthon/supabase/functions/send-payment/index.ts`
4. Paste and click "Deploy"

### Function 4: create-escrow

1. Click on `create-escrow` function
2. Click "Edit"
3. Copy ALL code from: `stellar-hackthon/supabase/functions/create-escrow/index.ts`
4. Paste and click "Deploy"

### Function 5: release-escrow

1. Click on `release-escrow` function
2. Click "Edit"
3. Copy ALL code from: `stellar-hackthon/supabase/functions/release-escrow/index.ts`
4. Paste and click "Deploy"

---

## Step 3: Test Again

After redeploying all functions:

1. Refresh your app: http://localhost:8080
2. Try creating a wallet
3. Should work now!

Or test with the test page:
1. Open: `stellar-hackthon/test-create-wallet.html`
2. Enter email and password
3. Click "Test with Login"
4. Should show "✅ Wallet Created Successfully!"

---

## What Changed?

### Before (broken):
```typescript
const supabase = createClient(supabaseUrl, supabaseKey);
const { data: { user } } = await supabase.auth.getUser(
  authHeader.replace("Bearer ", "")
);
```

### After (fixed):
```typescript
// Use anon key to validate user JWT
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: authHeader } }
});
const { data: { user } } = await supabaseClient.auth.getUser();

// Use service role key for privileged operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

---

## Quick Checklist

- [ ] Redeploy `create-wallet`
- [ ] Redeploy `import-wallet`
- [ ] Redeploy `send-payment`
- [ ] Redeploy `create-escrow`
- [ ] Redeploy `release-escrow`
- [ ] Test wallet creation in app
- [ ] Verify no more 401 errors

---

## Note

The `send-pool-invitation` function doesn't need this fix because it doesn't use auth validation the same way.

All functions now properly:
1. Validate user JWT with ANON key
2. Use SERVICE_ROLE key for database operations
3. Handle auth errors correctly
