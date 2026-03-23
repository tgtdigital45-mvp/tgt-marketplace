alter table public.profiles add column role text check (role in ('customer', 'provider'));
