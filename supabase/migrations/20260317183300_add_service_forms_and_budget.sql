-- Migração para adicionar dependências de orçamentos e formulários de serviços
-- Gerado em 2026-03-17

-- 1. Adicionar budget_expectation em orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS budget_expectation NUMERIC(10, 2);

-- 2. Criar a tabela service_forms
CREATE TABLE IF NOT EXISTS public.service_forms (
  id uuid default gen_random_uuid() primary key,
  service_id uuid references public.services(id) on delete cascade not null,
  questions jsonb not null default '[]'::jsonb,
  is_required boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.service_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service forms are viewable by everyone."
  ON service_forms FOR SELECT USING ( true );

CREATE POLICY "Companies can manage their service forms."
  ON service_forms FOR ALL USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN companies c ON c.id = s.company_id
      WHERE s.id = service_forms.service_id AND c.profile_id = auth.uid()
    )
  );

-- 3. Criar a tabela form_responses
CREATE TABLE IF NOT EXISTS public.form_responses (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view form responses."
  ON form_responses FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = form_responses.order_id
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
  );

CREATE POLICY "Clients can insert form responses."
  ON form_responses FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id AND o.buyer_id = auth.uid()
    )
  );

-- 4. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
