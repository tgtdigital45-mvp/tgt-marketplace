-- Migration: Compliance and Execution Engine Extensions
-- Date: 2026-03-25
-- Description: Adds professional validation flags and execution tracking to support the new service flows.

-- 1. Create service_categories table
CREATE TABLE IF NOT EXISTS public.service_categories (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    requires_professional_id BOOLEAN DEFAULT FALSE,
    hide_fixed_price_allowed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add execution columns to orders (or a dedicated appointments table)
-- Given the current schema uses 'orders' for transactions, we'll extend it for execution tracking.
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS check_out_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS check_in_location GEOGRAPHY(POINT, 4326),
ADD COLUMN IF NOT EXISTS check_out_location GEOGRAPHY(POINT, 4326),
ADD COLUMN IF NOT EXISTS totp_secret TEXT,
ADD COLUMN IF NOT EXISTS execution_status TEXT DEFAULT 'pending' 
CHECK (execution_status IN ('pending', 'in_progress', 'completed', 'no_show_client', 'no_show_pro'));

-- 3. Enable RLS on service_categories
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on service_categories" 
ON public.service_categories FOR SELECT 
TO public 
USING (true);

-- 4. Initial seed for critical categories from documentation
INSERT INTO public.service_categories (id, label, requires_professional_id, hide_fixed_price_allowed)
VALUES 
    ('healthcare', 'Saúde', TRUE, TRUE),
    ('legal', 'Jurídico', TRUE, FALSE),
    ('engineering', 'Engenharia', TRUE, FALSE),
    ('technology', 'Tecnologia', FALSE, FALSE)
ON CONFLICT (id) DO UPDATE 
SET 
    requires_professional_id = EXCLUDED.requires_professional_id,
    hide_fixed_price_allowed = EXCLUDED.hide_fixed_price_allowed;

-- 5. Link services to categories (optional, but category_tag already exists)
-- We'll assume category_tag in services table references service_categories.id
-- Currently category_tag is just a TEXT column.

COMMENT ON TABLE public.service_categories IS 'Table to store compliance rules for different service categories';
COMMENT ON COLUMN public.orders.totp_secret IS 'Secret used to generate dynamic QR Codes for service validation';
