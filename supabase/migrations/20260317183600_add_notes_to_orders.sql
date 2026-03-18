-- Adicionando a coluna notes na tabela orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Atualizar o schema
NOTIFY pgrst, 'reload schema';
