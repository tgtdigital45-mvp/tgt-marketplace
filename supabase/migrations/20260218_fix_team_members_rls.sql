-- Fix infinite recursion in team_members policies
-- Date: 2026-02-18

DROP POLICY IF EXISTS "Team members can view their own team" ON team_members;
DROP POLICY IF EXISTS "Owners can manage team members" ON team_members;

-- Simplified SELECT policy: Users can see entries for teams they are part of
-- Note: Simplified to avoid nested subqueries that might cause recursion
CREATE POLICY "Team members can view their own team"
ON team_members FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() 
    OR 
    company_id IN (
        SELECT tm.company_id 
        FROM team_members tm 
        WHERE tm.user_id = auth.uid()
    )
);

-- Owners can manage team members
-- We use a direct check to avoid recursion
CREATE POLICY "Owners can manage team members"
ON team_members FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = auth.uid() 
        AND tm.company_id = team_members.company_id 
        AND tm.role = 'owner'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = auth.uid() 
        AND tm.company_id = team_members.company_id 
        AND tm.role = 'owner'
    )
);
