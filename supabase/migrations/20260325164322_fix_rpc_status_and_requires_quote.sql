-- Fix: RPCs now accept companies with status 'active' OR 'approved'
-- and return requires_quote field for correct badge rendering.
-- Also adds p_search parameter to get_nearby_services.
-- Date: 2026-03-25

-- Drop old functions to avoid signature conflicts
DROP FUNCTION IF EXISTS public.get_remote_services(text, text, integer, integer);
DROP FUNCTION IF EXISTS public.get_nearby_services(text[], text, integer, integer);

-- ─── 1. get_remote_services ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_remote_services(
  p_category TEXT DEFAULT NULL,
  p_search   TEXT DEFAULT NULL,
  p_limit    INT  DEFAULT 20,
  p_offset   INT  DEFAULT 0
)
RETURNS TABLE (
  id             UUID,
  title          TEXT,
  description    TEXT,
  price          NUMERIC,
  starting_price NUMERIC,
  duration       TEXT,
  company_id     UUID,
  service_type   TEXT,
  location_type  TEXT,
  requires_quote BOOLEAN,
  category_tag   TEXT,
  image_url      TEXT,
  tags           TEXT[],
  packages       JSONB,
  created_at     TIMESTAMPTZ,
  company_name   TEXT,
  company_logo   TEXT,
  company_rating NUMERIC,
  company_slug   TEXT,
  company_cover_url TEXT
)
LANGUAGE sql STABLE AS $function$
  SELECT
    s.id, s.title, s.description, s.price, s.starting_price, s.duration,
    s.company_id, s.service_type, s.location_type, s.requires_quote,
    s.category_tag, s.image_url, s.tags, s.packages, s.created_at,
    c.company_name, c.logo_url AS company_logo, c.rating AS company_rating,
    c.slug AS company_slug, c.cover_image_url AS company_cover_url
  FROM public.services s
  JOIN public.companies c ON s.company_id = c.id
  WHERE s.is_active = TRUE
    AND s.deleted_at IS NULL
    AND c.status IN ('approved', 'active')
    AND s.location_type IN ('remote', 'hybrid')
    AND (p_category IS NULL OR s.category_tag = p_category)
    AND (
      p_search IS NULL
      OR s.title       ILIKE '%' || p_search || '%'
      OR s.description ILIKE '%' || p_search || '%'
      OR s.category_tag ILIKE '%' || p_search || '%'
    )
  ORDER BY c.rating DESC NULLS LAST, s.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$function$;

-- ─── 2. get_nearby_services ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_nearby_services(
  p_h3_indexes TEXT[],
  p_category   TEXT DEFAULT NULL,
  p_search     TEXT DEFAULT NULL,
  p_limit      INT  DEFAULT 20,
  p_offset     INT  DEFAULT 0
)
RETURNS TABLE (
  id             UUID,
  title          TEXT,
  description    TEXT,
  price          NUMERIC,
  starting_price NUMERIC,
  duration       TEXT,
  company_id     UUID,
  h3_index       TEXT,
  service_type   TEXT,
  location_type  TEXT,
  requires_quote BOOLEAN,
  category_tag   TEXT,
  image_url      TEXT,
  tags           TEXT[],
  packages       JSONB,
  created_at     TIMESTAMPTZ,
  company_name   TEXT,
  company_logo   TEXT,
  company_rating NUMERIC,
  company_slug   TEXT,
  company_cover_url TEXT
)
LANGUAGE sql STABLE AS $function$
  SELECT
    s.id, s.title, s.description, s.price, s.starting_price, s.duration,
    s.company_id, s.h3_index, s.service_type, s.location_type, s.requires_quote,
    s.category_tag, s.image_url, s.tags, s.packages, s.created_at,
    c.company_name, c.logo_url AS company_logo, c.rating AS company_rating,
    c.slug AS company_slug, c.cover_image_url AS company_cover_url
  FROM public.services s
  JOIN public.companies c ON s.company_id = c.id
  WHERE s.is_active = TRUE
    AND s.deleted_at IS NULL
    AND c.status IN ('approved', 'active')
    AND s.h3_index = ANY(p_h3_indexes)
    AND (p_category IS NULL OR s.category_tag = p_category)
    AND (
      p_search IS NULL
      OR s.title       ILIKE '%' || p_search || '%'
      OR s.description ILIKE '%' || p_search || '%'
      OR s.category_tag ILIKE '%' || p_search || '%'
    )
  ORDER BY c.rating DESC NULLS LAST, s.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$function$;

-- ─── Permissions ──────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.get_remote_services(text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_remote_services(text, text, integer, integer) TO anon;

GRANT EXECUTE ON FUNCTION public.get_nearby_services(text[], text, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nearby_services(text[], text, text, integer, integer) TO anon;
