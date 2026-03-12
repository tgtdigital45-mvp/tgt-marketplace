-- Migration: Add budget_expectation to orders
-- Path: supabase/migrations/20260312154500_add_budget_to_orders.sql

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS budget_expectation NUMERIC(10, 2);

COMMENT ON COLUMN public.orders.budget_expectation IS 'Expectativa de orçamento enviada pelo cliente na solicitação.';

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS budget_expectation NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS proposal_value NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS proposal_scope TEXT,
ADD COLUMN IF NOT EXISTS proposal_validity_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS proposal_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS proposal_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS proposal_viewed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.budget_expectation IS 'Expectativa de orçamento enviada pelo cliente na solicitação.';
COMMENT ON COLUMN public.orders.notes IS 'Observações ou descrição detalhada da necessidade do cliente.';
COMMENT ON COLUMN public.orders.proposal_value IS 'Valor proposto pelo profissional para este orçamento.';
