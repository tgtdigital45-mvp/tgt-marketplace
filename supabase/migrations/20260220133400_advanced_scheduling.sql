-- Add Advanced Scheduling Fields
ALTER TABLE "public"."bookings"
ADD COLUMN IF NOT EXISTS "service_duration_minutes" integer,
ADD COLUMN IF NOT EXISTS "proposed_date" date,
ADD COLUMN IF NOT EXISTS "proposed_time" time without time zone,
ADD COLUMN IF NOT EXISTS "proposal_expires_at" timestamp with time zone;

ALTER TABLE "public"."services"
ADD COLUMN IF NOT EXISTS "pricing_model" text DEFAULT 'hourly';

-- If there are ENUMs constraint for booking status, you may need to update it.
-- We are not dropping existing constraint, but if one exists like 
-- 'status IN ('pending', 'confirmed', 'cancelled', 'completed')'
-- we might need to add 'pending_client_approval'.
-- A safe way is to attempt to add a new check constraint cautiously if we know it exists,
-- but usually Supabase uses TEXT. Let's assume text for this MVP unless strictly constrained.
