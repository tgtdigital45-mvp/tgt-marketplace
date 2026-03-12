-- Migration 0014: Fix Company Columns and Search
-- Adiciona is_public e search_vector ausentes na tabela companies

-- 1. Adicionar coluna is_public
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- 2. Adicionar coluna search_vector (se não existir)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 3. Criar índice GIN (se não existir)
CREATE INDEX IF NOT EXISTS idx_companies_search_v2 ON public.companies USING GIN(search_vector);

-- 4. Função de atualização do search_vector
CREATE OR REPLACE FUNCTION update_company_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('portuguese', coalesce(NEW.business_name, '')), 'A') ||
        setweight(to_tsvector('portuguese', coalesce(NEW.bio, '')), 'B') ||
        setweight(to_tsvector('portuguese', coalesce(NEW.address_city, '')), 'C') ||
        setweight(to_tsvector('portuguese', coalesce(NEW.address_state, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger
DROP TRIGGER IF EXISTS trg_company_search_vector ON public.companies;
CREATE TRIGGER trg_company_search_vector
    BEFORE INSERT OR UPDATE OF business_name, bio, address_city, address_state
    ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_company_search_vector();

-- 6. Atualizar dados existentes
UPDATE public.companies SET search_vector =
    setweight(to_tsvector('portuguese', coalesce(business_name, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(bio, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(address_city, '')), 'C') ||
    setweight(to_tsvector('portuguese', coalesce(address_state, '')), 'C');

-- 7. Corrigir RPC search_companies (Removendo rating e adicionando is_public check)
CREATE OR REPLACE FUNCTION search_companies(
    search_term text,
    category_filter uuid DEFAULT NULL,
    city_filter text DEFAULT NULL,
    result_limit int DEFAULT 20
)
RETURNS TABLE (
    id uuid,
    business_name text,
    bio text,
    logo_url text,
    cover_url text,
    address_city text,
    address_state text,
    rank real
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (c.id)
        c.id,
        c.business_name,
        c.bio,
        c.logo_url,
        c.cover_url,
        c.address_city,
        c.address_state,
        ts_rank(c.search_vector, websearch_to_tsquery('portuguese', search_term)) +
        COALESCE(MAX(ts_rank(s.search_vector, websearch_to_tsquery('portuguese', search_term))), 0) AS rank
    FROM companies c
    LEFT JOIN services s ON s.company_id = c.id
    WHERE (
        c.search_vector @@ websearch_to_tsquery('portuguese', search_term)
        OR s.search_vector @@ websearch_to_tsquery('portuguese', search_term)
        OR c.business_name ILIKE '%' || search_term || '%'
    )
    AND (category_filter IS NULL OR s.category_id = category_filter)
    AND (city_filter IS NULL OR c.address_city ILIKE '%' || city_filter || '%')
    AND (c.is_public = true) -- Garantir que só empresas públicas apareçam
    GROUP BY c.id, c.business_name, c.bio, c.logo_url, c.cover_url, c.address_city, c.address_state, c.search_vector
    ORDER BY c.id, rank DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
