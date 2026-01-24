-- FIX COMPANIES TABLE COLUMNS
-- The error indicates 'email' is missing. 
-- We will add 'email' and ensure other complex fields from the Registration Form exist.

alter table public.companies 
add column if not exists email text,
add column if not exists admin_contact jsonb;

-- Verify other columns used in registration just in case
alter table public.companies 
add column if not exists website text,
add column if not exists category text,
add column if not exists description text,
add column if not exists address jsonb,
add column if not exists created_at timestamp with time zone default now();

-- Reload Schema Cache (In Supabase this happens on DDL, but good to note)
notify pgrst, 'reload config';
