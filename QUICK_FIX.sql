-- QUICK FIX: Allow invited members to see pools
-- Copy and paste this entire block into Supabase SQL Editor and run it

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Anyone can view savings pools" ON public.savings_pools;

-- Create new policy that allows all authenticated users to view all pools
CREATE POLICY "All authenticated users can view all pools" 
  ON public.savings_pools 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Done! Now invited members can see and contribute to pools.
