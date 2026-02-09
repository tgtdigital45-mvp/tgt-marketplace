-- Update Company Default Status to 'active'
-- This ensures that even if the frontend payload is missing the status, the DB defaults to active.

ALTER TABLE public.companies 
ALTER COLUMN status SET DEFAULT 'active';

-- Optional: Update all existing pending companies to active (if desired)
-- UPDATE public.companies SET status = 'active' WHERE status = 'pending';
