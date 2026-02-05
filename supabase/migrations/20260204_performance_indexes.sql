-- =====================================================
-- Performance Optimization: Strategic Indexes
-- =====================================================
-- Objetivo: Reduzir latência de queries em 50-80%
-- Data: 2026-02-04
-- =====================================================

-- 1. Índice GIN para busca em JSONB (packages)
-- Permite busca rápida por preço dentro do JSON
CREATE INDEX IF NOT EXISTS idx_services_packages_gin 
ON services USING GIN (packages);

-- 2. Índice GIN para busca em arrays (tags)
-- Acelera queries com operadores de array (@>, &&, etc)
CREATE INDEX IF NOT EXISTS idx_services_tags_gin 
ON services USING GIN (tags);

-- 3. Índices B-Tree para relacionamentos (Foreign Keys)
-- Otimiza JOINs e queries com WHERE em FKs
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id 
ON orders (buyer_id);

CREATE INDEX IF NOT EXISTS idx_orders_seller_id 
ON orders (seller_id);

CREATE INDEX IF NOT EXISTS idx_services_owner_id 
ON services (owner_id);

-- 4. Habilitar extensão pg_trgm para Fuzzy Search
-- Permite busca textual com similaridade (LIKE, ILIKE, %)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 5. Índice GIN para busca textual (Trigram)
-- Acelera queries com ILIKE em 10-100x
CREATE INDEX IF NOT EXISTS idx_services_title_trgm 
ON services USING GIN (title gin_trgm_ops);

-- 6. Índice composto para queries comuns
-- Otimiza listagem de serviços por owner ordenados por data
CREATE INDEX IF NOT EXISTS idx_services_owner_created 
ON services (owner_id, created_at DESC);

-- 7. Índice para busca em company_name (usado no useCompanySearch)
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm 
ON companies USING GIN (company_name gin_trgm_ops);

-- =====================================================
-- Verificação de Índices Criados
-- =====================================================
-- Execute para validar:
-- SELECT schemaname, tablename, indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('services', 'orders', 'companies')
-- ORDER BY tablename, indexname;
