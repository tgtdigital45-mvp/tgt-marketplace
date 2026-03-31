-- Permitir acesso de leitura público (anônimo e autenticado) a empresas ativas/aprovadas
-- This is necessary for the Marketplace to function correctly as per the refactoring in useCompanySearch.ts
-- Existing 'lockdown' migration created a view, but the codebase expects direct table access for complex joins.

CREATE POLICY "Marketplace: empresas são visíveis publicamente por status"
ON public.companies
FOR SELECT
TO anon, authenticated
USING (status IN ('active', 'approved'));
