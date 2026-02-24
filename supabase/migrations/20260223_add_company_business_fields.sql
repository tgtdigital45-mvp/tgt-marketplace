-- ============================================================
-- Add business fields for company dashboard autonomy
-- Migration: 20260223_add_company_business_fields.sql
-- ============================================================

-- 1. Service activation toggle
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Company logistics
ALTER TABLE companies ADD COLUMN IF NOT EXISTS coverage_radius_km INTEGER DEFAULT 30;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS coverage_neighborhoods TEXT[] DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS terms_and_policies TEXT;

-- 3. Company bank data for payouts
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_agency TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_account_type TEXT DEFAULT 'checking';

-- 4. Quotes table (solicitações de orçamento)
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending | viewed | proposal_sent | approved | rejected
  proposal_value NUMERIC(10,2),
  proposal_scope TEXT,
  proposal_validity_days INTEGER,
  proposal_deadline DATE,
  proposal_sent_at TIMESTAMPTZ,
  proposal_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Clientes veem seus próprios orçamentos
CREATE POLICY "clients_select_own_quotes" ON quotes
  FOR SELECT USING (auth.uid() = client_id);

-- Empresas veem orçamentos direcionados a elas
CREATE POLICY "companies_select_own_quotes" ON quotes
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE profile_id = auth.uid()
    )
  );

-- Clientes criam solicitações
CREATE POLICY "clients_insert_quotes" ON quotes
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Empresas atualizam para enviar proposta / marcar como visto
CREATE POLICY "companies_update_quotes" ON quotes
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM companies WHERE profile_id = auth.uid()
    )
  );

-- Clientes atualizam para aprovar/rejeitar propostas recebidas
CREATE POLICY "clients_update_own_quotes" ON quotes
  FOR UPDATE USING (auth.uid() = client_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS quotes_company_id_idx ON quotes(company_id);
CREATE INDEX IF NOT EXISTS quotes_client_id_idx ON quotes(client_id);
CREATE INDEX IF NOT EXISTS quotes_status_idx ON quotes(status);
