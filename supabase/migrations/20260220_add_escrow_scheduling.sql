-- Migration: Add Escrow logic, Stripe charges status, and Strike Policy
-- Date: 2026-02-20

-- 1. Add fields to `companies`
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS ignored_orders integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2. Setup pg_cron for Hourly Auto-Refund check
-- Note: Requires `pg_cron` and `pg_net` extensions enabled.
-- Uncomment the following line if you need to enable pg_net:
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- We schedule it to run every hour at minute 0 (e.g. 10:00, 11:00)
SELECT cron.schedule(
    'process-auto-refunds-hourly',
    '0 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/auto-refund-expired',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claim.role', true) || '"}'::jsonb,
        body := '{}'::jsonb
    ) as request_id;
    $$
);
