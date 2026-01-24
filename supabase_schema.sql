-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Public profile for all users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  user_type text check (user_type in ('client', 'company', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. COMPANIES TABLE (Extra data for company profiles)
create table public.companies (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) not null,
  company_name text not null,
  legal_name text not null,
  cnpj text not null unique,
  category text not null,
  description text,
  phone text,
  website text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  
  -- Address stored as JSON for simplicity, or could be separate columns
  address jsonb not null default '{}'::jsonb,
  
  -- Admin contact details
  admin_contact jsonb not null default '{}'::jsonb,
  
  -- Media
  logo_url text,
  cover_image_url text,
  cnpj_document_url text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. AUTOMATIC PROFILE CREATION TRIGGER
-- This ensures every time a user signs up via Auth, a profile is created
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, user_type, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name', 
    new.raw_user_meta_data->>'type',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

-- Profiles: 
-- Public read access
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" 
  on public.profiles for select using (true);
-- Users can update their own profile
create policy "Users can update own profile" 
  on public.profiles for update using (auth.uid() = id);

-- Companies:
-- Public read access (maybe filter by status='approved' later)
alter table public.companies enable row level security;
create policy "Companies are viewable by everyone" 
  on public.companies for select using (true);
-- Companies can update their own data
create policy "Companies can update own data" 
  on public.companies for insert 
  with check (auth.uid() = profile_id);
create policy "Companies can update own record" 
  on public.companies for update 
  using (auth.uid() = profile_id);

-- 5. STORAGE BUCKETS (You need to create these in the Dashboard manually usually, or via API)
-- Included here for reference of what policies to add in Storage > Policies
-- Buckets needed: 'logos', 'covers', 'documents'

-- Policy Example for Storage (Run in dashboard or via API):
-- ALLOW SELECT for Public (logos, covers)
-- ALLOW INSERT for Authenticated Users
