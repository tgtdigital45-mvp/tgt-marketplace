-- EXTEND PROFILES TABLE
-- Add fields relevant for a detailed Client Profile
alter table public.profiles 
add column if not exists cpf text,
add column if not exists date_of_birth date,
add column if not exists phone text,
add column if not exists address_street text,
add column if not exists address_number text,
add column if not exists address_complement text,
add column if not exists address_neighborhood text,
add column if not exists address_city text,
add column if not exists address_state text,
add column if not exists address_zip text;

-- No new RLS needed if 'profiles' already has "Users can update own profile" policies.
-- Let's ensure basic RLS exists just in case (optional backup safety):
create policy "Users can update own profile" 
on public.profiles for update 
using (auth.uid() = id);

create policy "Users can view own profile" 
on public.profiles for select 
using (auth.uid() = id);
