-- Check if the public key exists in profiles table
SELECT 
    user_id,
    display_name,
    email,
    stellar_public_key,
    created_at
FROM public.profiles
WHERE stellar_public_key = 'GD66XQHRB42CNT3U5IPZESSFSUEVBC6AEZO3AFY2OFBFC2CGXD4WSJBQ';

-- Also check all profiles to see what's there
SELECT 
    user_id,
    display_name,
    email,
    stellar_public_key,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any profiles with similar public keys (case insensitive)
SELECT 
    user_id,
    display_name,
    stellar_public_key,
    LENGTH(stellar_public_key) as key_length
FROM public.profiles
WHERE UPPER(stellar_public_key) LIKE '%GD66XQHRB42CNT3U5IPZESSFSUEVBC6AEZO3AFY2OFBFC2CGXD4WSJBQ%'
   OR stellar_public_key LIKE '%GD66XQHRB42CNT3U5IPZESSFSUEVBC6AEZO3AFY2OFBFC2CGXD4WSJBQ%';
