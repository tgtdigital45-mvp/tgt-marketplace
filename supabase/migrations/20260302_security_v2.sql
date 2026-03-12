-- Migration: Security V2 - Marketplace Lockdown
-- Date: 2026-03-02
-- Author: Antigravity

-- 1. Create a secure view for public company profiles
-- This avoids exposing sensitive columns like stripe_account_id, commission_rate, etc.
DROP VIEW IF EXISTS public.public_company_profiles CASCADE;
CREATE OR REPLACE VIEW public.public_company_profiles AS
SELECT 
    id, 
    company_name, 
    logo_url, 
    cover_image_url,
    rating, 
    slug, 
    category, 
    status, 
    city, 
    state,
    description,
    created_at
FROM public.companies
WHERE status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.public_company_profiles TO anon, authenticated;

-- 2. Ensure SELECT access to "companies"
-- The system uses JOINs and .select('*') in many places. 
-- RLS policies already protect sensitive data visibility per user.
GRANT SELECT ON public.companies TO anon, authenticated;

-- 3. Optimized Chat Thread RPC
-- Returns a summary of threads for a user without fetching all messages.
DROP FUNCTION IF EXISTS public.get_chat_threads(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.get_chat_threads(p_user_id uuid)
RETURNS TABLE (
    thread_id uuid,
    job_id uuid,
    order_id uuid,
    job_title text,
    partner_id uuid,
    partner_name text,
    partner_avatar text,
    last_message_content text,
    last_message_time timestamptz,
    unread_count bigint
) AS $$
BEGIN
    RETURN QUERY
    WITH last_messages AS (
        SELECT DISTINCT ON (COALESCE(job_id, order_id))
            id,
            COALESCE(job_id, order_id) as t_id,
            job_id,
            order_id,
            content,
            created_at,
            sender_id,
            receiver_id,
            read
        FROM public.messages
        WHERE sender_id = p_user_id OR receiver_id = p_user_id
        ORDER BY COALESCE(job_id, order_id), created_at DESC
    ),
    unread_counts AS (
        SELECT 
            COALESCE(job_id, order_id) as t_id,
            COUNT(*) as count
        FROM public.messages
        WHERE receiver_id = p_user_id AND read = false
        GROUP BY COALESCE(job_id, order_id)
    )
    SELECT 
        lm.t_id as thread_id,
        lm.job_id,
        lm.order_id,
        COALESCE(j.title, o.service_title, 'Serviço') as job_title,
        CASE WHEN lm.sender_id = p_user_id THEN lm.receiver_id ELSE lm.sender_id END as partner_id,
        pr.full_name as partner_name,
        pr.avatar_url as partner_avatar,
        lm.content as last_message_content,
        lm.created_at as last_message_time,
        COALESCE(uc.count, 0) as unread_count
    FROM last_messages lm
    LEFT JOIN public.jobs j ON lm.job_id = j.id
    LEFT JOIN public.orders o ON lm.order_id = o.id
    LEFT JOIN public.profiles pr ON pr.id = (CASE WHEN lm.sender_id = p_user_id THEN lm.receiver_id ELSE lm.sender_id END)
    LEFT JOIN unread_counts uc ON uc.t_id = lm.t_id
    ORDER BY lm.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.get_chat_threads(uuid) TO authenticated;
