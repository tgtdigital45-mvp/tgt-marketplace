-- ============================================================
-- TGT Marketplace — SAGA Orchestration Pattern (iFood-style)
-- Migration: add_saga_pattern.sql
--
-- Implements distributed transaction consistency for checkout.
-- Uses Postgres as the job queue (no Redis/BullMQ needed).
-- The Edge Function handle-payment-webhook acts as the Worker.
-- ============================================================

-- 1. SAGA STATUS TYPE (as a check constraint, not enum for flexibility)
-- States follow the SAGA state machine:
-- PENDING → PAYMENT_PROCESSING → PAYMENT_CONFIRMED → ORDER_ACTIVE
--                              ↘ PAYMENT_FAILED → CANCELLED

-- 2. ADD SAGA FIELDS TO ORDERS TABLE
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS saga_status TEXT DEFAULT 'PENDING'
    CHECK (saga_status IN (
      'PENDING',              -- Order created, awaiting payment redirect
      'PAYMENT_PROCESSING',   -- User redirected to Stripe, awaiting webhook
      'PAYMENT_CONFIRMED',    -- Stripe confirmed payment, worker activating
      'PAYMENT_FAILED',       -- Stripe reported failure or timeout
      'ORDER_ACTIVE',         -- Payment confirmed, order is live
      'CANCELLED',            -- Compensated/cancelled after failure
      'REFUNDED'              -- Payment reversed
    )),
  ADD COLUMN IF NOT EXISTS saga_log JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- 3. SAGA JOBS TABLE (Persistent Job Queue)
-- Each row is a job to be processed by the webhook worker.
-- Supports retry with exponential backoff via attempts/max_attempts.
CREATE TABLE IF NOT EXISTS public.saga_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'ORDER_CREATED',        -- Initial event: order created, awaiting payment
    'PAYMENT_CONFIRMED',    -- Stripe webhook: payment succeeded
    'PAYMENT_FAILED',       -- Stripe webhook: payment failed
    'ACTIVATE_ORDER',       -- Worker: activate order after payment confirmed
    'COMPENSATE',           -- Worker: rollback/cancel after failure
    'NOTIFY_SELLER',        -- Worker: send notification to seller
    'NOTIFY_BUYER'          -- Worker: send notification to buyer
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Waiting to be processed
    'processing',   -- Currently being processed (lock)
    'completed',    -- Successfully processed
    'failed',       -- Failed after max_attempts
    'skipped'       -- Skipped (e.g. duplicate event)
  )),
  payload JSONB DEFAULT '{}'::jsonb,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- 4. RLS FOR SAGA JOBS
-- Only service_role (Edge Functions) can read/write saga_jobs.
-- Clients should NEVER directly access this table.
ALTER TABLE public.saga_jobs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (used by Edge Functions)
CREATE POLICY "Service role manages saga jobs"
  ON public.saga_jobs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. PERFORMANCE INDEXES FOR JOB QUEUE
-- The worker polls for pending jobs ordered by creation time
CREATE INDEX IF NOT EXISTS idx_saga_jobs_pending
  ON public.saga_jobs(status, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_saga_jobs_order
  ON public.saga_jobs(order_id);

CREATE INDEX IF NOT EXISTS idx_saga_jobs_retry
  ON public.saga_jobs(next_retry_at)
  WHERE status = 'failed' AND attempts < max_attempts;

-- Index for SAGA status on orders (frequent polling from frontend)
CREATE INDEX IF NOT EXISTS idx_orders_saga_status
  ON public.orders(saga_status);

-- 6. FUNCTION: Append to saga_log (immutable audit trail)
-- Called by the webhook worker to record each state transition.
CREATE OR REPLACE FUNCTION append_saga_log(
  p_order_id UUID,
  p_event TEXT,
  p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.orders
  SET saga_log = saga_log || jsonb_build_object(
    'event', p_event,
    'timestamp', now()::text,
    'data', p_data
  )::jsonb
  WHERE id = p_order_id;
END;
$$;

-- 7. FUNCTION: Transition SAGA state (with validation)
-- Enforces valid state transitions to prevent invalid state jumps.
CREATE OR REPLACE FUNCTION transition_saga_status(
  p_order_id UUID,
  p_new_status TEXT,
  p_log_data JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status TEXT;
  v_allowed_transitions JSONB := '{
    "PENDING": ["PAYMENT_PROCESSING", "CANCELLED"],
    "PAYMENT_PROCESSING": ["PAYMENT_CONFIRMED", "PAYMENT_FAILED"],
    "PAYMENT_CONFIRMED": ["ORDER_ACTIVE", "CANCELLED"],
    "PAYMENT_FAILED": ["CANCELLED"],
    "ORDER_ACTIVE": ["REFUNDED"],
    "CANCELLED": [],
    "REFUNDED": []
  }'::jsonb;
BEGIN
  SELECT saga_status INTO v_current_status
  FROM public.orders WHERE id = p_order_id FOR UPDATE;

  -- Validate transition
  IF NOT (v_allowed_transitions->v_current_status @> to_jsonb(p_new_status)) THEN
    RAISE WARNING 'Invalid SAGA transition: % → % for order %',
      v_current_status, p_new_status, p_order_id;
    RETURN FALSE;
  END IF;

  -- Apply transition
  UPDATE public.orders
  SET saga_status = p_new_status
  WHERE id = p_order_id;

  -- Log the transition
  PERFORM append_saga_log(p_order_id, p_new_status, p_log_data);

  RETURN TRUE;
END;
$$;

-- 8. BACKFILL: Set existing orders to appropriate SAGA status
-- Orders with payment_status='paid' → ORDER_ACTIVE
-- Orders with status='active' → ORDER_ACTIVE
-- Others → PENDING
UPDATE public.orders
SET saga_status = CASE
  WHEN payment_status = 'paid' OR status = 'active' THEN 'ORDER_ACTIVE'
  WHEN status = 'cancelled' THEN 'CANCELLED'
  WHEN status = 'completed' THEN 'ORDER_ACTIVE'
  ELSE 'PENDING'
END
WHERE saga_status = 'PENDING';

COMMENT ON TABLE public.saga_jobs IS
  'Persistent job queue for SAGA orchestration. Each row is an event to be processed by the webhook worker Edge Function.';
COMMENT ON COLUMN public.orders.saga_status IS
  'SAGA state machine status. Tracks the distributed transaction lifecycle from PENDING to ORDER_ACTIVE or CANCELLED.';
COMMENT ON COLUMN public.orders.saga_log IS
  'Immutable audit trail of SAGA state transitions. Array of {event, timestamp, data} objects.';
