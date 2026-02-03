-- Add Fiverr-style columns to profiles table

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS languages jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS response_time text;

-- Comment on columns for clarity
COMMENT ON COLUMN public.profiles.languages IS 'Array of {language, level} objects';
COMMENT ON COLUMN public.profiles.skills IS 'Array of skill strings';
COMMENT ON COLUMN public.profiles.education IS 'Array of {institution, degree, year} objects';
COMMENT ON COLUMN public.profiles.response_time IS 'Average response time text, e.g. "1 hora"';
