-- Migration: Optimize Orders Fetching with RPC and indices
-- Objective: Remove complex N+1 data fetching from Frontend UI and encapsulate business logic in Postgres.

-- 1. Create indices for faster RLS and RPC execution
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 2. Create the RPC for UI encapsulation (Used by useOrders hook)
-- This function securely fetches orders with their related service and company details
CREATE OR REPLACE FUNCTION public.get_user_orders(
    p_user_type text, -- 'client' or 'company'
    p_offset integer DEFAULT 0,
    p_limit integer DEFAULT 15
)
RETURNS TABLE (
    id uuid,
    status text,
    scheduled_for timestamptz,
    price numeric,
    created_at timestamptz,
    service_title text,
    company_name text
)
LANGUAGE plpgsql
SECURITY DEFINER -- Execution context bypasses RLS for speed, but limits heavily by auth.uid() inside
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Securely get the authenticated user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_user_type = 'client' THEN
        RETURN QUERY
        SELECT 
            o.id,
            o.status,
            o.scheduled_for,
            o.price,
            o.created_at,
            s.title AS service_title,
            c.company_name
        FROM orders o
        LEFT JOIN services s ON o.service_id = s.id
        LEFT JOIN companies c ON s.company_id = c.id
        WHERE o.buyer_id = v_user_id
        ORDER BY o.created_at DESC
        OFFSET p_offset
        LIMIT p_limit;
    ELSE
        -- For 'company' or provider 
        RETURN QUERY
        SELECT 
            o.id,
            o.status,
            o.scheduled_for,
            o.price,
            o.created_at,
            s.title AS service_title,
            c.company_name
        FROM orders o
        LEFT JOIN services s ON o.service_id = s.id
        LEFT JOIN companies c ON s.company_id = c.id
        WHERE o.seller_id = v_user_id
        ORDER BY o.created_at DESC
        OFFSET p_offset
        LIMIT p_limit;
    END IF;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_orders(text, integer, integer) TO authenticated;

-- 3. Redefine RLS Policy for direct queries to ensure optimal plan
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" 
ON orders FOR SELECT 
TO authenticated 
USING (
    buyer_id = (select auth.uid()) 
    OR 
    seller_id = (select auth.uid())
);
