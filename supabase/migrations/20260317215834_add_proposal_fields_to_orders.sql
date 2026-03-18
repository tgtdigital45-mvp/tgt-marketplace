-- Migration: Add proposal fields to orders table
-- Description: Adds missing columns used by DashboardOrcamentosPage for sending quotes/proposals to clients.

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'proposal_value') THEN
        ALTER TABLE public.orders ADD COLUMN proposal_value NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'proposal_scope') THEN
        ALTER TABLE public.orders ADD COLUMN proposal_scope TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'proposal_validity_days') THEN
        ALTER TABLE public.orders ADD COLUMN proposal_validity_days INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'proposal_deadline') THEN
        ALTER TABLE public.orders ADD COLUMN proposal_deadline TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'proposal_sent_at') THEN
        ALTER TABLE public.orders ADD COLUMN proposal_sent_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'proposal_viewed_at') THEN
        ALTER TABLE public.orders ADD COLUMN proposal_viewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
