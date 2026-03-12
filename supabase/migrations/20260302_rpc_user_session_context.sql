-- ============================================================
DROP FUNCTION IF EXISTS public.get_user_session_context(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.get_user_session_context(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'role',         p.role,
    'full_name',    p.full_name,
    'avatar_url',   p.avatar_url,
    -- Se existe registro em companies, o usuário É uma empresa
    'user_type',    COALESCE(
                      CASE WHEN c.id IS NOT NULL THEN 'company' END,
                      p.user_type,
                      'client'
                    ),
    'company_slug', c.slug
  )
  INTO v_result
  FROM public.profiles p
  LEFT JOIN public.companies c ON c.profile_id = p.id
  WHERE p.id = p_user_id;

  -- Retorna NULL caso o perfil ainda não exista (primeiro acesso via OAuth)
  RETURN v_result;
END;
$$;

-- Garante que apenas o serviço pode chamar — usuários autenticados
-- herdam via SECURITY DEFINER
GRANT EXECUTE ON FUNCTION public.get_user_session_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_session_context(UUID) TO service_role;
