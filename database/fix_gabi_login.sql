-- Remove Inconsistent User Data for Clean Re-registration
-- User: gabiilorenzii@gmail.com
-- Issue: Profile exists but Company data is missing, causing redirection loops.

-- 1. Delete from public.profiles (Cascades if set up correctly, but explicit is safer)
DELETE FROM public.profiles 
WHERE id = '2dfa5c35-65d8-4cba-b011-6614fa2f6019';

-- 2. Delete from auth.users (This is the critical part for Supabase Auth)
-- Note: This usually requires Service Role in API, or executing in Supabase Dashboard SQL Editor
DELETE FROM auth.users 
WHERE id = '2dfa5c35-65d8-4cba-b011-6614fa2f6019';

-- Verification Select (Should be empty)
SELECT * FROM auth.users WHERE email = 'gabiilorenzii@gmail.com';
