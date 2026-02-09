-- Activate Company for 'gabiilorenzii@gmail.com'
-- ID: 020dc72d-95f5-4d86-b912-7aa7d493fa07
-- Profile ID: 5f1d159b-9f84-42fc-8f92-228848b0d412

UPDATE public.companies
SET status = 'active',
    is_verified = true
WHERE id = '020dc72d-95f5-4d86-b912-7aa7d493fa07';

-- Verify
SELECT id, company_name, status, is_verified FROM public.companies WHERE id = '020dc72d-95f5-4d86-b912-7aa7d493fa07';
