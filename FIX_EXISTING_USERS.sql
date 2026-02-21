-- ============================================
-- FIX EXISTING USERS
-- Run this if you have users but no profiles
-- ============================================

-- 1. Check if profiles exist for all users
SELECT 
  u.id as user_id,
  u.email,
  p.id as profile_id,
  CASE 
    WHEN p.id IS NULL THEN '❌ Missing Profile'
    ELSE '✅ Has Profile'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id;

-- 2. Create missing profiles for existing users
INSERT INTO public.profiles (user_id, display_name, email)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  u.email
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. Verify all users now have profiles
SELECT 
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profiles,
  CASE 
    WHEN COUNT(*) = COUNT(p.id) THEN '✅ All users have profiles'
    ELSE '❌ Some users missing profiles'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id;

-- 4. Check RLS policies are enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'transactions', 'escrows', 'stellar_secrets');

-- 5. List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- DONE! Check the results above
-- ============================================
