-- Fix services RPCs to include location_type and correct filtering
-- Date: 2026-03-25

-- Drop old functions to avoid conflicts with return signature
DROP FUNCTION IF EXISTS public.get_remote_services(text, text, integer, integer);
DROP FUNCTION IF EXISTS public.get_nearby_services(text[], text, integer, integer);

-- 1. Recreate get_nearby_services with location_type
CREATE OR REPLACE FUNCTION public.get_nearby_services(
  p_h3_indexes TEXT[],
  p_category TEXT DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price NUMERIC,
  starting_price NUMERIC,
  duration TEXT,
  company_id UUID,
  h3_index TEXT,
  service_type TEXT,
  location_type TEXT,
  category_tag TEXT,
  image_url TEXT,
  tags TEXT[],
  packages JSONB,
  created_at TIMESTAMPTZ, -- Adicionado
  company_name TEXT,
  company_logo TEXT,
  company_rating NUMERIC,
  company_slug TEXT,
  company_cover_url TEXT
)
LANGUAGE sql STABLE AS $function$
  SELECT
    s.id, s.title, s.description, s.price, s.starting_price, s.duration,
    s.company_id, s.h3_index, s.service_type, s.location_type, s.category_tag, s.image_url,
    s.tags, s.packages, s.created_at, -- Adicionado
    c.company_name, c.logo_url AS company_logo, c.rating AS company_rating,
    c.slug AS company_slug, c.cover_image_url AS company_cover_url
  FROM public.services s
  JOIN public.companies c ON s.company_id = c.id
  WHERE s.is_active = TRUE
    AND s.deleted_at IS NULL
    AND c.status = 'approved'
    AND s.h3_index = ANY(p_h3_indexes)
    AND (p_category IS NULL OR s.category_tag = p_category)
  ORDER BY c.rating DESC NULLS LAST, s.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$function$;

-- 2. Recreate get_remote_services with location_type and correct filter
CREATE OR REPLACE FUNCTION public.get_remote_services(
  p_category TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price NUMERIC,
  starting_price NUMERIC,
  duration TEXT,
  company_id UUID,
  service_type TEXT,
  location_type TEXT,
  category_tag TEXT,
  image_url TEXT,
  tags TEXT[],
  packages JSONB,
  created_at TIMESTAMPTZ, -- Adicionado
  company_name TEXT,
  company_logo TEXT,
  company_rating NUMERIC,
  company_slug TEXT,
  company_cover_url TEXT
)
LANGUAGE sql STABLE AS $function$
  SELECT
    s.id, s.title, s.description, s.price, s.starting_price, s.duration,
    s.company_id, s.service_type, s.location_type, s.category_tag, s.image_url,
    s.tags, s.packages, s.created_at, -- Adicionado
    c.company_name, c.logo_url AS company_logo, c.rating AS company_rating,
    c.slug AS company_slug, c.cover_image_url AS company_cover_url
  FROM public.services s
  JOIN public.companies c ON s.company_id = c.id
  WHERE s.is_active = TRUE
    AND s.deleted_at IS NULL
    AND c.status = 'approved'
    -- Filter by location_type instead of service_type to match Wizard logic
    AND s.location_type IN ('remote', 'hybrid')
    AND (p_category IS NULL OR s.category_tag = p_category)
    AND (
      p_search IS NULL
      OR s.title ILIKE '%' || p_search || '%'
      OR s.description ILIKE '%' || p_search || '%'
      OR s.category_tag ILIKE '%' || p_search || '%'
    )
  ORDER BY c.rating DESC NULLS LAST, s.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_nearby_services(text[], text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nearby_services(text[], text, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_remote_services(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_remote_services(text, text, integer, integer) TO anon;
