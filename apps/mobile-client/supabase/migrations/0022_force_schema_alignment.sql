-- Migration 0022: Force Schema Alignment for Service Orders
-- Resolve violação "service_orders_status_check" e garante a existência das colunas description e address_reference.

BEGIN;

-- 1. Colunas Adicionais (Proteção dupla do 0021)
ALTER TABLE public.service_orders 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS address_reference text;

-- 2. Migração de Dados (Fallback caso 0020 não tenha sido aplicado ou tenha travado)
UPDATE public.service_orders SET status = 'in_progress' WHERE status = 'ongoing';
UPDATE public.service_orders SET status = 'canceled' WHERE status = 'cancelled';
UPDATE public.service_orders SET status = 'pending' WHERE status IN ('draft', 'disputed', 'payment_failed');

-- 3. Correção da Constraint (Força o padrão canônico do Frontend)
ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_status_check;

ALTER TABLE public.service_orders 
ADD CONSTRAINT service_orders_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'canceled'));

COMMENT ON COLUMN public.service_orders.status IS 'Status canônico: pending, accepted, rejected, in_progress, completed, canceled';
COMMENT ON COLUMN public.service_orders.description IS 'Obsevarções ou detalhes adicionais do pedido.';
COMMENT ON COLUMN public.service_orders.address_reference IS 'Ponto de referência do endereço.';

COMMIT;
