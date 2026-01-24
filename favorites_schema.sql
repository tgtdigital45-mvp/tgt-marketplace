-- FAVORITES TABLE
create table public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  company_id uuid references public.companies(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, company_id) -- Prevent duplicate favorites
);

-- RLS POLICIES FOR FAVORITES
alter table public.favorites enable row level security;

-- Users can view their own favorites
create policy "Users can view own favorites" 
  on public.favorites for select 
  using (auth.uid() = user_id);

-- Users can insert their own favorites
create policy "Users can add favorites" 
  on public.favorites for insert 
  with check (auth.uid() = user_id);

-- Users can delete their own favorites
create policy "Users can remove favorites" 
  on public.favorites for delete 
  using (auth.uid() = user_id);
