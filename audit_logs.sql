-- 1. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Policies

-- Allow Admins and Moderators to VIEW logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'moderator')
    )
  );

-- Allow Authenticated users (system service role logic mainly, but here constrained to auth users) 
-- to INSERT logs. In a stricter setup, this would be a Postgres Function with SECURITY DEFINER.
CREATE POLICY "Authenticated users can insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
