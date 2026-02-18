-- Add stripe_account_id to companies table for Split Payments
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Add escrow_status to orders table for Escrow logic
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'pending_release' 
CHECK (escrow_status IN ('pending_release', 'released', 'refunded', 'disputed'));

-- Ensure services table supports packages (JSONB) - validating existence
-- If it doesn't exist, we create it. If it does, strictly typing it is complex in SQL only, 
-- but we ensure the column is there.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'packages') THEN
        ALTER TABLE services ADD COLUMN packages JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Policies
-- Allow authenticated users to read stripe_account_id from companies (needed for checkout creation)
CREATE POLICY "Allow authenticated users to view stripe_account_id"
ON companies
FOR SELECT
TO authenticated
USING (true);
