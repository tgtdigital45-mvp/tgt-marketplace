-- Add stripe_product_id to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- Add stripe_customer_id to profiles (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Ensure companies has stripe_customer_id (it should, but just in case)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create Trigger Functions to call Edge Functions

-- Function for Services -> Stripe Product
CREATE OR REPLACE FUNCTION handle_service_stripe_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function 'manage-stripe-product'
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

-- Function for Profiles/Companies -> Stripe Customer
CREATE OR REPLACE FUNCTION handle_customer_stripe_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function 'manage-stripe-customer'
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

-- Create Triggers

-- Trigger for Services
DROP TRIGGER IF EXISTS on_service_stripe_sync ON services;
CREATE TRIGGER on_service_stripe_sync
  AFTER INSERT OR UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION handle_service_stripe_sync();

-- Trigger for Profiles
DROP TRIGGER IF EXISTS on_profile_stripe_sync ON profiles;
CREATE TRIGGER on_profile_stripe_sync
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_customer_stripe_sync();

-- Trigger for Companies (if we want to sync them as customers too)
DROP TRIGGER IF EXISTS on_company_stripe_sync ON companies;
CREATE TRIGGER on_company_stripe_sync
  AFTER INSERT OR UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION handle_customer_stripe_sync();
