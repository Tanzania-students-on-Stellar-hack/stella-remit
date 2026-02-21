# Add SUPABASE_ANON_KEY Secret

## The Issue
Edge Functions need the anon key to validate user JWTs, but Supabase doesn't provide it automatically.

## Solution: Add as Secret

### Step 1: Get Your Anon Key
From your `.env` file:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dmtieGRhYXloYnl0Y3Nod3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjMyNjQsImV4cCI6MjA4NzIzOTI2NH0.YLHhwr2IjPDowG2gb4V-bGbHSnl2AScCVHCmuiE2l9o
```

### Step 2: Add Secret to Each Function

For EACH function that needs auth (all except send-pool-invitation):

1. Go to: https://supabase.com/dashboard/project/zzvkbxdaayhbytcshwrs/functions
2. Click on the function name
3. Look for "Secrets" or "Environment Variables" section
4. Click "Add secret" or "New secret"
5. Name: `SUPABASE_ANON_KEY`
6. Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6dmtieGRhYXloYnl0Y3Nod3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjMyNjQsImV4cCI6MjA4NzIzOTI2NH0.YLHhwr2IjPDowG2gb4V-bGbHSnl2AScCVHCmuiE2l9o`
7. Click "Save" or "Add"

### Functions That Need This Secret:
- ✅ create-wallet
- ✅ import-wallet
- ✅ send-payment
- ✅ create-escrow
- ✅ release-escrow

### Step 3: Test
After adding the secret to all functions:
1. Go to your app: http://localhost:8080
2. Click "Create New Wallet"
3. Should work now!

---

## Alternative: Use Service Key Only

If adding secrets is too tedious, we can modify the functions to work with just the service key. Let me know if you want that approach instead.
