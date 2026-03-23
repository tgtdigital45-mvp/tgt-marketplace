-- ============================================
-- Migration 0013: Full-text Search (FTS)
-- Adiciona busca otimizada com tsvector + GIN
-- ============================================

-- 1. Adicionar coluna tsvector na tabela companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Criar índice GIN para busca rápida
CREATE INDEX IF NOT EXISTS idx_companies_search ON companies USING GIN(search_vector);

-- 3. Função para atualizar o search_vector automaticamente
CREATE OR REPLACE FUNCTION update_company_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('portuguese', coalesce(NEW.business_name, '')), 'A') ||
        setweight(to_tsvector('portuguese', coalesce(NEW.bio, '')), 'B') ||
        setweight(to_tsvector('portuguese', coalesce(NEW.address_city, '')), 'C') ||
        setweight(to_tsvector('portuguese', coalesce(NEW.address_state, '')), 'C') ||
        setweight(to_tsvector('portuguese', coalesce(NEW.address_street, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para manter o vetor atualizado
DROP TRIGGER IF EXISTS trg_company_search_vector ON companies;
CREATE TRIGGER trg_company_search_vector
    BEFORE INSERT OR UPDATE OF business_name, bio, address_city, address_state, address_street
    ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_company_search_vector();

-- 5. Atualizar registros existentes
UPDATE companies SET search_vector =
    setweight(to_tsvector('portuguese', coalesce(business_name, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(bio, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(address_city, '')), 'C') ||
    setweight(to_tsvector('portuguese', coalesce(address_state, '')), 'C') ||
    setweight(to_tsvector('portuguese', coalesce(address_street, '')), 'D');

-- 6. Também indexar services para busca por título de serviço
ALTER TABLE services ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_services_search ON services USING GIN(search_vector);

CREATE OR REPLACE FUNCTION update_service_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('portuguese', coalesce(NEW.title, '')), 'A') ||
        setweight(to_tsvector('portuguese', coalesce(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_service_search_vector ON services;
CREATE TRIGGER trg_service_search_vector
    BEFORE INSERT OR UPDATE OF title, description
    ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_service_search_vector();

UPDATE services SET search_vector =
    setweight(to_tsvector('portuguese', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(description, '')), 'B');

-- 7. RPC function para busca unificada (empresas + serviços)
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
    GROUP BY c.id, c.business_name, c.bio, c.logo_url, c.cover_url, c.rating, c.address_city, c.address_state, c.search_vector
    ORDER BY c.id, rank DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
