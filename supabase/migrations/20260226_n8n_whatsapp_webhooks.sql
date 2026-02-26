-- Migration: Webhooks para Eventos N8N (WhatsApp)
-- Configura os gatilhos para disparar HTTP POST via pg_net para o fluxo do webhook do N8N quando ocorrerem mensagens não lidas ou novos bookings.

-- Habilita a extensão pg_net (se aplicável no seu ambiente do Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Criação da função de disparo
CREATE OR REPLACE FUNCTION public.trigger_n8n_whatsapp_webhook()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url TEXT := 'https://n8n.contratto.local/webhook/whatsapp-notifications'; -- Altere para a URL de Produção do N8N
    company_phone TEXT;
BEGIN
    IF NEW.type IN ('booking_created', 'message_received', 'proposal_received') THEN
        -- O payload enviado para o n8n conterá os dados brutos da notificação In-App
        PERFORM net.http_post(
            url := webhook_url,
            body := json_build_object(
                'notification_id', NEW.id,
                'user_id', NEW.user_id,
                'type', NEW.type,
                'title', NEW.title,
                'message', NEW.message,
                'timestamp', NEW.created_at
            )::jsonb,
            headers := '{"Content-Type": "application/json"}'::jsonb
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criação da trigger atrelada aos Inserts em notificações In-App
DROP TRIGGER IF EXISTS tr_n8n_whatsapp_on_notification ON public.notifications;
CREATE TRIGGER tr_n8n_whatsapp_on_notification
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.trigger_n8n_whatsapp_webhook();

COMMENT ON FUNCTION public.trigger_n8n_whatsapp_webhook() IS 'Dispara eventos importantes via webhook HTTP do pg_net para automatizações no n8n (WhatsApp).';
