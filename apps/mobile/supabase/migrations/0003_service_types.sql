-- UPDATE SERVICES TABLE
alter table public.services
add column location_type text check (location_type in ('in_store', 'at_home', 'remote')) default 'in_store';

-- Se price_type por algum motivo ficou genérico na migrate inicial, 
-- não precisa mudar pois o check ('fixed', 'budget') já está em 0000_initial_schema.sql
