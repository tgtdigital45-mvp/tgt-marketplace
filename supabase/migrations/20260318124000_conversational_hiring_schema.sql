-- Migration: Add conversational hiring schema for milestones and proposals
-- Author: Antigravity
-- Date: 2026-03-18

-- ==============================================================================
-- 1. Criação da Tabela Relacional order_installments para dividir pagamentos
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_installments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    phase TEXT NOT NULL CHECK (phase IN ('upfront', 'final', 'milestone')),
    amount_cents INTEGER NOT NULL,
    stripe_payment_intent_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para otimizar a listagem de parcelas do painel do financeiro e da API
CREATE INDEX IF NOT EXISTS idx_order_installments_order_id ON public.order_installments(order_id);
-- Index para busca rápida via webhook da Stripe (Ponto crítico de performance)
CREATE INDEX IF NOT EXISTS idx_order_installments_stripe_pi ON public.order_installments(stripe_payment_intent_id);

-- Ativar segurança
ALTER TABLE public.order_installments ENABLE ROW LEVEL SECURITY;

-- Politica RLS: Apenas compradores ou vendedores do pedido-mãe podem ler suas parcelas
CREATE POLICY "Users can view order installments of their orders"
ON public.order_installments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_installments.order_id
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
);

-- Nota RLS: Atualizações e Isenções serão feitas pelas Edge Functions (Com role bypass), garantindo a inviolabilidade do pagamento.

-- ==============================================================================
-- 2. Modificação da tabela messages para suportar Chat de Propostas
-- ==============================================================================

DO $$
BEGIN
    -- Verificar se "metadata" (JSONB) existe em messages, se não, adicione
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'metadata') THEN
        ALTER TABLE public.messages ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Verificar se "type" existe. Se não existir, adicionar com default 'text'.
    -- Assumimos que a constraint que valida "text, image, proposal" possa ser gerenciada localmente
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'type') THEN
        ALTER TABLE public.messages ADD COLUMN type TEXT DEFAULT 'text';
    END IF;
END $$;
