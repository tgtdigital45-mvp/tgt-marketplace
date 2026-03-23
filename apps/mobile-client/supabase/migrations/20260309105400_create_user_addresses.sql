-- Criação da tabela de Endereços
create table user_addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  label text not null check (char_length(label) > 0), -- Ex: "Casa", "Trabalho"
  street text not null,
  number text not null,
  neighborhood text not null,
  city text not null,
  state text not null check (char_length(state) = 2),
  zip text not null,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar RLS
alter table user_addresses enable row level security;

-- Políticas de acesso
create policy "Usuários podem ver seus próprios endereços."
  on user_addresses for select
  using ( auth.uid() = user_id );

create policy "Usuários podem adicionar seus próprios endereços."
  on user_addresses for insert
  with check ( auth.uid() = user_id );

create policy "Usuários podem atualizar seus próprios endereços."
  on user_addresses for update
  using ( auth.uid() = user_id );

create policy "Usuários podem deletar seus próprios endereços."
  on user_addresses for delete
  using ( auth.uid() = user_id );

-- Índices de performance
create index user_addresses_user_id_idx on user_addresses(user_id);
