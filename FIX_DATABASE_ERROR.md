# 🔧 Fix: Database Tables Missing

## The Problem
```
GET .../rest/v1/profiles?select=*&user_id=... 404 (Not Found)
```

This means the `profiles` table doesn't exist in your new Supabase project.

---

## ✅ Solution: Create Database Tables

### Step 1: Open SQL Editor

1. Go to: https://supabase.com/dashboard/project/zzvkbxdaayhbytcshwrs/editor
2. Click "SQL Editor" in the left sidebar
3. Click "New query"

### Step 2: Run Setup SQL

1. Open the file: `stellar-hackthon/SETUP_DATABASE.sql`
2. Copy ALL the SQL code (Ctrl+A, Ctrl+C)
3. Paste into the SQL Editor
4. Click "Run" or press Ctrl+Enter

### Step 3: Verify Tables Created

After running the SQL, check that these tables exist:

1. Click "Table Editor" in left sidebar
2. You should see:
   - ✅ profiles
   - ✅ transactions
   - ✅ escrows
   - ✅ stellar_secrets

### Step 4: Test Your App

1. Refresh your app: http://localhost:8080
2. The 404 error should be gone
3. Try logging in or signing up
4. Try creating a wallet

---

## What This SQL Does

Creates 4 tables:
- **profiles** - User profiles with Stellar wallet addresses
- **transactions** - Payment history
- **escrows** - Escrow transactions
- **stellar_secrets** - Encrypted wallet keys (secure)

Plus:
- Security policies (RLS)
- Auto-create profile on signup
- Realtime subscriptions for transactions

---

## Quick Visual Guide

```
Supabase Dashboard
├── SQL Editor (click here)
│   └── New query
│       └── Paste SETUP_DATABASE.sql
│       └── Click "Run"
│
└── Table Editor (verify)
    ├── profiles ✅
    ├── transactions ✅
    ├── escrows ✅
    └── stellar_secrets ✅
```

---

## After Database Setup

You still need to deploy the Edge Functions:
1. ✅ Database tables (you just did this)
2. ⚠️ Edge Functions (deploy next)

See: `DEPLOY_FUNCTION_DASHBOARD.md` for function deployment

---

## Troubleshooting

### If SQL fails with "already exists" error:
- That's OK! It means some tables already exist
- The SQL uses `IF NOT EXISTS` so it's safe to run multiple times

### If you still get 404 errors:
- Make sure you're logged into the correct project
- Check that tables appear in Table Editor
- Try logging out and back in to your app

### If profile doesn't auto-create:
- The trigger should create it automatically on signup
- If not, you can manually insert:
```sql
INSERT INTO public.profiles (user_id, display_name, email)
VALUES (
  'your-user-id-here',
  'Your Name',
  'your@email.com'
);
```
