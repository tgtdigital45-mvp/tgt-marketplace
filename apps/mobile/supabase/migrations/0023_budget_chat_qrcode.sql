-- Migration 0023: Budget, Chat Media and QR Code preparation
-- Prepara as tabelas e o storage para receber anexos de mídia no chat e gerenciar propostas formalizadas no fluxo de negociação.

BEGIN;

-- 1. Atualizar a tabela de mensagens ('messages')
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS file_type text; -- ex: 'image/jpeg', 'video/mp4'

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS proposal_id uuid REFERENCES public.order_proposals(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.messages.file_type IS 'Mime type do anexo enviado na mensagem (foto/video/doc).';
COMMENT ON COLUMN public.messages.proposal_id IS 'Referência para a proposta formalizada associada a esta mensagem no chat.';

-- 2. Garantir que order_proposals seja legível pelo UUID (já existe na migration 0019)
-- Não são necessárias mudanças estruturais adicionais em order_proposals,
-- o status 'pending', 'accepted', 'rejected' com o amount atende as necessidades da UI de orçamento.

-- 3. Configurar Storage Bucket para Mídias do Chat (chat_media)
-- Nota: A inserção do bucket deve ser feita de forma segura no Supabase.

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
    'chat_media',
    'chat_media',
    false, -- Buckets privados por padrão para mídias em conversas
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

-- 4. Criar Políticas de RLS para o novo bucket 'chat_media'

-- Permitir Select (Leitura) apenas para quem participa da Order associada a mensagem
-- A lógica de bucket paths será: /chat_media/{order_id}/{file_name}
CREATE POLICY "Participantes da ordem podem ler midias"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat_media' AND
  EXISTS (
    SELECT 1 FROM public.service_orders o
    WHERE o.id::text = (string_to_array(name, '/'))[1] -- O primeiro segmento do caminho do arquivo deve ser o order_id
    AND (o.client_id = auth.uid() OR o.company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()))
  )
);

-- Permitir Insert (Escrita) apenas para quem participa da Order
CREATE POLICY "Participantes da ordem podem fazer upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat_media' AND
  EXISTS (
    SELECT 1 FROM public.service_orders o
    WHERE o.id::text = (string_to_array(name, '/'))[1]
    AND (o.client_id = auth.uid() OR o.company_id IN (SELECT id FROM public.companies WHERE owner_id = auth.uid()))
  )
);

COMMIT;
