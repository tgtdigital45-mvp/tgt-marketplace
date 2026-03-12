-- TABELA: SERVICE FORMS
create table public.service_forms (
  id uuid default gen_random_uuid() primary key,
  service_id uuid references public.services(id) on delete cascade not null,
  questions jsonb not null default '[]'::jsonb,
  is_required boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.service_forms enable row level security;

create policy "Service forms are viewable by everyone."
  on service_forms for select using ( true );

create policy "Companies can manage their service forms."
  on service_forms for all using (
    exists (
      select 1 from services s
      join companies c on c.id = s.company_id
      where s.id = service_forms.service_id and c.owner_id = auth.uid()
    )
  );


-- TABELA: FORM RESPONSES
create table public.form_responses (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.service_orders(id) on delete cascade not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.form_responses enable row level security;

create policy "Participants can view form responses."
  on form_responses for select using (
    exists (
      select 1 from service_orders o
      where o.id = form_responses.order_id
      and (o.client_id = auth.uid() or o.company_id in (select c.id from companies c where c.owner_id = auth.uid()))
    )
  );

create policy "Clients can insert form responses."
  on form_responses for insert with check (
    exists (
      select 1 from service_orders o
      where o.id = order_id and o.client_id = auth.uid()
    )
  );


-- ALTERANDO SERVICE_ORDERS PARA SUPORTAR O FLUXO DE ORÇAMENTO
-- No fluxo de orçamento (budget), ao criar a ordem:
-- 1. O cliente ainda NÃO sabe o total_price.
-- 2. O cliente ainda NÃO escolheu a data (scheduled_for), pois depende de aprovação prévia no chat.

alter table public.service_orders alter column scheduled_for drop not null;
alter table public.service_orders alter column total_price drop not null;
