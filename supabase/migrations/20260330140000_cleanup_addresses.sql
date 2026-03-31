-- 1. Migrate default addresses to profiles.address JSONB
UPDATE public.profiles p
SET address = jsonb_build_object(
    'street', ua.street,
    'number', ua.number,
    'complement', ua.complement,
    'neighborhood', ua.neighborhood,
    'city', ua.city,
    'state', ua.state,
    'zip_code', ua.zip_code,
    'nickname', ua.nickname
)
FROM public.user_addresses ua
WHERE p.id = ua.user_id 
  AND ua.is_default = true
  AND p.address IS NULL;

-- 2. Migrate non-default addresses if profile still has no address (fallback)
UPDATE public.profiles p
SET address = jsonb_build_object(
    'street', ua.street,
    'number', ua.number,
    'complement', ua.complement,
    'neighborhood', ua.neighborhood,
    'city', ua.city,
    'state', ua.state,
    'zip_code', ua.zip_code,
    'nickname', ua.nickname
)
FROM (
    SELECT DISTINCT ON (user_id) * FROM public.user_addresses ORDER BY user_id, created_at DESC
) ua
WHERE p.id = ua.user_id 
  AND p.address IS NULL;

-- 3. Drop legacy table
DROP TABLE IF EXISTS public.user_addresses;
