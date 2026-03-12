-- Migration para a loja do Profissional (Storefront) e Sistema de Favoritos

-- 1. Adicionar biografia/descrição à tabela companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Criar a tabela de empresas favoritas (Wishlist)
CREATE TABLE IF NOT EXISTS public.favorite_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(client_id, company_id) -- Evita duplicatas do mesmo cliente favoritanto a mesma empresa
);

-- Habilitar a segurança em nível de linha (RLS)
ALTER TABLE public.favorite_companies ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de segurança (RLS) para 'favorite_companies'
-- Usuarios podem ver apenas os seus próprios favoritos
CREATE POLICY "Users can view their own favorites"
    ON public.favorite_companies FOR SELECT
    USING (auth.uid() = client_id);

-- Usuarios podem inserir seus próprios favoritos
CREATE POLICY "Users can insert their own favorites"
    ON public.favorite_companies FOR INSERT
    WITH CHECK (auth.uid() = client_id);

-- Usuarios podem deletar seus próprios favoritos
CREATE POLICY "Users can delete their own favorites"
    ON public.favorite_companies FOR DELETE
    USING (auth.uid() = client_id);

-- (Profissionais já possuem política para atualizar sua empresa na tabela companies em migrações passadas).
