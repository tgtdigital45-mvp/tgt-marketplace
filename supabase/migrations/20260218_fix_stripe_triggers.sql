-- Habilitar a extensão pg_net se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Corrigir Função para Serviços -> Stripe Product
CREATE OR REPLACE FUNCTION handle_service_stripe_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Chamar Edge Function 'manage-stripe-product' usando net.http_post
  PERFORM
    net.http_post(
      url := 'https://rclsllzolsiodyebfcfj.supabase.co/functions/v1/manage-stripe-product',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claims', true)::json->>'role_key' || '"}',
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
BEGIN
  -- Chamar Edge Function 'manage-stripe-customer' usando net.http_post
  PERFORM
    net.http_post(
      url := 'https://rclsllzolsiodyebfcfj.supabase.co/functions/v1/manage-stripe-customer',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claims', true)::json->>'role_key' || '"}',
      body := json_build_object(
        'record', row_to_json(NEW),
        'type', TG_OP,
        'table', TG_TABLE_NAME
      )::jsonb
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
