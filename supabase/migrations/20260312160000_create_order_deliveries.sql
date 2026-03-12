-- Migration: Create Order Deliveries and Update Status
-- Date: 2026-03-12

BEGIN;

-- 1. Add awaiting_approval to order_status enum
-- We do this outside the transaction or use a trick for Postgres enums if possible, 
-- but usually adding enum values is best done in separate migrations.
-- However, for a new setup, we can try:
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'awaiting_approval';

-- 2. Create order_deliveries table
CREATE TABLE IF NOT EXISTS public.order_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
    files JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {name, url, type, size}
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending_review', -- pending_review, approved, disputed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.order_deliveries ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Providers (Sellers) can insert deliveries for their own orders
CREATE POLICY "Sellers can insert deliveries" ON public.order_deliveries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_id AND seller_id = auth.uid()
        )
    );

-- Sellers can view their own deliveries
CREATE POLICY "Sellers can view their deliveries" ON public.order_deliveries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_id AND seller_id = auth.uid()
        )
    );

-- Buyers (Clients) can view deliveries for their orders
CREATE POLICY "Buyers can view deliveries for their orders" ON public.order_deliveries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_id AND buyer_id = auth.uid()
        )
    );

-- 5. Storage Bucket Configuration
-- (Note: Storage configuration usually happens via different tools, but we document it here)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('order-deliveries', 'order-deliveries', true) ON CONFLICT DO NOTHING;

-- 6. Storage Policies
/*
CREATE POLICY "Authenticated users can upload delivery files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-deliveries');

CREATE POLICY "Users can view delivery files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'order-deliveries');
*/

COMMIT;
