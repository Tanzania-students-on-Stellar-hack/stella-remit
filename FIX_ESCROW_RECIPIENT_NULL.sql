-- Allow recipient_id to be null in escrows table
-- This allows escrows to be created for recipients who don't have an account yet

ALTER TABLE public.escrows 
ALTER COLUMN recipient_id DROP NOT NULL;

-- Add a comment explaining this
COMMENT ON COLUMN public.escrows.recipient_id IS 'User ID of recipient (null if recipient does not have an account in the system yet)';

-- Verify the change
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'escrows' 
  AND column_name = 'recipient_id';
