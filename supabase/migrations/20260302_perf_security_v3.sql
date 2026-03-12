-- ====================================================================
-- Migration: Performance de Chat + Segurança Financeira
-- Problema 1: Query get_chat_threads lenta por falta de índice composto
-- Problema 2: increment_pending_balance sem verificação de ownership
-- ====================================================================

-- 1. ÍNDICE COMPOSTO — messages
CREATE INDEX IF NOT EXISTS idx_messages_thread_created
ON public.messages (COALESCE(job_id, order_id), created_at DESC);

-- 2. RPC SEGURA — increment_pending_balance (nova assinatura segura)
CREATE OR REPLACE FUNCTION public.increment_pending_balance(
  p_wallet_id UUID,
  p_amount    NUMERIC,
  p_order_id  UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id       UUID;
  v_wallet_owner_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'increment_pending_balance: p_amount deve ser positivo (recebido: %)', p_amount;
  END IF;

  SELECT seller_id INTO v_seller_id FROM public.orders WHERE id = p_order_id;
  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'increment_pending_balance: pedido % não encontrado', p_order_id;
  END IF;

  SELECT user_id INTO v_wallet_owner_id FROM public.wallets WHERE id = p_wallet_id;
  IF v_wallet_owner_id IS NULL THEN
    RAISE EXCEPTION 'increment_pending_balance: carteira % não encontrada', p_wallet_id;
  END IF;

  IF v_wallet_owner_id IS DISTINCT FROM v_seller_id THEN
    RAISE EXCEPTION
      'increment_pending_balance: VIOLAÇÃO DE SEGURANÇA — carteira % não pertence ao seller % do pedido %',
      p_wallet_id, v_seller_id, p_order_id;
  END IF;

  UPDATE public.wallets
  SET pending_balance = pending_balance + p_amount
  WHERE id = p_wallet_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_pending_balance(UUID, NUMERIC, UUID) TO service_role;
