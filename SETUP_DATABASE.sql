-- ============================================
-- STELLAR REMIT DATABASE SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  stellar_public_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id),
  receiver_id UUID NOT NULL REFERENCES public.profiles(user_id),
  amount NUMERIC NOT NULL,
  asset TEXT NOT NULL DEFAULT 'XLM',
  memo TEXT,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 3. ESCROWS TABLE
CREATE TABLE IF NOT EXISTS public.escrows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.profiles(user_id),
  recipient_id UUID NOT NULL REFERENCES public.profiles(user_id),
  amount NUMERIC NOT NULL,
  asset TEXT NOT NULL DEFAULT 'XLM',
  status TEXT NOT NULL DEFAULT 'pending',
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  escrow_public_key TEXT,
  tx_hashes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;

-- 4. STELLAR SECRETS TABLE (only accessible by service role)
CREATE TABLE IF NOT EXISTS public.stellar_secrets (
  user_id TEXT PRIMARY KEY,
  encrypted_secret TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stellar_secrets ENABLE ROW LEVEL SECURITY;

-- 5. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_own_profile(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_transaction_participant(_sender_id UUID, _receiver_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IN (_sender_id, _receiver_id)
$$;

CREATE OR REPLACE FUNCTION public.is_escrow_participant(_creator_id UUID, _recipient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IN (_creator_id, _recipient_id)
$$;

-- 6. RLS POLICIES FOR PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_own_profile(user_id));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_own_profile(user_id));

-- 7. RLS POLICIES FOR TRANSACTIONS
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (public.is_transaction_participant(sender_id, receiver_id));

DROP POLICY IF EXISTS "Users can insert transactions as sender" ON public.transactions;
CREATE POLICY "Users can insert transactions as sender"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- 8. RLS POLICIES FOR ESCROWS
DROP POLICY IF EXISTS "Users can view own escrows" ON public.escrows;
CREATE POLICY "Users can view own escrows"
  ON public.escrows FOR SELECT
  TO authenticated
  USING (public.is_escrow_participant(creator_id, recipient_id));

DROP POLICY IF EXISTS "Users can create escrows" ON public.escrows;
CREATE POLICY "Users can create escrows"
  ON public.escrows FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Participants can update escrows" ON public.escrows;
CREATE POLICY "Participants can update escrows"
  ON public.escrows FOR UPDATE
  TO authenticated
  USING (public.is_escrow_participant(creator_id, recipient_id));

-- 9. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. ENABLE REALTIME FOR TRANSACTIONS
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
