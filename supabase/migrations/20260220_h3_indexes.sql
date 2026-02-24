-- 20260220_h3_indexes.sql
-- Optimizing H3 geolocation lookups with exact String B-Tree indexes

CREATE INDEX IF NOT EXISTS idx_services_h3_index ON public.services (h3_index);
CREATE INDEX IF NOT EXISTS idx_companies_h3_index ON public.companies (h3_index);
CREATE INDEX IF NOT EXISTS idx_profiles_h3_index ON public.profiles (h3_index);
