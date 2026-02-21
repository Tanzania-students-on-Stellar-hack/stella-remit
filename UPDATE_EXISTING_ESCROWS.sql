-- Update existing escrows to add recipient_address
-- This will look up the recipient's stellar_public_key from their profile

UPDATE public.escrows e
SET recipient_address = p.stellar_public_key
FROM public.profiles p
WHERE e.recipient_id = p.user_id
  AND e.recipient_address IS NULL
  AND p.stellar_public_key IS NOT NULL;

-- Check results
SELECT 
  id,
  creator_id,
  recipient_id,
  recipient_address,
  amount,
  status
FROM public.escrows
ORDER BY created_at DESC;
