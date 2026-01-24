-- BOOKINGS TABLE
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references auth.users(id) not null,
  company_id uuid references public.companies(id) not null,
  service_title text not null, -- Stores snapshot of service title
  service_price numeric(10,2), -- Stores snapshot of price
  booking_date date not null,
  booking_time text, -- 'morning', 'afternoon', 'evening' or specific time
  notes text,
  status text default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES FOR BOOKINGS
alter table public.bookings enable row level security;

-- Client can view their own bookings
create policy "Clients can view their own bookings" 
  on public.bookings for select 
  using (auth.uid() = client_id);

-- Client can create bookings
create policy "Clients can create bookings" 
  on public.bookings for insert 
  with check (auth.uid() = client_id);

-- Companies can view bookings made for them
create policy "Companies can view their bookings" 
  on public.bookings for select 
  using (
    exists (
      select 1 from public.companies 
      where id = company_id 
      and profile_id = auth.uid()
    )
  );

-- Companies can update booking status
create policy "Companies can update booking status" 
  on public.bookings for update
  using (
    exists (
      select 1 from public.companies 
      where id = company_id 
      and profile_id = auth.uid()
    )
  );
