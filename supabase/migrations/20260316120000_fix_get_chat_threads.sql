-- Fix ambiguous column references in get_chat_threads RPC
-- Date: 2026-03-16

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
        SELECT DISTINCT ON (COALESCE(m.job_id, m.order_id))
            m.id,
            COALESCE(m.job_id, m.order_id) as t_id,
            m.job_id,
            m.order_id,
            m.content,
            m.created_at,
            m.sender_id,
            m.receiver_id,
            m.is_read as read
        FROM public.messages m
        WHERE m.sender_id = p_user_id OR m.receiver_id = p_user_id
        ORDER BY COALESCE(m.job_id, m.order_id), m.created_at DESC
    ),
    unread_counts AS (
        SELECT 
            COALESCE(m.job_id, m.order_id) as t_id,
            COUNT(*) as count
        FROM public.messages m
        WHERE m.receiver_id = p_user_id AND m.is_read = false
        GROUP BY COALESCE(m.job_id, m.order_id)
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
