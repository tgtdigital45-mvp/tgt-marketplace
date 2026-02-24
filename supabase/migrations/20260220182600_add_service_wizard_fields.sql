-- Adiciona novas colunas de controle para o Serviço (Single package \& Orçamento Prévio)
ALTER TABLE public.services 
  ADD COLUMN IF NOT EXISTS requires_quote BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_single_package BOOLEAN DEFAULT false;

-- Altera o tipo de atendimento se houver enum ou constraint antiga, vamos garantir que é texto
-- Apenas para segurança, alterando para text (se não for já):
-- ALTER TABLE public.services ALTER COLUMN service_type TYPE TEXT;
