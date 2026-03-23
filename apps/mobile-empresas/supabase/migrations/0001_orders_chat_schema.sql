-- TABELA: SERVICE ORDERS (Ordens de Serviço - Contrato Pós-Venda)
create table public.service_orders (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete restrict not null,
  company_id uuid references public.companies(id) on delete restrict not null,
  service_id uuid references public.services(id) on delete set null,
  status text check (status in ('pending', 'accepted', 'in_progress', 'completed', 'canceled')),
  
  -- Agendamento e Preços
  scheduled_for timestamp with time zone not null,
  total_price numeric not null,
  stripe_payment_intent_id text, -- Referência financeira gerada no Payment Sheet
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.service_orders enable row level security;

-- Cliente vê as próprias ordens
create policy "Clients can view their orders."
  on service_orders for select using ( auth.uid() = client_id );

-- Empresa vê as ordens direcionadas a ela
create policy "Companies can view orders directed to them."
  on service_orders for select using (
    auth.uid() in (select owner_id from companies where id = company_id)
  );

-- TABELA: CHAT ROOMS (Pode ser diretamente indexado na Service Order)
-- MENSAGENS DO CHAT
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.service_orders(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete set null,
  
  content text,
  file_url text, -- Supabase Storage
  
  is_system_message boolean default false, -- Para mensagens do tipo "A Caminho", "Finalizado"

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

-- Apenas quem faz parte da ordem vê as msgs
create policy "Participants can view messages."
  on messages for select using (
    exists (
      select 1 from service_orders
      where id = messages.order_id
      and (client_id = auth.uid() or company_id in (select id from companies where owner_id = auth.uid()))
    )
  );

-- Participantes podem Inserir
create policy "Participants can insert messages."
  on messages for insert with check (
    exists (
      select 1 from service_orders
      where id = order_id
      and (client_id = auth.uid() or company_id in (select id from companies where owner_id = auth.uid()))
    )
  );
