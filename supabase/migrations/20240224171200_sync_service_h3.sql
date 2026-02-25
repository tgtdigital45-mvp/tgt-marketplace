-- Migration: Synchronize Service H3 with Company H3
-- Description: Ensures services automatically inherit and stay in sync with their parent company's H3 index.

-- 1. Function to sync service H3 from company
CREATE OR REPLACE FUNCTION sync_service_h3_from_company()
RETURNS TRIGGER AS $$
DECLARE
    v_h3_index TEXT;
BEGIN
    -- Get the company's h3_index
    SELECT h3_index INTO v_h3_index
    FROM public.companies
    WHERE id = NEW.company_id;

    -- Update the service's h3_index
    NEW.h3_index := v_h3_index;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger on services table (BEFORE INSERT OR UPDATE)
DROP TRIGGER IF EXISTS tr_sync_service_h3 ON public.services;
CREATE TRIGGER tr_sync_service_h3
BEFORE INSERT OR UPDATE OF company_id ON public.services
FOR EACH ROW
EXECUTE FUNCTION sync_service_h3_from_company();

-- 3. Function to propagate company H3 changes to its services
CREATE OR REPLACE FUNCTION propagate_company_h3_to_services()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if h3_index actually changed
    IF (OLD.h3_index IS DISTINCT FROM NEW.h3_index) THEN
        UPDATE public.services
        SET h3_index = NEW.h3_index
        WHERE company_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger on companies table (AFTER UPDATE)
DROP TRIGGER IF EXISTS tr_propagate_company_h3 ON public.companies;
CREATE TRIGGER tr_propagate_company_h3
AFTER UPDATE OF h3_index ON public.companies
FOR EACH ROW
EXECUTE FUNCTION propagate_company_h3_to_services();

-- 5. Backfill: Update all existing services to match their company's H3
UPDATE public.services s
SET h3_index = c.h3_index
FROM public.companies c
WHERE s.company_id = c.id
AND (s.h3_index IS DISTINCT FROM c.h3_index OR s.h3_index IS NULL);

COMMENT ON FUNCTION sync_service_h3_from_company() IS 'Sets services.h3_index from parent company during insert/update';
COMMENT ON FUNCTION propagate_company_h3_to_services() IS 'Updates all service h3_indices when company h3_index changes';
