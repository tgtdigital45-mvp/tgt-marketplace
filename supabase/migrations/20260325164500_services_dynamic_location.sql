-- Migration: Services Dynamic Location Extensions
-- Date: 2026-03-25
-- Description: Adds columns to support meeting URLs, travel fees, and service radius.

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS meeting_url TEXT,
ADD COLUMN IF NOT EXISTS travel_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS radius_km NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS address_id TEXT; -- For now as TEXT, can be UUID if we have an addresses table later.

COMMENT ON COLUMN public.services.meeting_url IS 'URL for remote service meetings (Zoom/Meet)';
COMMENT ON COLUMN public.services.travel_fee IS 'Fee charged for traveling to the client location';
COMMENT ON COLUMN public.services.radius_km IS 'Service radius in Kilometers for at-home services';
COMMENT ON COLUMN public.services.address_id IS 'Specific address ID for in-store services';
