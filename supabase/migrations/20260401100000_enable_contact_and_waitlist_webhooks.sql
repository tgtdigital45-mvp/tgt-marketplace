-- Migração: Habilitar Webhooks de E-mail para Contato e Waitlist
-- Descrição: Cria os gatilhos no banco de dados para disparar funções de borda (Edge Functions) quando novos registros são inseridos.

-- 1. Habilitar extensão pg_net se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Função de disparo para Contact Submissions
CREATE OR REPLACE FUNCTION public.handle_contact_submission_sync()
RETURNS TRIGGER AS $$
DECLARE
  jwt_claims jsonb;
  role_key text;
  auth_header text;
BEGIN
  -- Tentar obter claims do JWT da requisição atual
  BEGIN
    jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
    role_key := coalesce(jwt_claims->>'role_key', '');
  EXCEPTION WHEN OTHERS THEN
    role_key := '';
  END;

  -- Se não houver role_key, a Edge Function deve ser configurada para aceitar anon ou ser acessada via service_role interna
  -- Usamos o Bearer token se disponível
  IF role_key = '' THEN
    auth_header := NULL; 
  ELSE
    auth_header := 'Bearer ' || role_key;
  END IF;

  -- Disparar função send-contact-email
  PERFORM
    net.http_post(
      url := 'https://rclsllzolsiodyebfcfj.supabase.co/functions/v1/send-contact-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', auth_header
      ),
      body := json_build_object(
        'record', row_to_json(NEW),
        'type', TG_OP,
        'table', TG_TABLE_NAME
      )::jsonb
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função de disparo para Waitlist Submissions
CREATE OR REPLACE FUNCTION public.handle_waitlist_submission_sync()
RETURNS TRIGGER AS $$
DECLARE
  jwt_claims jsonb;
  role_key text;
  auth_header text;
BEGIN
  -- Tentar obter claims do JWT da requisição atual
  BEGIN
    jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
    role_key := coalesce(jwt_claims->>'role_key', '');
  EXCEPTION WHEN OTHERS THEN
    role_key := '';
  END;

  IF role_key = '' THEN
    auth_header := NULL; 
  ELSE
    auth_header := 'Bearer ' || role_key;
  END IF;

  -- Disparar função send-waitlist-email
  PERFORM
    net.http_post(
      url := 'https://rclsllzolsiodyebfcfj.supabase.co/functions/v1/send-waitlist-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', auth_header
      ),
      body := json_build_object(
        'record', row_to_json(NEW),
        'type', TG_OP,
        'table', TG_TABLE_NAME
      )::jsonb
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar Gatilhos no Banco de Dados

-- Trigger para contact_submissions
DROP TRIGGER IF EXISTS on_contact_submission ON public.contact_submissions;
CREATE TRIGGER on_contact_submission
  AFTER INSERT ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_contact_submission_sync();

-- Trigger para waitlist_submissions
DROP TRIGGER IF EXISTS on_waitlist_submission ON public.waitlist_submissions;
CREATE TRIGGER on_waitlist_submission
  AFTER INSERT ON public.waitlist_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_waitlist_submission_sync();

COMMENT ON FUNCTION public.handle_contact_submission_sync() IS 'Dispara webhook de e-mail após novo contato';
COMMENT ON FUNCTION public.handle_waitlist_submission_sync() IS 'Dispara webhook de e-mail após nova inscrição na lista de espera';
