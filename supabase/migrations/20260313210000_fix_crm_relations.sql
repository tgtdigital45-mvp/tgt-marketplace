-- Fix relationships for PostgREST joins
ALTER TABLE crm_lead_scores 
  DROP CONSTRAINT IF EXISTS crm_lead_scores_customer_id_fkey,
  ADD CONSTRAINT crm_lead_scores_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES profiles(id);

ALTER TABLE crm_internal_notes 
  DROP CONSTRAINT IF EXISTS crm_internal_notes_customer_id_fkey,
  ADD CONSTRAINT crm_internal_notes_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES profiles(id);

ALTER TABLE crm_customer_interactions 
  DROP CONSTRAINT IF EXISTS crm_customer_interactions_customer_id_fkey,
  ADD CONSTRAINT crm_customer_interactions_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES profiles(id);

ALTER TABLE crm_documents
  DROP CONSTRAINT IF EXISTS crm_documents_customer_id_fkey,
  ADD CONSTRAINT crm_documents_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES profiles(id);

-- Create get_customer_metrics RPC
CREATE OR REPLACE FUNCTION get_customer_metrics(p_company_id UUID, p_customer_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_ltv NUMERIC;
  v_total_orders INT;
  v_avg_ticket NUMERIC;
  v_last_order_at TIMESTAMPTZ;
BEGIN
  -- LTV (Soma de todos os pedidos COMPLETED para esta empresa)
  SELECT COALESCE(SUM(price), 0) INTO v_ltv
  FROM orders
  WHERE seller_id IN (SELECT profile_id FROM companies WHERE id = p_company_id)
    AND buyer_id = p_customer_id
    AND status = 'completed';

  -- Total Orders
  SELECT COUNT(*) INTO v_total_orders
  FROM orders
  WHERE seller_id IN (SELECT profile_id FROM companies WHERE id = p_company_id)
    AND buyer_id = p_customer_id;

  -- Avg Ticket
  v_avg_ticket := CASE WHEN v_total_orders > 0 THEN v_ltv / v_total_orders ELSE 0 END;

  -- Last Order
  SELECT MAX(created_at) INTO v_last_order_at
  FROM orders
  WHERE seller_id IN (SELECT profile_id FROM companies WHERE id = p_company_id)
    AND buyer_id = p_customer_id;

  RETURN jsonb_build_object(
    'ltv', v_ltv,
    'total_orders', v_total_orders,
    'avg_ticket', v_avg_ticket,
    'last_order_at', v_last_order_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
