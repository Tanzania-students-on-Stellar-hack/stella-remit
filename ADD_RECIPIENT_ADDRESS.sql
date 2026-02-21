-- Add recipient_address column to escrows table
-- This stores the actual Stellar address (G...) of the recipient
-- so we can send funds to the correct address when releasing escrow

ALTER TABLE public.escrows 
ADD COLUMN IF NOT EXISTS recipient_address TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.escrows.recipient_address IS 'Stellar public key (G...) of the recipient who will receive funds when escrow is released';
