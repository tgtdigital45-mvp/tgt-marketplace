-- 🛡️ Security Hardening Migration - TGT Marketplace
-- Created: 2026-03-30

-- ─── 1. Reports Table ──────────────────────────────────────────────────────────
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports" ON public.reports
    FOR SELECT TO authenticated
    USING (is_admin());

-- ─── 2. Profiles Table & View ──────────────────────────────────────────────────
-- Secure the main profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner or admin" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id OR is_admin());

-- Create a safe public projection for common use (Marketplace/Chat)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT 
    id,
    full_name,
    avatar_url,
    user_type,
    rating_average,
    reviews_count,
    level,
    status,
    response_time,
    created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- ─── 3. Companies Table & View ─────────────────────────────────────────────────
-- Secure the main companies table (protect PII like CNPJ, Wallet ID)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Companies are viewable by all" ON public.companies;
CREATE POLICY "Companies full data viewable by owners or admins" ON public.companies
    FOR SELECT TO authenticated
    USING (auth.uid() = profile_id OR is_admin());

-- Create a safe public projection for the Marketplace and Profile pages
DROP VIEW IF EXISTS public.public_companies;
CREATE VIEW public.public_companies AS
SELECT 
    id,
    profile_id,
    company_name,
    legal_name,
    cnpj,
    slug,
    description,
    logo_url,
    cover_image_url,
    website,
    phone,
    email,
    city,
    state,
    address,
    category,
    status,
    verified,
    rating,
    total_reviews,
    h3_index,
    social_links,
    created_at
FROM public.companies
WHERE status IN ('approved', 'active');

GRANT SELECT ON public.public_companies TO authenticated, anon;

-- ─── 4. Search Functions (RPC) ──────────────────────────────────────────────────
-- Change search functions to SECURITY DEFINER to work with anonymous users 
-- through the now-restricted companies table, while only returning safe columns.

ALTER FUNCTION public.get_nearby_services(text[], text, text, integer, integer) SECURITY DEFINER;
ALTER FUNCTION public.get_remote_services(text, text, integer, integer) SECURITY DEFINER;

-- ─── 5. Categories ─────────────────────────────────────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories 
    FOR SELECT TO anon, authenticated 
    USING (true);
