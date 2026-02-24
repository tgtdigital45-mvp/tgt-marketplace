-- Add duration_minutes to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Add availability to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS availability JSONB;

-- Comment on columns
COMMENT ON COLUMN services.duration_minutes IS 'Service duration in minutes for scheduling';
COMMENT ON COLUMN companies.availability IS 'JSON structure defining working hours and blocks';
