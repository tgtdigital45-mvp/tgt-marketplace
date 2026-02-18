-- ============================================================
-- TGT Marketplace — H3 Geolocation Indexing (Uber H3)
-- Migration: add_h3_geolocation.sql
-- 
-- Strategy: Replace lat/lng radius queries with H3 hexagonal
-- index lookups. Resolution 8 = ~460m radius (urban default).
-- Resolution 7 = ~1.4km (regional/smaller cities).
-- ============================================================

-- 1. ADD H3 INDEX COLUMN TO COMPANIES
-- Stores the H3 cell index for the company's registered address.
-- Calculated on the backend when address is saved/updated.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS h3_index TEXT;

-- 2. ADD H3 + SERVICE TYPE COLUMNS TO SERVICES
-- h3_index: inherited from company address for presential services
-- service_type: 'remote' (no geo barrier) | 'presential' (local) | 'hybrid'
-- category_tag: for marketplace vitrine grouping (e.g. 'Design', 'TI')
-- image_url: thumbnail for service card in the marketplace
-- is_active: visibility toggle (soft disable without deleting)
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS h3_index TEXT,
  ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'remote'
    CHECK (service_type IN ('remote', 'presential', 'hybrid')),
  ADD COLUMN IF NOT EXISTS category_tag TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 3. ADD H3 INDEX TO PROFILES (for future client-side geo features)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS h3_index TEXT;

-- 4. PERFORMANCE INDEXES
-- Critical: H3 lookup is a simple equality/IN query — index makes it O(1)
CREATE INDEX IF NOT EXISTS idx_companies_h3
  ON public.companies(h3_index)
  WHERE h3_index IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_services_h3
  ON public.services(h3_index)
  WHERE h3_index IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_services_type
  ON public.services(service_type);

CREATE INDEX IF NOT EXISTS idx_services_category
  ON public.services(category_tag)
  WHERE category_tag IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_services_active
  ON public.services(is_active)
  WHERE is_active = TRUE;

-- Composite index for the most common marketplace query:
-- "Active services of a given type in a given category"
CREATE INDEX IF NOT EXISTS idx_services_marketplace
  ON public.services(service_type, category_tag, is_active)
  WHERE is_active = TRUE;

-- 5. RPC FUNCTION: Get nearby presential services by H3 neighbors
-- Called from frontend with pre-computed neighbor indexes (via h3-js)
-- This avoids ANY math in SQL — pure index lookup.
CREATE OR REPLACE FUNCTION get_nearby_services(
  p_h3_indexes TEXT[],       -- Array of H3 cell indexes (from gridDisk on frontend)
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
  category_tag TEXT,
  image_url TEXT,
  tags TEXT[],
  packages JSONB,
  company_name TEXT,
  company_logo TEXT,
  company_rating NUMERIC,
  company_slug TEXT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    s.id,
    s.title,
    s.description,
    s.price,
    s.starting_price,
    s.duration,
    s.company_id,
    s.h3_index,
    s.service_type,
    s.category_tag,
    s.image_url,
    s.tags,
    s.packages,
    c.company_name,
    c.logo_url AS company_logo,
    c.rating AS company_rating,
    c.slug AS company_slug
  FROM public.services s
  JOIN public.companies c ON s.company_id = c.id
  WHERE
    s.is_active = TRUE
    AND c.status = 'approved'
    AND s.h3_index = ANY(p_h3_indexes)
    AND (p_category IS NULL OR s.category_tag = p_category)
  ORDER BY c.rating DESC NULLS LAST, s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- 6. RPC FUNCTION: Get all remote services (no geo filter)
CREATE OR REPLACE FUNCTION get_remote_services(
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
  category_tag TEXT,
  image_url TEXT,
  tags TEXT[],
  packages JSONB,
  company_name TEXT,
  company_logo TEXT,
  company_rating NUMERIC,
  company_slug TEXT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    s.id,
    s.title,
    s.description,
    s.price,
    s.starting_price,
    s.duration,
    s.company_id,
    s.service_type,
    s.category_tag,
    s.image_url,
    s.tags,
    s.packages,
    c.company_name,
    c.logo_url AS company_logo,
    c.rating AS company_rating,
    c.slug AS company_slug
  FROM public.services s
  JOIN public.companies c ON s.company_id = c.id
  WHERE
    s.is_active = TRUE
    AND c.status = 'approved'
    AND s.service_type IN ('remote', 'hybrid')
    AND (p_category IS NULL OR s.category_tag = p_category)
    AND (
      p_search IS NULL
      OR s.title ILIKE '%' || p_search || '%'
      OR s.description ILIKE '%' || p_search || '%'
      OR s.category_tag ILIKE '%' || p_search || '%'
    )
  ORDER BY c.rating DESC NULLS LAST, s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- 7. BACKFILL: Update existing services to 'remote' type (safe default)
-- All existing services without a type become remote (no geo barrier)
UPDATE public.services
SET service_type = 'remote', is_active = TRUE
WHERE service_type IS NULL;

COMMENT ON COLUMN public.companies.h3_index IS
  'Uber H3 hexagonal cell index at resolution 8 (~460m). Computed from address lat/lng on save.';
COMMENT ON COLUMN public.services.h3_index IS
  'H3 index for presential services. Inherited from company address. NULL for remote services.';
COMMENT ON COLUMN public.services.service_type IS
  'remote: no geo barrier | presential: local/in-person | hybrid: both modalities';
