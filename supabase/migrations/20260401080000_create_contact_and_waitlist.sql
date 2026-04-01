-- Migração: Criar tabelas de contato e waitlist
-- Data: 2026-04-01

-- 1. Tabela de Contato
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived'))
);

-- 2. Tabela de Waitlist
CREATE TABLE IF NOT EXISTS public.waitlist_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'converted', 'archived'))
);

-- 3. Habilita RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_submissions ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acesso
-- Permitir que QUALQUER UM (incluindo usuários não logados) insira dados
CREATE POLICY "Enable insert for everyone" ON public.contact_submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for everyone" ON public.waitlist_submissions
    FOR INSERT WITH CHECK (true);

-- Permitir que apenas administradores vejam os envios (exemplo básico usando role do service_role ou auth.role)
CREATE POLICY "Enable read for authenticated users only" ON public.contact_submissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read for authenticated users only" ON public.waitlist_submissions
    FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Comentários para documentação
COMMENT ON TABLE public.contact_submissions IS 'Armazena mensagens enviadas pelo formulário de contato do site.';
COMMENT ON TABLE public.waitlist_submissions IS 'Armazena e-mails de profissionais interessados no acesso antecipado (waitlist).';
