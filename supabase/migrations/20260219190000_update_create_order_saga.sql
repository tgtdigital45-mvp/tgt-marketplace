-- ============================================================
-- TGT Marketplace — SAGA Checkout RPC (Updated for Booking)
-- Migration: 20260219190000_update_create_order_saga.sql
-- ============================================================

CREATE OR REPLACE FUNCTION create_order_saga(
  p_service_id UUID,
  p_package_tier TEXT,
  p_seller_id UUID,
  p_booking_date DATE DEFAULT NULL,
  p_booking_time TEXT DEFAULT NULL
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

  -- 6. Insert booking if scheduling info provided
  IF p_booking_date IS NOT NULL AND p_booking_time IS NOT NULL THEN
    INSERT INTO public.bookings (
      client_id,
      company_id,
      service_id,
      order_id,
      package_tier,
      service_title,
      service_price,
      booking_date,
      booking_time,
      status
    )
    VALUES (
      auth.uid(),
      v_service.company_id,
      p_service_id,
      v_order_id,
      p_package_tier,
      v_service.title,
      v_price,
      p_booking_date,
      p_booking_time,
      'pending'
    );
  END IF;

  -- 7. Insert first SAGA job: ORDER_CREATED
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
    'completed',
    jsonb_build_object(
      'service_id', p_service_id,
      'buyer_id', auth.uid(),
      'seller_id', p_seller_id,
      'price', v_price,
      'package_tier', p_package_tier,
      'booking_date', p_booking_date,
      'booking_time', p_booking_time
    ),
    now()
  );

  -- 8. Return order details for frontend
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
-- DROP old if exists with different parameter count to avoid errors if needed, 
-- but usually CREATE OR REPLACE handles it if parameters are compatible or we use defaults.
GRANT EXECUTE ON FUNCTION create_order_saga(UUID, TEXT, UUID, DATE, TEXT) TO authenticated;
