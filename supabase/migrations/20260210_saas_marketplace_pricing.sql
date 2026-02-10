-- Migration: SaaS + Marketplace Pricing Strategy
-- Date: 2026-02-10

-- 1. Update companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'free')),
ADD COLUMN IF NOT EXISTS current_plan_tier text DEFAULT 'starter' CHECK (current_plan_tier IN ('starter', 'pro', 'agency')),
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0.20;

-- 2. Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, user_id)
);

-- Enable RLS for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policies for team_members

-- Policy: Members can view their own team
CREATE POLICY "Team members can view their own team"
ON team_members FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT company_id FROM team_members WHERE user_id = auth.uid()
    )
);

-- Policy: Owners can manage team members
CREATE POLICY "Owners can manage team members"
ON team_members FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = auth.uid() AND company_id = team_members.company_id AND role = 'owner'
    )
);

-- 3. Index for performance
CREATE INDEX IF NOT EXISTS idx_companies_subscription ON companies(subscription_status, current_plan_tier);
CREATE INDEX IF NOT EXISTS idx_team_members_company_user ON team_members(company_id, user_id);
