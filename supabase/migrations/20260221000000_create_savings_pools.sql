-- Create savings_pools table
CREATE TABLE public.savings_pools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pool_address TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  contribution_amount NUMERIC NOT NULL,
  member_count INTEGER NOT NULL,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  use_smart_contract BOOLEAN NOT NULL DEFAULT false,
  unlock_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.savings_pools ENABLE ROW LEVEL SECURITY;

-- RLS policies for savings_pools
CREATE POLICY "Anyone can view savings pools"
  ON public.savings_pools FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create savings pools"
  ON public.savings_pools FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their pools"
  ON public.savings_pools FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_savings_pools_updated_at
  BEFORE UPDATE ON public.savings_pools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for savings_pools
ALTER PUBLICATION supabase_realtime ADD TABLE public.savings_pools;
