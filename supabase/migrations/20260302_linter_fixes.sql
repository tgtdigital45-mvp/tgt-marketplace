-- Migration: Linter Fixes (Security Definer Views, Search Path, RLS)
-- Date: 2026-03-02
-- Author: Antigravity

-- 1. Fix Security Definer Views (ERROR)
-- Supabase linter recommends using security_invoker = true for views
ALTER VIEW public.seller_stats SET (security_invoker = on);
ALTER VIEW public.public_company_profiles SET (security_invoker = on);

-- 2. Fix Function Search Path Mutable (WARN)
-- Functions must have a secure search_path to prevent search path injection attacks
ALTER FUNCTION public.append_saga_log(p_order_id uuid, p_event text, p_data jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_expired_booking_locks() SET search_path = public, pg_temp;
ALTER FUNCTION public.create_order_saga(p_service_id uuid, p_package_tier text, p_seller_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_order_saga(p_service_id uuid, p_package_tier text, p_seller_id uuid, p_booking_date date, p_booking_time text) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_order_saga(p_service_id uuid, p_package_tier text, p_seller_id uuid, p_booking_date date, p_booking_time text, p_hiring_responses jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_admin_metrics() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_chat_threads(p_user_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_nearby_services(p_h3_indexes text[], p_category text, p_limit integer, p_offset integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_remote_services(p_category text, p_search text, p_limit integer, p_offset integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_seller_dashboard_metrics(p_seller_id uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_service_details(service_slug text) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_customer_stripe_sync() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_message_notification() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_order_status_notification() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_service_stripe_sync() SET search_path = public, pg_temp;
ALTER FUNCTION public.increment_pending_balance(row_id uuid, amount_to_add numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;
ALTER FUNCTION public.process_payout_request(p_wallet_id uuid, p_amount numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.propagate_company_h3_to_services() SET search_path = public, pg_temp;
ALTER FUNCTION public.release_earnings() SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_service_h3_from_company() SET search_path = public, pg_temp;
ALTER FUNCTION public.transition_saga_status(p_order_id uuid, p_new_status text, p_log_data jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_company_rating_stats() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_earnings() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_reputation() SET search_path = public, pg_temp;

-- 3. Fix Permissive RLS Policies (WARN)

-- saga_jobs: Previously allowed PUBLIC. Restricting strictly to service_role.
DROP POLICY IF EXISTS "Service role manages saga jobs" ON public.saga_jobs;
CREATE POLICY "Service role manages saga jobs" ON public.saga_jobs
AS PERMISSIVE FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- team_members: Previously WITH CHECK (true) for authenticated inserts.
-- Now restricts insert only if the user is the owner of the company.
DROP POLICY IF EXISTS "Users can insert team memberships" ON public.team_members;
CREATE POLICY "Users can insert team memberships" ON public.team_members
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies c 
    WHERE c.id = team_members.company_id AND c.profile_id = auth.uid()
  )
);
