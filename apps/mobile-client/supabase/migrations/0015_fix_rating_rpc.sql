-- ============================================
-- Migration 0015: Fix Rating RPC
-- Corrige a função search_companies removendo a coluna rating inexistente
-- ============================================

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
    GROUP BY c.id, c.business_name, c.bio, c.logo_url, c.cover_url, c.address_city, c.address_state, c.search_vector
    ORDER BY c.id, rank DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
