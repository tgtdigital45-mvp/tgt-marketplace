-- Fix Security Definer Views (ERROR)
ALTER VIEW public.seller_stats SET (security_invoker = on);
ALTER VIEW public.public_company_profiles SET (security_invoker = on);

-- Fix RLS Disabled in Public (ERROR)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for reports table
CREATE POLICY "Users can insert their own reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.reports FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (public.is_admin());
