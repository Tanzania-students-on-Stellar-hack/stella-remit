# 🚀 Deploy create-wallet Function NOW

## Step-by-Step Instructions

### 1. Open the Function File

In your editor, open: `stellar-hackthon/supabase/functions/create-wallet/index.ts`

### 2. Select ALL Code

- Press `Ctrl+A` (Windows) or `Cmd+A` (Mac)
- This selects the ENTIRE file from line 1 to the end

### 3. Copy the Code

- Press `Ctrl+C` (Windows) or `Cmd+C` (Mac)

### 4. Go to Supabase Dashboard

Open: https://supabase.com/dashboard/project/zzvkbxdaayhbytcshwrs/functions

### 5. Find create-wallet Function

- Look for `create-wallet` in the list
- Click on it

### 6. Edit the Function

- Click "Edit" button or the code editor icon
- You'll see the function code

### 7. Replace ALL Code

- In the editor, press `Ctrl+A` to select all existing code
- Press `Ctrl+V` to paste the new code
- Make sure you replaced EVERYTHING

### 8. Deploy

- Click "Deploy" or "Save" button
- Wait for deployment to complete (should take 10-30 seconds)
- Look for "✅ Deployed successfully" message

### 9. Test

Option A - Use test page:
1. Open `stellar-hackthon/test-create-wallet.html` in browser
2. Enter your email and password
3. Click "Test with Login"
4. Should show success!

Option B - Use your app:
1. Go to http://localhost:8080
2. Click "Create New Wallet"
3. Should work!

---

## What Changed?

The new code:
- ✅ Better error handling for JWT verification
- ✅ Returns detailed error messages
- ✅ Uses service role key correctly
- ✅ Logs errors for debugging

---

## If Still Getting 401 Error

Check the function logs in Supabase:
1. Go to the function page
2. Click "Logs" tab
3. Look for error messages
4. Share the error with me

The logs will show the exact error from `console.error("JWT verification error:", userError)`

---

## Quick Checklist

- [ ] Opened `create-wallet/index.ts` file
- [ ] Selected ALL code (Ctrl+A)
- [ ] Copied code (Ctrl+C)
- [ ] Went to Supabase dashboard
- [ ] Found create-wallet function
- [ ] Clicked Edit
- [ ] Pasted new code (replaced everything)
- [ ] Clicked Deploy
- [ ] Waited for "Deployed successfully"
- [ ] Tested in app or test page
