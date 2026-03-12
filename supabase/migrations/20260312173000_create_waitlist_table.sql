-- Migration: Create Waitlist Table
-- Date: 2026-03-12

BEGIN;

CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    full_name TEXT,
    user_type TEXT, -- 'provider', 'customer', 'both'
    source TEXT DEFAULT 'web', -- 'web', 'mobile'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint for unique email
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_idx ON public.waitlist (email);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can join the waitlist (insert)
CREATE POLICY "Anyone can join the waitlist" ON public.waitlist
    FOR INSERT WITH CHECK (true);

-- Only admins can view the waitlist
CREATE POLICY "Admins can view waitlist" ON public.waitlist
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

COMMIT;
