-- Fix RLS policy to allow looking up profiles by stellar_public_key
-- This is needed for escrow creation to find the recipient

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create new policy that allows:
-- 1. Users to view their own profile
-- 2. Anyone to look up profiles by stellar_public_key (for escrow/payment recipient lookup)
CREATE POLICY "Users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR  -- Can view own profile
    stellar_public_key IS NOT NULL  -- Can view any profile with a public key (for recipient lookup)
  );

-- Verify the policy
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles';
