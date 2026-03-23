-- MIGRATION 0011: Fix Chat Budget and Messages Schema

-- 1. Permite que o total_price seja nulo inicialmente (importante para serviços sob orçamento)
alter table public.service_orders 
  alter column total_price drop not null;

-- 2. Adiciona colunas necessárias para mensagens do tipo proposta de orçamento
alter table public.messages
  add column if not exists message_type text default 'text',
  add column if not exists metadata jsonb default '{}'::jsonb;

-- 3. Adiciona comentário explicativo
comment on column public.messages.message_type is 'Tipo da mensagem (ex: text, budget_proposal, system)';
comment on column public.messages.metadata is 'Dados extras da mensagem (ex: {amount: 250.00} para orçamentos)';
