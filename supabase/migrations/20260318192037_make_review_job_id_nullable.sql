-- Remove NOT NULL constraint from job_id in reviews table to allow general company reviews
ALTER TABLE public.reviews ALTER COLUMN job_id DROP NOT NULL;
