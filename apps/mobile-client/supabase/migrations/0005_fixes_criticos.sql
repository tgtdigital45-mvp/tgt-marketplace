-- =================================================================
-- MIGRATION 0005: FIXES CRÍTICOS PÓS-AUDITORIA
-- =================================================================

-- ---------------------------------------------------------------
-- FIX 1: TRIGGER para criar profile automaticamente no signup
-- Sem isso, o AuthContext fica em retry loop e pode falhar silenciosamente.
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  full_name text;
  first text;
  last text;
begin
  full_name := new.raw_user_meta_data->>'full_name';

  -- Tenta separar primeiro e último nome
  if full_name is not null and full_name <> '' then
    first := split_part(full_name, ' ', 1);
    last   := substring(full_name from position(' ' in full_name) + 1);
    -- Se não tinha espaço, last fica vazio/igual ao full_name
    if last = full_name then last := null; end if;
  else
    first := null;
    last  := null;
  end if;

  insert into public.profiles (id, first_name, last_name, role)
  values (new.id, first, last, null)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Remove trigger antigo se existir (idempotente)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ---------------------------------------------------------------
-- FIX 2: POLICY INSERT para service_orders (cliente criando pedido)
-- Sem isso, o cliente não consegue criar nenhuma ordem de serviço.
-- ---------------------------------------------------------------
create policy "Clients can create orders."
  on service_orders for insert
  with check ( auth.uid() = client_id );

-- Também garante que o dono da empresa pode criar ordens (ex: agendamentos internos)
create policy "Companies can create orders for their services."
  on service_orders for insert
  with check (
    auth.uid() in (select owner_id from companies where id = company_id)
  );

-- Policy UPDATE para o provider poder aceitar/recusar
create policy "Clients and companies can update their orders."
  on service_orders for update
  using (
    auth.uid() = client_id
    or auth.uid() in (select owner_id from companies where id = company_id)
  );


-- ---------------------------------------------------------------
-- FIX 3: SEED de dados nas categories
-- A tabela estava vazia, fazendo a home do cliente usar dados hardcoded.
-- ---------------------------------------------------------------
insert into public.categories (name, icon_url) values
  ('Limpeza',       null),
  ('Reparos',       null),
  ('Beleza',        null),
  ('Aulas',         null),
  ('Fretes',        null),
  ('Jardinagem',    null),
  ('Hidráulica',    null),
  ('Elétrica',      null),
  ('Pintura',       null),
  ('Tecnologia',    null)
on conflict do nothing;
