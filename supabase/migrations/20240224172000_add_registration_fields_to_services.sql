-- Migration to add professional registration fields to the services table
-- Target: Resolve PGRST204 error in ServiceWizard

DO $$ 
BEGIN
    -- Add subcategory column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'subcategory') THEN
        ALTER TABLE public.services ADD COLUMN subcategory TEXT;
    END IF;

    -- Add registration_number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'registration_number') THEN
        ALTER TABLE public.services ADD COLUMN registration_number TEXT;
    END IF;

    -- Add registration_state column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'registration_state') THEN
        ALTER TABLE public.services ADD COLUMN registration_state TEXT;
    END IF;

    -- Add registration_image column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'registration_image') THEN
        ALTER TABLE public.services ADD COLUMN registration_image TEXT;
    END IF;

    -- Add certification_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'certification_id') THEN
        ALTER TABLE public.services ADD COLUMN certification_id TEXT;
    END IF;

END $$;

-- Commentary: These fields are essential for professional validation as defined in SERVICE_CATEGORIES (healthcare, legal, engineering, etc.)
COMMENT ON COLUMN public.services.subcategory IS 'Specific subcategory ID for the service';
COMMENT ON COLUMN public.services.registration_number IS 'Professional board registration number (e.g., CRM, OAB)';
COMMENT ON COLUMN public.services.registration_state IS 'The Brazilian state (UF) where the registration is valid';
COMMENT ON COLUMN public.services.registration_image IS 'URL of the uploaded document for professional validation';
COMMENT ON COLUMN public.services.certification_id IS 'Secondary certification or license ID (e.g., NR-10, CNH EAR)';
