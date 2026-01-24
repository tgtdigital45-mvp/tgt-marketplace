-- REVIEWS TABLE
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) not null,
  client_id uuid references auth.users(id) not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  reply text, /* Company response */
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES FOR REVIEWS
alter table public.reviews enable row level security;

-- Everyone can view reviews (Public Profile)
create policy "Reviews are public" 
  on public.reviews for select 
  using (true);

-- Clients can create reviews (Authenticated)
create policy "Clients can create reviews" 
  on public.reviews for insert 
  with check (auth.uid() = client_id);

-- Company owners can reply to reviews (Update their own reviews)
create policy "Companies can reply to reviews" 
  on public.reviews for update
  using (
    exists (
      select 1 from public.companies 
      where id = company_id 
      and profile_id = auth.uid()
    )
  );
