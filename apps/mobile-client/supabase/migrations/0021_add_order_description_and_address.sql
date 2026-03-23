-- Migration 0021: Add description and address_reference to service_orders
-- Permite que pedidos tenham observações/detalhes e referência de endereço

BEGIN;

ALTER TABLE public.service_orders 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS address_reference text;

COMMENT ON COLUMN public.service_orders.description IS 'Obsevarções ou detalhes adicionais do pedido fornecidos pelo cliente.';
COMMENT ON COLUMN public.service_orders.address_reference IS 'Ponto de referência ou detalhes adicionais do endereço de prestação.';

COMMIT;
