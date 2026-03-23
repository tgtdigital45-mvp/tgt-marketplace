-- MIGRATION 0012: Advanced Scheduling and Durations

-- 1. Horários de funcionamento na tabela de empresas
alter table public.companies
  add column if not exists opening_hours jsonb default '{
    "mon": {"open": "08:00", "close": "18:00", "active": true},
    "tue": {"open": "08:00", "close": "18:00", "active": true},
    "wed": {"open": "08:00", "close": "18:00", "active": true},
    "thu": {"open": "08:00", "close": "18:00", "active": true},
    "fri": {"open": "08:00", "close": "18:00", "active": true},
    "sat": {"open": "08:00", "close": "12:00", "active": false},
    "sun": {"open": "08:00", "close": "12:00", "active": false}
  }'::jsonb,
  add column if not exists has_lunch_break boolean default false,
  add column if not exists lunch_start time default '12:00',
  add column if not exists lunch_end time default '13:00',
  add column if not exists works_on_holidays boolean default false;

-- 2. Unidade de duração na tabela de serviços
alter table public.services
  add column if not exists duration_unit text default 'minutes' check (duration_unit in ('minutes', 'hours', 'days'));

-- 3. Comentários para documentação
comment on column public.companies.opening_hours is 'Horários de abertura e fechamento por dia da semana';
comment on column public.services.duration_unit is 'Unidade de medida do estimated_duration (minutes, hours, days)';
