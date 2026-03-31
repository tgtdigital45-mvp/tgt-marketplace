-- Migration 0024: Security Remediation (Phase 1)
-- Endereça F2, F4, F5.

-- F2: Drop da policy muito permissiva de service_orders
DROP POLICY IF EXISTS "Clients and companies can update their orders." ON service_orders;

-- F2 / Frontend Alignment: Como o front consome 'bookings', removemos o risco em ambas se existirem como tabelas separadas.
DROP POLICY IF EXISTS "Clients and companies can update their orders." ON bookings;

-- F2: Criação da RPC update_order_state segura
CREATE OR REPLACE FUNCTION update_order_state(p_order_id UUID, p_new_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Look up the order in service_orders
    SELECT * INTO v_order FROM service_orders WHERE id = p_order_id;
    
    IF v_order IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- Check if user is the client buyer
    IF v_order.client_id != v_user_id THEN
        -- Check if user owns the seller company
        IF NOT EXISTS (SELECT 1 FROM companies WHERE id = v_order.company_id AND profile_id = v_user_id) THEN
            RAISE EXCEPTION 'Not authorized to modify this order';
        END IF;
    END IF;

    -- Minimal state machine validation
    IF v_order.status = 'canceled' THEN
        RAISE EXCEPTION 'Cannot update a canceled order';
    END IF;

    -- Apply the update
    UPDATE service_orders SET status = p_new_status WHERE id = p_order_id;
END;
$$;

-- Just to be safe, duplicate RPC for 'bookings' in case they are completely split
CREATE OR REPLACE FUNCTION update_booking_state(p_order_id UUID, p_new_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_order FROM bookings WHERE id = p_order_id;
    
    IF v_order IS NULL THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    IF v_order.client_id != v_user_id THEN
        IF NOT EXISTS (SELECT 1 FROM companies WHERE id = v_order.company_id AND profile_id = v_user_id) THEN
            RAISE EXCEPTION 'Not authorized to modify this booking';
        END IF;
    END IF;

    IF v_order.status = 'canceled' THEN
        RAISE EXCEPTION 'Cannot update a canceled booking';
    END IF;

    UPDATE bookings SET status = p_new_status WHERE id = p_order_id;
END;
$$;

-- F4 & F5: Storage Remediation for chat-attachments
-- Delete specific legacy policies that allowed full access
DELETE FROM storage.policies WHERE bucket_id = 'chat-attachments';

-- Remove public access if any
UPDATE storage.buckets
SET public = false
WHERE id = 'chat-attachments';

UPDATE storage.buckets
SET public = false
WHERE id = 'chat_media';
