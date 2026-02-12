
-- Stellar secrets table (only accessible by service role via edge functions)
CREATE TABLE public.stellar_secrets (
  user_id TEXT PRIMARY KEY,
  encrypted_secret TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stellar_secrets ENABLE ROW LEVEL SECURITY;

-- No RLS policies for authenticated users - this table is only accessed by service role in edge functions
-- This means regular users cannot read/write this table, only edge functions with service role can
