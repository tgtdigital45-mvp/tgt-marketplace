-- Migration: Lockdown Companies Table
-- Date: 2026-03-25
-- Description: Restricts access to sensitive columns in the companies table while maintaining marketplace functionality via a secure view.

-- 1. Ensure RLS is enabled
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 2. Drop the overly permissive public policy
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON public.companies;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.companies;

-- 3. Create a strict policy for SELECT on the BASE TABLE
-- Only the owner (via team_members) or the service_role can see the base table rows.
-- This protects sensitive columns like commission_rate, stripe_account_id, etc.
CREATE POLICY "Owners can view their own company base data"
ON public.companies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE company_id = public.companies.id 
    AND user_id = auth.uid()
  )
);

-- 4. Re-verify the secure view (should already exist, but making sure)
-- This view is what should be used for public marketplace listings.
CREATE OR REPLACE VIEW public.public_company_profiles AS
SELECT 
    id, 
    company_name, 
    logo_url, 
    cover_image_url,
    rating, 
    slug, 
    category, 
    status, 
    city, 
    state,
    description,
    created_at,
    verified
FROM public.companies
WHERE status = 'approved';

-- 5. Grant access to the view for everyone
GRANT SELECT ON public.public_company_profiles TO public;
GRANT SELECT ON public.public_company_profiles TO anon;
GRANT SELECT ON public.public_company_profiles TO authenticated;

-- COMMENTARY: The application should be refactored to use `public_company_profiles` 
-- for general searches and company pages, and only use the `companies` table 
-- when the logged-in user is the owner (e.g., in the Dashboard).
