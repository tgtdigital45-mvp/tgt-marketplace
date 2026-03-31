-- 🧹 Migration: Cleanup Redundant Profile Fields & Unify Addresses
-- Created: 2026-03-30

BEGIN;

-- ─── 1. Preparar Tabela de Empresas ──────────────────────────────────────────
-- Adicionar campos profissionais que antes estavam apenas no Profile
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS level text DEFAULT 'Iniciante',
ADD COLUMN IF NOT EXISTS response_time text DEFAULT 'asap',
ADD COLUMN IF NOT EXISTS sales_count integer DEFAULT 0;

-- ─── 2. Preparar Tabela de Perfis ─────────────────────────────────────────────
-- Adicionar campo de endereço consolidado (JSONB)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address jsonb;

-- ─── 3. Migração de Dados ─────────────────────────────────────────────────────

-- Migrar stats profissionais do Profile para a Empresa correspondente
UPDATE public.companies c
SET 
    level = p.level,
    response_time = p.response_time,
    sales_count = p.sales_count
FROM public.profiles p
WHERE c.profile_id = p.id;

-- Migrar endereços atomizados do Profile para o objeto JSONB
UPDATE public.profiles
SET address = jsonb_build_object(
    'street', address_street,
    'number', address_number,
    'complement', address_complement,
    'neighborhood', address_neighborhood,
    'city', address_city,
    'state', address_state,
    'zip', address_zip
)
WHERE address_street IS NOT NULL;

-- ─── 4. Refatorar Gatilhos de Reputação ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_reputation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_avg numeric;
  new_count integer;
  total_sales integer;
  new_level text;
  v_company_id uuid;
BEGIN
  -- Identificar a empresa associada ao reviewed_id (profile_id)
  SELECT id INTO v_company_id FROM companies WHERE profile_id = NEW.reviewed_id LIMIT 1;

  -- Calcular novos status para o prestador
  SELECT count(*), avg(rating)
  INTO new_count, new_avg
  FROM reviews
  WHERE reviewed_id = NEW.reviewed_id;

  new_count := COALESCE(new_count, 0);
  new_avg := COALESCE(new_avg, 0);

  -- Pegar contagem de vendas (pedidos concluídos)
  SELECT count(*) INTO total_sales
  FROM orders
  WHERE seller_id = NEW.reviewed_id AND status = 'completed';

  -- Determinar Nível
  new_level := 'Iniciante';
  IF total_sales >= 50 AND new_avg >= 4.8 THEN
    new_level := 'Pro';
  ELSIF total_sales >= 5 AND new_avg >= 4.5 THEN
    new_level := 'Nível 1';
  END IF;

  -- ATUALIZAÇÃO CENTRALIZADA NA TABELA COMPANIES
  IF v_company_id IS NOT NULL THEN
      UPDATE companies
      SET 
        rating = new_avg,
        total_reviews = new_count,
        level = new_level,
        sales_count = total_sales
      WHERE id = v_company_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- ─── 5. Remoção de Colunas Redundantes/Fantasmas ──────────────────────────────

-- Limpeza em Profiles (Campos profissionais e endereço atomizado)
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS skills,
DROP COLUMN IF EXISTS education,
DROP COLUMN IF EXISTS response_time,
DROP COLUMN IF EXISTS sales_count,
DROP COLUMN IF EXISTS rating_average,
DROP COLUMN IF EXISTS reviews_count,
DROP COLUMN IF EXISTS level,
DROP COLUMN IF EXISTS h3_index,
DROP COLUMN IF EXISTS address_street,
DROP COLUMN IF EXISTS address_number,
DROP COLUMN IF EXISTS address_complement,
DROP COLUMN IF EXISTS address_neighborhood,
DROP COLUMN IF EXISTS address_city,
DROP COLUMN IF EXISTS address_state,
DROP COLUMN IF EXISTS address_zip;

-- Limpeza em Companies
ALTER TABLE public.companies 
DROP COLUMN IF EXISTS verification_status;

-- ─── 6. Atualização de Views ──────────────────────────────────────────────────

-- ─── 5. Remoção de Colunas Redundantes/Fantasmas ──────────────────────────────

-- Remover views dependentes ANTES de dropar as colunas
DROP VIEW IF EXISTS public.public_profiles;
DROP VIEW IF EXISTS public.public_companies;

-- Limpeza em Profiles (Campos profissionais e endereço atomizado)
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS skills,
DROP COLUMN IF EXISTS education,
DROP COLUMN IF EXISTS response_time,
DROP COLUMN IF EXISTS sales_count,
DROP COLUMN IF EXISTS rating_average,
DROP COLUMN IF EXISTS reviews_count,
DROP COLUMN IF EXISTS level,
DROP COLUMN IF EXISTS h3_index,
DROP COLUMN IF EXISTS address_street,
DROP COLUMN IF EXISTS address_number,
DROP COLUMN IF EXISTS address_complement,
DROP COLUMN IF EXISTS address_neighborhood,
DROP COLUMN IF EXISTS address_city,
DROP COLUMN IF EXISTS address_state,
DROP COLUMN IF EXISTS address_zip;

-- Limpeza em Companies
ALTER TABLE public.companies 
DROP COLUMN IF EXISTS verification_status;

-- ─── 6. Recriar Views Atualizadas ─────────────────────────────────────────────

CREATE VIEW public.public_profiles AS
SELECT 
    id,
    full_name,
    avatar_url,
    user_type,
    status,
    address,
    created_at
FROM public.profiles;

CREATE VIEW public.public_companies AS
SELECT 
    id,
    profile_id,
    company_name,
    legal_name,
    cnpj,
    slug,
    description,
    logo_url,
    cover_image_url,
    website,
    phone,
    email,
    city,
    state,
    address,
    category,
    status,
    verified,
    rating,
    total_reviews,
    level,
    sales_count,
    h3_index,
    social_links,
    created_at
FROM public.companies
WHERE status IN ('approved', 'active');

GRANT SELECT ON public.public_profiles TO authenticated, anon;
GRANT SELECT ON public.public_companies TO authenticated, anon;

COMMIT;
