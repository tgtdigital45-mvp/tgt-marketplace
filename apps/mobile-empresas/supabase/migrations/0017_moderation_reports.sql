-- Migration 0017: Moderation Reports
-- Criar sistema de denúncias para o marketplace

CREATE TABLE IF NOT EXISTS public.reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    target_id uuid NOT NULL, -- ID do alvo (pode ser company_id, service_id ou order_id)
    target_type text NOT NULL CHECK (target_type IN ('company', 'service', 'order', 'profile')),
    reason text NOT NULL,
    details text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Usuários podem criar suas próprias denúncias
CREATE POLICY "Users can create reports."
    ON public.reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- Apenas admins podem ver denúncias (Assumindo que admin tem role = 'admin' na tabela profiles)
CREATE POLICY "Admins can view all reports."
    ON public.reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION update_reports_updated_at();

-- Comentários da tabela
COMMENT ON TABLE public.reports IS 'Armazena denúncias de usuários sobre empresas, serviços ou pedidos.';
