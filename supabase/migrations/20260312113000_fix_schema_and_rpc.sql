-- Migration: Fix Schema and RPC
-- Date: 2026-03-12
-- Author: Antigravity

BEGIN;

-- 1. Update order_status enum
-- In PostgreSQL, you can't easily add enum values inside blocks or transactions safely if used elsewhere.
-- We use separate statements for each addition.
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'active'; -- For backward compatibility with some scripts
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ongoing';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_failed';

-- 2. Ensure columns in services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS location_type text DEFAULT 'in_store';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS requires_quote boolean DEFAULT false;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_single_package boolean DEFAULT true;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS starting_price numeric DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS duration_minutes integer;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS gallery jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS packages jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category_tag text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS use_company_availability boolean DEFAULT true;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS allows_escrow boolean DEFAULT true;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS registration_state text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS registration_image text;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS certification_id text;

-- 3. Update get_seller_dashboard_metrics RPC
CREATE OR REPLACE FUNCTION get_seller_dashboard_metrics(p_seller_id UUID)
RETURNS JSON AS $$
DECLARE
    v_total_earnings NUMERIC;
    v_active_clients INT;
    v_new_projects_week INT;
    v_total_sales_count INT;
    v_pending_bookings INT;
    v_completed_services INT;
    v_sales_chart JSON;
    v_recent_activity JSON;
BEGIN
    -- 1. Total Earnings (Completed orders only)
    SELECT COALESCE(SUM(price), 0)
    INTO v_total_earnings
    FROM orders
    WHERE seller_id = p_seller_id AND status = 'completed';

    -- 2. Active Clients (Unique buyers in orders that are NOT cancelled)
    SELECT COUNT(DISTINCT buyer_id)
    INTO v_active_clients
    FROM orders
    WHERE seller_id = p_seller_id AND status NOT IN ('cancelled', 'canceled');

    -- 3. New Projects (Orders created in last 7 days)
    SELECT COUNT(*)
    INTO v_new_projects_week
    FROM orders
    WHERE seller_id = p_seller_id 
    AND created_at >= NOW() - INTERVAL '7 days';

    -- 4. Total Sales Count (All non-cancelled orders)
    SELECT COUNT(*)
    INTO v_total_sales_count
    FROM orders
    WHERE seller_id = p_seller_id AND status NOT IN ('cancelled', 'canceled');

    -- 4.1 Pending Bookings
    -- Adjusted to include all typical active states
    SELECT COUNT(*)
    INTO v_pending_bookings
    FROM orders
    WHERE seller_id = p_seller_id 
    AND status IN ('pending_payment', 'pending', 'accepted', 'in_progress', 'ongoing', 'active');

    -- 4.2 Completed Services
    SELECT COUNT(*)
    INTO v_completed_services
    FROM orders
    WHERE seller_id = p_seller_id AND status = 'completed';

    -- 5. Sales Chart Data (Last 6 months, aggregated by month)
    SELECT json_agg(t)
    INTO v_sales_chart
    FROM (
        SELECT 
            TO_CHAR(date_trunc('month', created_at), 'Mon') as name,
            COALESCE(SUM(price), 0) as sales,
            COUNT(*) as orders_count
        FROM orders
        WHERE seller_id = p_seller_id 
        AND status NOT IN ('cancelled', 'canceled')
        AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at)
    ) t;

    IF v_sales_chart IS NULL THEN
        v_sales_chart := '[]'::JSON;
    END IF;

    -- 6. Recent Activity (Last 5 orders)
    SELECT json_agg(t)
    INTO v_recent_activity
    FROM (
        SELECT 
            o.id,
            o.created_at,
            o.status,
            o.price as agreed_price,
            s.title as service_title
        FROM orders o
        JOIN services s ON o.service_id = s.id
        WHERE o.seller_id = p_seller_id
        ORDER BY o.created_at DESC
        LIMIT 5
    ) t;

    IF v_recent_activity IS NULL THEN
        v_recent_activity := '[]'::JSON;
    END IF;

    -- Return grouped JSON
    RETURN json_build_object(
        'total_earnings', v_total_earnings,
        'active_clients', v_active_clients,
        'new_projects_week', v_new_projects_week,
        'total_sales_count', v_total_sales_count,
        'pending_bookings', v_pending_bookings,
        'completed_services', v_completed_services,
        'sales_chart', v_sales_chart,
        'recent_activity', v_recent_activity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

COMMIT;
