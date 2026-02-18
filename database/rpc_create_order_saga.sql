-- ============================================================
-- TGT Marketplace — SAGA Checkout RPC
-- Migration: rpc_create_order_saga.sql
--
-- This RPC is called by the frontend when user clicks "Contratar".
-- It atomically creates the order + first SAGA job in one transaction.
-- Returns the order_id for the frontend to use.
-- ============================================================

CREATE OR REPLACE FUNCTION create_order_saga(
  p_service_id UUID,
  p_package_tier TEXT,
  p_seller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_service RECORD;
  v_price NUMERIC;
  v_delivery_deadline TIMESTAMPTZ;
  v_delivery_days INT;
BEGIN
  -- 1. Validate caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 2. Fetch service details
  SELECT
    s.id,
    s.title,
    s.price,
    s.starting_price,
    s.packages,
    s.company_id
  INTO v_service
  FROM public.services s
  WHERE s.id = p_service_id AND s.is_active = TRUE;

  IF v_service IS NULL THEN
    RAISE EXCEPTION 'Service not found or inactive: %', p_service_id;
  END IF;

  -- 3. Determine price from package tier
  v_price := CASE p_package_tier
    WHEN 'basic'    THEN COALESCE((v_service.packages->'basic'->>'price')::numeric, v_service.price, v_service.starting_price)
    WHEN 'standard' THEN COALESCE((v_service.packages->'standard'->>'price')::numeric, v_service.price, v_service.starting_price)
    WHEN 'premium'  THEN COALESCE((v_service.packages->'premium'->>'price')::numeric, v_service.price, v_service.starting_price)
    ELSE COALESCE(v_service.price, v_service.starting_price, 0)
  END;

  -- 4. Determine delivery deadline
  v_delivery_days := CASE p_package_tier
    WHEN 'basic'    THEN COALESCE((v_service.packages->'basic'->>'delivery_time')::int, 7)
    WHEN 'standard' THEN COALESCE((v_service.packages->'standard'->>'delivery_time')::int, 14)
    WHEN 'premium'  THEN COALESCE((v_service.packages->'premium'->>'delivery_time')::int, 21)
    ELSE 7
  END;

  v_delivery_deadline := now() + (v_delivery_days || ' days')::interval;

  -- 5. Create the order with PENDING saga_status
  INSERT INTO public.orders (
    buyer_id,
    seller_id,
    service_id,
    service_title,
    package_tier,
    price,
    status,
    saga_status,
    delivery_deadline,
    saga_log
  )
  VALUES (
    auth.uid(),
    p_seller_id,
    p_service_id,
    v_service.title,
    p_package_tier,
    v_price,
    'pending_payment',
    'PENDING',
    v_delivery_deadline,
    jsonb_build_array(
      jsonb_build_object(
        'event', 'ORDER_CREATED',
        'timestamp', now()::text,
        'data', jsonb_build_object('buyer_id', auth.uid(), 'price', v_price)
      )
    )
  )
  RETURNING id INTO v_order_id;

  -- 6. Insert first SAGA job: ORDER_CREATED
  -- This records the start of the saga.
  INSERT INTO public.saga_jobs (
    order_id,
    event_type,
    status,
    payload,
    processed_at
  )
  VALUES (
    v_order_id,
    'ORDER_CREATED',
    'completed', -- Mark as completed since we just did it
    jsonb_build_object(
      'service_id', p_service_id,
      'buyer_id', auth.uid(),
      'seller_id', p_seller_id,
      'price', v_price,
      'package_tier', p_package_tier
    ),
    now()
  );

  -- NOTE: We do NOT insert a 'waiting' job for payment here.
  -- The Stripe Webhook will receive the payment event and TRIGGER the next step.
  -- The SAGA remains in PENDING state until then.

  -- 7. Return order details for frontend
  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'price', v_price,
    'service_title', v_service.title,
    'package_tier', p_package_tier,
    'delivery_deadline', v_delivery_deadline,
    'saga_status', 'PENDING'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'create_order_saga failed: %', SQLERRM;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_order_saga(UUID, TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION create_order_saga IS
  'SAGA entry point: atomically creates an order + saga jobs in one transaction. Called by frontend checkout. Returns order_id and price for Stripe session creation.';
