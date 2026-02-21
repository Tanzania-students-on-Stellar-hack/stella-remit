# 🔧 Fix: 406 Not Acceptable Error

## The Error
```
GET .../rest/v1/profiles?select=*&user_id=... 406 (Not Acceptable)
POST .../functions/v1/create-wallet 401 (Unauthorized)
```

## What This Means
- ✅ Database tables exist (good!)
- ❌ Profile doesn't exist for your user OR RLS is blocking access
- ❌ Edge function not deployed or auth issue

---

## Solution 1: Create Missing Profiles

### Step 1: Run Fix SQL

1. Go to: https://supabase.com/dashboard/project/zzvkbxdaayhbytcshwrs/editor
2. Click "SQL Editor" → "New query"
3. Copy ALL code from: `stellar-hackthon/FIX_EXISTING_USERS.sql`
4. Paste and click "Run"

This will:
- Show which users are missing profiles
- Create profiles for existing users
- Verify RLS policies

### Step 2: Check Results

Look at the query results:
- Should show "✅ All users have profiles"
- Should show RLS enabled for all tables
- Should list all RLS policies

---

## Solution 2: Deploy Edge Functions

The 401 error means `create-wallet` function is not deployed.

### Deploy create-wallet Function

1. Go to: https://supabase.com/dashboard/project/zzvkbxdaayhbytcshwrs/functions
2. Click "New Edge Function" or "Deploy function"
3. Name: `create-wallet`
4. Copy code from: `stellar-hackthon/supabase/functions/create-wallet/index.ts`
5. Paste and click "Deploy"

### Deploy Other Functions

Repeat for:
- `import-wallet`
- `send-payment`
- `create-escrow`
- `release-escrow`

(send-pool-invitation is already deployed)

---

## Solution 3: Fresh Start (If Above Doesn't Work)

### Option A: Sign Out and Sign Up Again

1. Sign out of your app
2. Sign up with a NEW email
3. The trigger should auto-create profile
4. Try creating wallet

### Option B: Manually Create Profile

If you want to keep your existing user:

1. Go to SQL Editor
2. Run this (replace with your user ID):

```sql
-- Get your user ID first
SELECT id, email FROM auth.users;

-- Then create profile (replace 'your-user-id-here')
INSERT INTO public.profiles (user_id, display_name, email)
VALUES (
  'c301d877-d616-46bd-ac05-4a9d6c8152b1',  -- Your user ID
  'Your Name',
  'your@email.com'
)
ON CONFLICT (user_id) DO NOTHING;
```

---

## Verify Everything Works

### 1. Check Database

In SQL Editor, run:
```sql
-- Should return your profile
SELECT * FROM public.profiles;

-- Should show RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 2. Check Functions

Go to: https://supabase.com/dashboard/project/zzvkbxdaayhbytcshwrs/functions

Should see:
- ✅ create-wallet (green/active)
- ✅ import-wallet (green/active)
- ✅ send-payment (green/active)
- ✅ create-escrow (green/active)
- ✅ release-escrow (green/active)
- ✅ send-pool-invitation (green/active)

### 3. Test App

1. Refresh app: http://localhost:8080
2. Should load without 406 errors
3. Try creating wallet
4. Should work!

---

## Common Issues

### Issue: "Profile not found"
**Fix:** Run `FIX_EXISTING_USERS.sql`

### Issue: "401 Unauthorized on create-wallet"
**Fix:** Deploy the `create-wallet` function

### Issue: "RLS policy violation"
**Fix:** Run `SETUP_DATABASE.sql` again to recreate policies

### Issue: Still getting errors
**Fix:** 
1. Clear browser cache
2. Sign out and sign in again
3. Check browser console for specific error
4. Share the error message

---

## Quick Checklist

- [ ] Run `SETUP_DATABASE.sql` (creates tables)
- [ ] Run `FIX_EXISTING_USERS.sql` (creates missing profiles)
- [ ] Deploy `create-wallet` function
- [ ] Deploy other 4 functions
- [ ] Refresh app
- [ ] Test wallet creation

---

## Still Stuck?

Share these details:
1. Screenshot of Table Editor (showing tables)
2. Screenshot of Edge Functions page (showing functions)
3. Full error from browser console
4. Result of running `FIX_EXISTING_USERS.sql`
