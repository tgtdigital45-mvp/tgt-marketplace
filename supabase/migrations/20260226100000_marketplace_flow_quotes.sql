-- Marketplace Flows: Quotes and Escrow Migration
-- Adiciona suporte a orçamentos, tipos de serviço e novos status de ordem para escrow.

-- 1. Criação de ENUMs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_type') THEN
        CREATE TYPE service_type AS ENUM (
            'remote_fixed',
            'local_client_fixed',
            'local_provider_fixed',
            'requires_quote'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quote_status') THEN
        CREATE TYPE quote_status AS ENUM (
            'pending',
            'replied',
            'accepted',
            'rejected'
        );
    END IF;
END$$;

-- 2. Alteração da tabela services
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_service_type_check;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS service_type service_type DEFAULT 'remote_fixed';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS allows_escrow boolean DEFAULT true;

-- 3. Criação da tabela quotes
DROP TABLE IF EXISTS public.quote_replies CASCADE;
DROP TABLE IF EXISTS public.quotes CASCADE;

CREATE TABLE IF NOT EXISTS public.quotes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    service_id uuid REFERENCES public.services(id) NOT NULL,
    description text NOT NULL,
    budget_expectation numeric(10,2),
    status quote_status DEFAULT 'pending' NOT NULL,
    attachments text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Habilitar RLS em quotes
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Políticas para quotes
CREATE POLICY "Users can view their own quotes"
    ON public.quotes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotes"
    ON public.quotes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can view quotes for their services"
    ON public.quotes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.services s
            JOIN public.companies c ON s.company_id = c.id
            WHERE s.id = quotes.service_id AND c.profile_id = auth.uid()
        )
    );

-- 4. Criação da tabela quote_replies
CREATE TABLE IF NOT EXISTS public.quote_replies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id uuid REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
    provider_id uuid REFERENCES public.profiles(id) NOT NULL,
    final_price numeric(10,2) NOT NULL,
    estimated_time text NOT NULL,
    conditions text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Habilitar RLS em quote_replies
ALTER TABLE public.quote_replies ENABLE ROW LEVEL SECURITY;

-- Políticas para quote_replies
CREATE POLICY "Users can view replies to their quotes"
    ON public.quote_replies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = quote_replies.quote_id AND q.user_id = auth.uid()
        )
    );

CREATE POLICY "Providers can view their own replies"
    ON public.quote_replies FOR SELECT
    USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert replies"
    ON public.quote_replies FOR INSERT
    WITH CHECK (auth.uid() = provider_id);

-- 5. Atualização de order_status e orders

-- Como PostgreSQL não permite adicionar múltiplos valores em uma única transação DDL de bloco PL/pgSQL
-- com ALTER TYPE de forma robusta em todas as versões se estiver dentro de um DO bloco com dependências diretas,
-- vamos adicionar os valores separadamente. Se já existirem, o PG lança erro, então envolvemos num DO block que
-- ignora erros específicos, ou usamos ALTER TYPE ADD VALUE IF NOT EXISTS se a versão suportar (PG 12+).

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_held';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'work_submitted_by_provider';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'approved_by_client';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'payment_released';

-- Adicionar coluna quote_id em orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.quotes(id);

-- Triggers para updated_at (opcional, assume-se que há uma função handle_updated_at ou moddatetime)
-- Caso já exista function handle_updated_at_column no banco, associar aqui:
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
        CREATE TRIGGER update_quotes_modtime
            BEFORE UPDATE ON public.quotes
            FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
    END IF;
END$$;
