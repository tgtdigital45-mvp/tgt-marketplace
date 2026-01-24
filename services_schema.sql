-- SERVICES TABLE
create table public.services (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) not null,
  title text not null,
  description text,
  price numeric(10,2),
  duration text, -- e.g. "1 hour", "30 mins"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES FOR SERVICES

-- Public read access
alter table public.services enable row level security;
create policy "Services are viewable by everyone" 
  on public.services for select using (true);

-- Companies can manage their own services
-- We check if the auth.uid() matches the profile_id of the company linked to the service
-- But first, we need a policy that allows insert/update/delete based on company ownership.

-- Helper to check if auth user owns the company
-- (Assuming company_id in services refers to the 'companies' table PK)
-- companies table has profile_id which is the auth.uid()

create policy "Companies can insert their own services" 
  on public.services for insert 
  with check (
    exists (
      select 1 from public.companies 
      where id = company_id 
      and profile_id = auth.uid()
    )
  );

create policy "Companies can update their own services" 
  on public.services for update
  using (
    exists (
      select 1 from public.companies 
      where id = company_id 
      and profile_id = auth.uid()
    )
  );

create policy "Companies can delete their own services" 
  on public.services for delete
  using (
    exists (
      select 1 from public.companies 
      where id = company_id 
      and profile_id = auth.uid()
    )
  );
