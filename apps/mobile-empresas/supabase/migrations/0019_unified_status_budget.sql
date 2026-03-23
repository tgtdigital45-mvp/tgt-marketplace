-- Migration 0019: Unified Status and Budget Proposals
-- Alinha os status com os requisitos: draft, pending, accepted, rejected, ongoing, completed, cancelled, disputed

BEGIN;

-- 1. Atualizar o Constraint de Status em service_orders
ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_status_check;

-- Mapear status antigos para novos se necessário (in_progress -> ongoing, canceled -> cancelled)
UPDATE public.service_orders SET status = 'ongoing' WHERE status = 'in_progress';
UPDATE public.service_orders SET status = 'cancelled' WHERE status = 'canceled';

ALTER TABLE public.service_orders 
ADD CONSTRAINT service_orders_status_check 
CHECK (status IN ('draft', 'pending', 'accepted', 'rejected', 'ongoing', 'completed', 'cancelled', 'disputed', 'payment_failed'));

COMMENT ON COLUMN public.service_orders.status IS 'Status unificado: draft, pending, accepted, rejected, ongoing, completed, cancelled, disputed, payment_failed';

-- 2. Criar Tabela de Propostas (Budget/Negotiation)
CREATE TABLE IF NOT EXISTS public.order_proposals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.service_orders(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10, 2) NOT NULL,
  estimated_duration text,
  notes text,
  status text CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')) DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Ativar RLS
ALTER TABLE public.order_proposals ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para propostas
CREATE POLICY "Users can view proposals for their orders."
ON public.order_proposals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.service_orders o
    WHERE o.id = order_proposals.order_id
    AND (o.client_id = auth.uid() OR o.company_id IN (SELECT c.id FROM public.companies c WHERE c.owner_id = auth.uid()))
  )
);

CREATE POLICY "Companies can manage their own proposals."
ON public.order_proposals FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = order_proposals.company_id AND c.owner_id = auth.uid()
  )
);

-- 3. Adicionar flag de orçamento no serviço (opcional mas recomendado para simplificar UI)
-- Se o serviço é de orçamento, o formulário de perguntas é obrigatório.
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS requires_quote boolean DEFAULT false;

COMMIT;
