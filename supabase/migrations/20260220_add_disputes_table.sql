-- Migration: 20260220_add_disputes_table
-- Create disputes table to handle mediation and conflict resolution

CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES auth.users(id),
    seller_id UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved_refunded', 'resolved_denied')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Creating policies
-- Buyers can view their own disputes
CREATE POLICY "Buyers can view their disputes" 
ON public.disputes FOR SELECT 
USING (auth.uid() = buyer_id);

-- Sellers can view disputes against them
CREATE POLICY "Sellers can view their disputes" 
ON public.disputes FOR SELECT 
USING (auth.uid() = seller_id);

-- Buyers can insert disputes
CREATE POLICY "Buyers can open disputes"
ON public.disputes FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Admin can manage disputes
-- Assumed logic for admin: auth.role() = 'service_role' OR a valid admin check.
-- For the sake of the MVP, we assume admins bypass RLS using service_role via backend/edge functions.
-- But if we want a frontend admin dashboard, we need a policy for admins.

-- Trigger to update updated_at
CREATE TRIGGER handle_updated_at_disputes
BEFORE UPDATE ON public.disputes
FOR EACH ROW
EXECUTE PROCEDURE moddatetime (updated_at);
