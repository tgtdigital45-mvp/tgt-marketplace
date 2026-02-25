-- 1. Adicionar coluna deleted_at à tabela services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Atualizar a função get_nearby_services para ignorar serviços deletados
CREATE OR REPLACE FUNCTION public.get_nearby_services(p_h3_indexes text[], p_category text DEFAULT NULL::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, title text, description text, price numeric, starting_price numeric, duration text, company_id uuid, h3_index text, service_type text, category_tag text, image_url text, tags text[], packages jsonb, company_name text, company_logo text, company_rating numeric, company_slug text)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    s.id,
    s.title,
    s.description,
    s.price,
    s.starting_price,
    s.duration,
    s.company_id,
    s.h3_index,
    s.service_type,
    s.category_tag,
    s.image_url,
    s.tags,
    s.packages,
    c.company_name,
    c.logo_url AS company_logo,
    c.rating AS company_rating,
    c.slug AS company_slug
  FROM public.services s
  JOIN public.companies c ON s.company_id = c.id
  WHERE
    s.is_active = TRUE
    AND s.deleted_at IS NULL -- Filtro para soft delete
    AND c.status = 'approved'
    AND s.h3_index = ANY(p_h3_indexes)
    AND (p_category IS NULL OR s.category_tag = p_category)
  ORDER BY c.rating DESC NULLS LAST, s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$function$;

-- 3. Atualizar a função get_remote_services para ignorar serviços deletados
CREATE OR REPLACE FUNCTION public.get_remote_services(p_category text DEFAULT NULL::text, p_search text DEFAULT NULL::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, title text, description text, price numeric, starting_price numeric, duration text, company_id uuid, service_type text, category_tag text, image_url text, tags text[], packages jsonb, company_name text, company_logo text, company_rating numeric, company_slug text)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    s.id,
    s.title,
    s.description,
    s.price,
    s.starting_price,
    s.duration,
    s.company_id,
    s.service_type,
    s.category_tag,
    s.image_url,
    s.tags,
    s.packages,
    c.company_name,
    c.logo_url AS company_logo,
    c.rating AS company_rating,
    c.slug AS company_slug
  FROM public.services s
  JOIN public.companies c ON s.company_id = c.id
  WHERE
    s.is_active = TRUE
    AND s.deleted_at IS NULL -- Filtro para soft delete
    AND c.status = 'approved'
    AND s.service_type IN ('remote', 'hybrid')
    AND (p_category IS NULL OR s.category_tag = p_category)
    AND (
      p_search IS NULL
      OR s.title ILIKE '%' || p_search || '%'
      OR s.description ILIKE '%' || p_search || '%'
      OR s.category_tag ILIKE '%' || p_search || '%'
    )
  ORDER BY c.rating DESC NULLS LAST, s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$function$;
