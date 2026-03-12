-- Migration 0020: Canonical Status Alignment
-- Alinha os status com o padrão: pending, accepted, rejected, in_progress, completed, canceled

BEGIN;

-- 1. Remover constraint antiga
ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_status_check;

-- 2. Mapear status para o novo padrão
-- ongoing -> in_progress
-- cancelled -> canceled
-- draft/disputed/payment_failed -> (conforme necessidade, aqui mapeamos para pending se não houver regra clara, 
-- ou mantemos se quisermos expandir o canônico. O usuário pediu o set reduzido.)

UPDATE public.service_orders SET status = 'in_progress' WHERE status = 'ongoing';
UPDATE public.service_orders SET status = 'canceled' WHERE status = 'cancelled';
UPDATE public.service_orders SET status = 'pending' WHERE status IN ('draft', 'disputed', 'payment_failed');

-- 3. Aplicar nova constraint
ALTER TABLE public.service_orders 
ADD CONSTRAINT service_orders_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'canceled'));

COMMENT ON COLUMN public.service_orders.status IS 'Status canônico: pending, accepted, rejected, in_progress, completed, canceled';

COMMIT;
