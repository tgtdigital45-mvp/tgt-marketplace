-- Ativar extensão PostGIS (Necessária para H3)
create extension if not exists postgis schema extensions;
-- A extensão h3 por si só deve estar habilitada na interface do Supabase se o projeto permitir.

-- TABELA: PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  first_name text,
  last_name text,
  avatar_url text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS
alter table public.profiles enable row level security;

-- Políticas de Profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );


-- TABELA: COMPANIES (Prestadores)
create table public.companies (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  business_name text not null,
  description text,
  logo_url text,
  cover_url text,
  document_id text, -- CPF/CNPJ
  stripe_account_id text, -- ID do conect express do Stripe
  stripe_onboarding_complete boolean default false,
  -- Endereço e Geolocalização
  address_street text,
  address_city text,
  address_state text,
  lat numeric,
  lng numeric,
  h3_index text, -- Hash do hexágono H3 onde a empresa atende
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.companies enable row level security;

create policy "Companies are viewable by everyone."
  on companies for select using ( true );

create policy "Owners can update their companies."
  on companies for update using ( auth.uid() = owner_id );

create policy "Owners can insert their companies."
  on companies for insert with check ( auth.uid() = owner_id );


-- TABELA: SERVICE CATEGORIES
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  icon_url text
);

alter table public.categories enable row level security;
create policy "Categories are viewable by everyone." on categories for select using ( true );


-- TABELA: SERVICES
create table public.services (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  description text,
  price_type text check (price_type in ('fixed', 'budget')), -- 'fixed' (Fixo) ou 'budget' (Orçamento)
  price numeric default 0, -- Se for fixed
  estimated_duration_minutes integer, -- Estimativa para bloquear agenda
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.services enable row level security;

create policy "Services are viewable by everyone."
  on services for select using ( true );

create policy "Companies can manage their services."
  on services for all using (
    auth.uid() in (select owner_id from companies where id = company_id)
  );
