-- Refatorar triggers para usar jsonb_build_object e evitar erros de concatenação de texto

-- Corrigir Função para Serviços -> Stripe Product
CREATE OR REPLACE FUNCTION handle_service_stripe_sync()
RETURNS TRIGGER AS $$
DECLARE
  jwt_claims jsonb;
  role_key text;
  auth_header text;
BEGIN
  -- Obter claims de forma segura
  BEGIN
    jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
  EXCEPTION WHEN OTHERS THEN
    jwt_claims := NULL;
  END;
  
  -- Extrair role_key ou usar padrão vazio (mas manter o prefixo Bearer se necessário, 
  -- ou deixar o Edge Function lidar com anon/service_role internamente)
  -- Nota: Geralmente 'anon' ou 'service_role' key.
  role_key := coalesce(jwt_claims->>'role_key', '');
  
  -- Se não houver role_key (ex: operação interna do banco sem contexto HTTP),
  -- o Edge Function pode falhar se exigir auth. 
  -- Mas o erro anterior era sintaxe SQL/JSON.
  
  IF role_key = '' THEN
    auth_header := NULL; -- Ou algum valor padrão seguro
  ELSE
    auth_header := 'Bearer ' || role_key;
  END IF;

  -- Chamar Edge Function 'manage-stripe-product' usando net.http_post de forma segura
  PERFORM
    net.http_post(
      url := 'https://rclsllzolsiodyebfcfj.supabase.co/functions/v1/manage-stripe-product',
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

-- Corrigir Função para Profiles/Companies -> Stripe Customer
CREATE OR REPLACE FUNCTION handle_customer_stripe_sync()
RETURNS TRIGGER AS $$
DECLARE
  jwt_claims jsonb;
  role_key text;
  auth_header text;
BEGIN
  -- Obter claims de forma segura
  BEGIN
    jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
  EXCEPTION WHEN OTHERS THEN
    jwt_claims := NULL;
  END;

  role_key := coalesce(jwt_claims->>'role_key', '');
  
  IF role_key = '' THEN
    auth_header := NULL; 
  ELSE
    auth_header := 'Bearer ' || role_key;
  END IF;

  -- Chamar Edge Function 'manage-stripe-customer' usando net.http_post de forma segura
  PERFORM
    net.http_post(
      url := 'https://rclsllzolsiodyebfcfj.supabase.co/functions/v1/manage-stripe-customer',
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
