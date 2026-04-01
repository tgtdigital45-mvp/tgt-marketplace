-- Add sponsorship and promotional pricing to services
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS promotional_price numeric,
ADD COLUMN IF NOT EXISTS is_sponsored boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS meeting_url text,
ADD COLUMN IF NOT EXISTS address_id uuid,
ADD COLUMN IF NOT EXISTS radius_km integer,
ADD COLUMN IF NOT EXISTS travel_fee numeric;

-- Add sponsorship to companies (Correcting from company_profiles)
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS is_sponsored boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sponsorship_expires_at timestamptz;

-- Refresh the view company_services_view if needed to include these new fields
CREATE OR REPLACE VIEW public.company_services_view AS 
SELECT 
    s.id,
    s.company_id,
    s.title,
    s.description,
    s.price,
    s.starting_price,
    s.promotional_price,
    s.is_sponsored,
    s.category_tag,
    s.packages,
    s.is_active,
    s.created_at,
    s.location_type,
    s.h3_index,
    c.company_name,
    c.slug as company_slug,
    c.logo_url as company_logo,
    c.cover_image_url as company_cover_url,
    c.rating as company_rating,
    c.status as company_status,
    c.is_sponsored as company_is_sponsored
FROM public.services s
JOIN public.companies c ON s.company_id = c.id
WHERE s.deleted_at IS NULL;
