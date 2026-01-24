-- MESSAGES TABLE
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references auth.users(id) not null,
  receiver_id uuid references auth.users(id) not null,
  content text not null,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES FOR MESSAGES
alter table public.messages enable row level security;

-- Users can can view messages they sent OR received
create policy "Users manage own messages" 
  on public.messages for all 
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- ENABLE REALTIME
-- This permission is required to listen to changes on this table from the client
alter publication supabase_realtime add table public.messages;
