-- ============================================================
-- SQL Migration: 20260313000000_semantic_search_setup.sql
-- Description: Enable pgvector and setup semantic search for companies
-- ============================================================

-- 1. Enable the pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to companies table
-- Note: OpenAI text-embedding-3-small uses 1536 dimensions
ALTER TABLE companies ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Create a function to match companies based on embedding similarity
-- This will be used for the semantic search
CREATE OR REPLACE FUNCTION match_companies (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_category text default 'all',
  filter_city text default 'all'
)
RETURNS TABLE (
  id uuid,
  company_name text,
  slug text,
  category text,
  city text,
  state text,
  description text,
  logo_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.company_name,
    c.slug,
    c.category,
    c.city,
    c.state,
    c.description,
    c.logo_url,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM companies c
  WHERE 1 - (c.embedding <=> query_embedding) > match_threshold
    AND (filter_category = 'all' OR c.category = filter_category)
    AND (filter_city = 'all' OR c.city ILIKE '%' || filter_city || '%')
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 4. Create an index for faster similarity search
-- HNSW index is generally better for vector search performance
CREATE INDEX IF NOT EXISTS companies_embedding_idx ON companies USING hnsw (embedding vector_cosine_ops);
