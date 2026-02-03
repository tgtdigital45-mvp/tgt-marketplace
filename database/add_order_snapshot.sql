-- Add package_snapshot column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS package_snapshot JSONB;

COMMENT ON COLUMN orders.package_snapshot IS 'Snapshot of the service package details at the time of purchase to ensure legal integrity if service changes.';
