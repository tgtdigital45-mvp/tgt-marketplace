-- ============================================================
-- Migration 0009: Push Notification Tokens & Chat Proposals
-- ============================================================

-- 1. Push Token Storage
create table if not exists public.push_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  token text not null,
  platform text check (platform in ('ios', 'android', 'web')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, token)
);

alter table public.push_tokens enable row level security;

create policy "Users can manage their own tokens."
  on push_tokens for all
  using (auth.uid() = user_id);

-- 2. Add message_type to messages table for rich content (proposals, system, etc.)
alter table public.messages
  add column if not exists message_type text default 'text'
    check (message_type in ('text', 'budget_proposal', 'system', 'image', 'file')),
  add column if not exists metadata jsonb default '{}'::jsonb;

-- 3. Notification preferences
alter table public.profiles
  add column if not exists push_enabled boolean default true,
  add column if not exists email_notifications boolean default true;

-- 4. Edge Function for sending push notifications (trigger helper)
create or replace function public.notify_new_message()
returns trigger
language plpgsql
security definer
as $$
declare
  order_record record;
  recipient_id uuid;
begin
  -- Get order details
  select client_id, company_id into order_record
  from service_orders
  where id = NEW.order_id;

  -- Determine recipient (opposite of sender)
  if NEW.sender_id = order_record.client_id then
    -- Sender is client, notify company owner
    select owner_id into recipient_id
    from companies
    where id = order_record.company_id;
  else
    -- Sender is provider, notify client
    recipient_id := order_record.client_id;
  end if;

  -- Insert notification record for Edge Function to process
  insert into public.notifications (user_id, type, title, body, data)
  values (
    recipient_id,
    'new_message',
    'Nova mensagem',
    left(coalesce(NEW.content, 'Novo anexo'), 100),
    jsonb_build_object('order_id', NEW.order_id, 'message_id', NEW.id)
  );

  return NEW;
end;
$$;

-- 5. Notifications table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text,
  data jsonb default '{}'::jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications."
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications."
  on notifications for update
  using (auth.uid() = user_id);

-- System can insert notifications
create policy "System can insert notifications."
  on notifications for insert
  with check (true);

-- 6. Create trigger for new messages
create trigger tr_notify_new_message
  after insert on public.messages
  for each row
  when (NEW.is_system_message = false)
  execute function public.notify_new_message();

-- 7. Trigger for order status changes
create or replace function public.notify_order_status_change()
returns trigger
language plpgsql
security definer
as $$
declare
  notify_user_id uuid;
  status_label text;
  company_name text;
begin
  if OLD.status = NEW.status then
    return NEW;
  end if;

  -- Get company name
  select business_name into company_name
  from companies where id = NEW.company_id;

  -- Determine notification text
  case NEW.status
    when 'accepted' then status_label := 'Pedido aceito';
    when 'rejected' then status_label := 'Pedido recusado';
    when 'in_progress' then status_label := 'Serviço em andamento';
    when 'completed' then status_label := 'Serviço finalizado';
    when 'canceled' then status_label := 'Pedido cancelado';
    else status_label := 'Status atualizado';
  end case;

  -- Notify client for all status changes
  insert into public.notifications (user_id, type, title, body, data)
  values (
    NEW.client_id,
    'order_status',
    status_label,
    coalesce(company_name, 'Empresa') || ' atualizou seu pedido.',
    jsonb_build_object('order_id', NEW.id, 'status', NEW.status)
  );

  return NEW;
end;
$$;

create trigger tr_notify_order_status
  after update on public.service_orders
  for each row
  execute function public.notify_order_status_change();
