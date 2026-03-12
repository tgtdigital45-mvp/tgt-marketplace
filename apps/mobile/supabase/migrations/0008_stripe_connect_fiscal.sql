-- ============================================================
-- Migration 0008: Stripe Connect, Subscription Plans & Fiscal Data
-- ============================================================

-- 1. Subscription Plans Table
create table if not exists public.subscription_plans (
  id uuid default gen_random_uuid() primary key,
  name text not null,                     -- 'Start', 'Pro', 'Scale'
  stripe_product_id text,                 -- prod_XXX
  stripe_price_id text,                   -- price_XXX
  price_brl numeric not null default 0,   -- Monthly price in BRL
  take_rate numeric not null default 10,  -- Platform commission % (3-20)
  max_services integer default 5,
  features jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.subscription_plans enable row level security;
create policy "Plans are viewable by everyone."
  on subscription_plans for select using (true);

-- Seed default plans
insert into public.subscription_plans (name, price_brl, take_rate, max_services, features) values
  ('Start', 0, 20, 3, '["Perfil básico", "Até 3 serviços", "Chat com clientes"]'::jsonb),
  ('Pro', 49.90, 10, 15, '["Perfil destaque", "Até 15 serviços", "Chat prioritário", "Estatísticas"]'::jsonb),
  ('Scale', 99.90, 5, 100, '["Perfil premium", "Serviços ilimitados", "Dashboard financeiro", "Suporte dedicado", "Anúncios"]'::jsonb);

-- 2. Company Subscriptions Table
create table if not exists public.company_subscriptions (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  plan_id uuid references public.subscription_plans(id) not null,
  stripe_subscription_id text,            -- sub_XXX
  status text default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.company_subscriptions enable row level security;

create policy "Company owners can view their subscriptions."
  on company_subscriptions for select
  using (auth.uid() in (select owner_id from companies where id = company_id));

create policy "Company owners can manage their subscriptions."
  on company_subscriptions for all
  using (auth.uid() in (select owner_id from companies where id = company_id));

-- 3. Customer Fiscal Data (CPF, address for invoicing)
alter table public.profiles
  add column if not exists cpf text,
  add column if not exists address_street text,
  add column if not exists address_number text,
  add column if not exists address_neighborhood text,
  add column if not exists address_city text,
  add column if not exists address_state text,
  add column if not exists address_zip text,
  add column if not exists stripe_customer_id text;

-- 4. RPC to get company take rate for payment split
create or replace function public.get_company_take_rate(p_company_id uuid)
returns numeric
language plpgsql
security definer
as $$
declare
  rate numeric;
begin
  select sp.take_rate into rate
  from company_subscriptions cs
  join subscription_plans sp on sp.id = cs.plan_id
  where cs.company_id = p_company_id
    and cs.status = 'active'
  order by cs.created_at desc
  limit 1;

  -- Default to highest take rate if no active subscription
  return coalesce(rate, 20);
end;
$$;
