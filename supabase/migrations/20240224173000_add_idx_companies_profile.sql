-- Migração para adicionar índice na coluna profile_id da tabela companies
-- Isso acelera drasticamente o AuthContext que busca a empresa vinculada ao perfil logado.

CREATE INDEX IF NOT EXISTS idx_companies_profile_id ON public.companies USING btree (profile_id);
