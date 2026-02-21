-- Fix RLS policy to allow all authenticated users to view all pools
-- This is necessary for community savings pools where members need to see pools they didn't create

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view savings pools" ON public.savings_pools;

-- Create a new policy that truly allows all authenticated users to view all pools
CREATE POLICY "All authenticated users can view all pools"
  ON public.savings_pools 
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify the policy is working
-- You can test by running: SELECT * FROM savings_pools;
-- This should now return all pools for any authenticated user
