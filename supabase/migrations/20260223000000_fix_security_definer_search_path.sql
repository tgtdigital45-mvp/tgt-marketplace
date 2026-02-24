-- ============================================================
-- Security Fix: Add restricted search_path to all SECURITY DEFINER functions
-- Without a fixed search_path, an attacker could create a function/table
-- in the public schema with the same name as a pg_catalog object and
-- hijack execution within these elevated-privilege functions.
-- ============================================================

-- Trigger functions (stripe sync)
ALTER FUNCTION handle_service_stripe_sync() SET search_path = public, pg_catalog;
ALTER FUNCTION handle_customer_stripe_sync() SET search_path = public, pg_catalog;

-- SAGA RPC (used by checkout flow)
ALTER FUNCTION create_order_saga(UUID, TEXT, UUID, DATE, TEXT) SET search_path = public, pg_catalog;
