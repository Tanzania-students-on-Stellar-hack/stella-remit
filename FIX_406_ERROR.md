# Fix 406 (Not Acceptable) Error

## Problem
The console shows `406 (Not Acceptable)` errors when trying to fetch profiles from the database.

## Root Cause
The `profiles` table doesn't exist in your Supabase database, or the schema is incorrect.

## Solution

### Step 1: Run Database Setup
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/zzvkbxdaayhbytcshwrs
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire contents of `SETUP_DATABASE.sql` file
5. Paste it into the SQL editor
6. Click "Run" button

This will create:
- `profiles` table
- `transactions` table
- `escrows` table
- `stellar_secrets` table
- All necessary RLS policies
- Auto-create profile trigger

### Step 2: Verify Tables Exist
1. In Supabase Dashboard, click "Table Editor"
2. You should see these tables:
   - profiles
   - transactions
   - escrows
   - stellar_secrets

### Step 3: Check Existing Users
If you already have users in `auth.users` but no profiles, run this:

```sql
-- Create profiles for existing users
INSERT INTO public.profiles (user_id, display_name, email)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
  email
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles);
```

### Step 4: Test
1. Refresh your app at http://localhost:8080/
2. The 406 errors should be gone
3. If you're logged in, you should see your profile data loading

## Alternative: Create Tables Manually

If the SQL script doesn't work, you can create the profiles table manually:

1. Go to Table Editor
2. Click "New table"
3. Name: `profiles`
4. Add columns:
   - `id` (uuid, primary key, default: gen_random_uuid())
   - `user_id` (uuid, unique, foreign key to auth.users)
   - `display_name` (text)
   - `email` (text)
   - `stellar_public_key` (text, nullable)
   - `created_at` (timestamptz, default: now())
   - `updated_at` (timestamptz, default: now())
5. Enable RLS
6. Add policies (see SETUP_DATABASE.sql for policy definitions)

## What Changed in This Update

### Escrow Release - Now Client-Side
The escrow release functionality has been converted to work client-side (like wallet creation and payments):

- No longer calls the Edge Function (which had JWT auth issues)
- Gets escrow secret from localStorage
- Builds and signs transaction client-side
- Updates database directly
- Shows clear error messages

### How It Works
1. Creator creates escrow → escrow secret stored in localStorage
2. Recipient clicks "Release" button
3. App gets recipient's secret key from localStorage (or prompts)
4. App gets escrow secret from localStorage
5. Builds transaction to send funds from escrow account to recipient
6. Signs with escrow keypair
7. Submits to Stellar network
8. Updates database status to "released"

## Still Having Issues?

If you still see 406 errors after running the SQL:
1. Check browser console for exact error message
2. Verify you're logged in (check Application → Local Storage → supabase.auth.token)
3. Try logging out and back in
4. Check Supabase logs (Dashboard → Logs → API)
