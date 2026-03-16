-- Dead Letter Queue (DLQ) for Stripe Webhooks

CREATE TYPE public.dlq_status AS ENUM ('pending', 'processed', 'failed_permanently');

CREATE TABLE IF NOT EXISTS public.stripe_webhook_dlq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    error_message TEXT,
    status dlq_status DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS to prevent unauthorized access
ALTER TABLE public.stripe_webhook_dlq ENABLE ROW LEVEL SECURITY;

-- Allow read/write access to service role only, no public access
-- (Service role key bypasses RLS inherently, but explicit policy is good practice if needed)
CREATE POLICY "Service role full access on stripe_webhook_dlq"
    ON public.stripe_webhook_dlq
    USING (auth.uid() IS NULL)
    WITH CHECK (auth.uid() IS NULL);

-- Create index for faster querying of pending events by cron jobs
CREATE INDEX IF NOT EXISTS idx_stripe_dlq_status ON public.stripe_webhook_dlq (status);
