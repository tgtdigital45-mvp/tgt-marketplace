-- 1. Move extensions to the "extensions" schema
CREATE SCHEMA IF NOT EXISTS extensions;

ALTER EXTENSION pg_trgm SET SCHEMA extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- pg_net is non-relocatable, so it must be dropped and recreated
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net SCHEMA extensions;

-- 2. Dynamically set search_path = public for affected functions
DO $$
DECLARE
    rec record;
BEGIN
    FOR rec IN
        SELECT oid::regprocedure AS func_sig
        FROM pg_proc
        WHERE proname IN (
            'get_chat_threads', 
            'check_rate_limit', 
            'match_companies', 
            'calculate_lead_score', 
            'get_customer_metrics', 
            'search_companies'
        )
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'ALTER FUNCTION ' || rec.func_sig || ' SET search_path = public, extensions';
    END LOOP;
END
$$;

-- 3. Fix permissive RLS policy on waitlist
DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.waitlist;
CREATE POLICY "Anyone can join the waitlist" ON public.waitlist
    FOR INSERT 
    WITH CHECK (email IS NOT NULL);
