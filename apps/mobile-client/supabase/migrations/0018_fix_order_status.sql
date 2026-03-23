-- Migration 0018: Fix Order Status Enum
-- Adiciona o status 'rejected' e 'payment_failed' ao check constraint de service_orders

DO $$ 
BEGIN
    -- Remover o check antigo se existir
    ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_status_check;
    
    -- Adicionar o novo check atualizado
    ALTER TABLE public.service_orders 
    ADD CONSTRAINT service_orders_status_check 
    CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'canceled', 'payment_failed'));

    -- Comentário para auditoria
    COMMENT ON COLUMN public.service_orders.status IS 'Status da ordem: pending, accepted, rejected, in_progress, completed, canceled, payment_failed';
END $$;
