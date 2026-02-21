-- Create savings_pools table
CREATE TABLE IF NOT EXISTS public.savings_pools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pool_address TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  contribution_amount NUMERIC NOT NULL,
  member_count INTEGER NOT NULL,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  use_smart_contract BOOLEAN DEFAULT false,
  unlock_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.savings_pools ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view pools they created"
  ON public.savings_pools FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Users can create pools"
  ON public.savings_pools FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their pools"
  ON public.savings_pools FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_savings_pools_updated_at
  BEFORE UPDATE ON public.savings_pools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pool contributions table
CREATE TABLE IF NOT EXISTS public.pool_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pool_id UUID NOT NULL REFERENCES public.savings_pools(id) ON DELETE CASCADE,
  contributor_id UUID NOT NULL REFERENCES public.profiles(user_id),
  amount NUMERIC NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pool_contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contributions
CREATE POLICY "Users can view contributions to their pools"
  ON public.pool_contributions FOR SELECT
  TO authenticated
  USING (
    pool_id IN (
      SELECT id FROM public.savings_pools WHERE creator_id = auth.uid()
    )
    OR contributor_id = auth.uid()
  );

CREATE POLICY "Users can add contributions"
  ON public.pool_contributions FOR INSERT
  TO authenticated
  WITH CHECK (contributor_id = auth.uid());
