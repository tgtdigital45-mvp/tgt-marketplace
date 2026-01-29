-- Replace 'EMAIL_DO_USUARIO' with the actual email if known, or run this generic fix
-- This tries to fix any user who has a row in 'companies' but is marked as 'client' in 'profiles'

UPDATE public.profiles
SET user_type = 'company'
WHERE id IN (
    SELECT profile_id FROM public.companies
) AND user_type = 'client';

-- Verify the fix
SELECT id, email, user_type FROM public.profiles 
WHERE id IN (SELECT profile_id FROM public.companies);
