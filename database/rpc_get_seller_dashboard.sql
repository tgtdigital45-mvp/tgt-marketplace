CREATE OR REPLACE FUNCTION get_seller_dashboard_metrics(p_seller_id UUID)
RETURNS JSON AS $$
DECLARE
    v_total_earnings NUMERIC;
    v_active_clients INT;
    v_new_projects_week INT;
    v_total_sales_count INT;
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
    WHERE seller_id = p_seller_id AND status != 'cancelled';

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
    WHERE seller_id = p_seller_id AND status != 'cancelled';

    -- 5. Sales Chart Data (Last 6 months, aggregated by month)
    SELECT json_agg(t)
    INTO v_sales_chart
    FROM (
        SELECT 
            TO_CHAR(date_trunc('month', created_at), 'Mon') as name,
            COALESCE(SUM(price), 0) as sales
        FROM orders
        WHERE seller_id = p_seller_id 
        AND status != 'cancelled'
        AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at)
    ) t;

    -- If no sales data, return empty structure or zero-filled (frontend handles null, but let's be safe)
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
        'sales_chart', v_sales_chart,
        'recent_activity', v_recent_activity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
