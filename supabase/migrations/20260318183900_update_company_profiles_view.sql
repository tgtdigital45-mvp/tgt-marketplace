-- Drop and recreate public_company_profiles view to include 'active' status
DROP VIEW IF EXISTS public.public_company_profiles;

CREATE OR REPLACE VIEW public.public_company_profiles AS
 SELECT id,
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
    created_at
   FROM companies
  WHERE status = 'approved'::text OR status = 'active'::text;
