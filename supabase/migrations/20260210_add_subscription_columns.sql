-- Add subscription columns to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS current_plan_tier TEXT DEFAULT 'starter';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Add check constraint for current_plan_tier
ALTER TABLE public.companies ADD CONSTRAINT check_current_plan_tier CHECK (current_plan_tier IN ('starter', 'pro', 'agency'));
