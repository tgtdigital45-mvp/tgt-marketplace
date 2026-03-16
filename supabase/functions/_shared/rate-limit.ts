import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Middleware de Rate Limiting para Edge Functions
 * 
 * @param req - A requisição original
 * @param routeName - Nome identificador da rota
 * @param maxRequests - Máximo de requisições permitidas (padrão: 5)
 * @param windowSeconds - Janela de tempo em segundos (padrão: 60)
 * @returns Response ou null se passar no rate limit
 */
export async function checkRateLimit(
    req: Request,
    routeName: string,
    maxRequests = 5,
    windowSeconds = 60
): Promise<Response | null> {
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Capturar o IP do cabeçalho de proxy (Supabase Edge Functions usam x-forwarded-for)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    try {
        const { data: allowed, error } = await supabaseClient.rpc('check_rate_limit', {
            p_ip: ip,
            p_route: routeName,
            p_max_requests: maxRequests,
            p_window_seconds: windowSeconds,
        });

        if (error) {
            console.error('[RateLimit] Erro no RPC:', error);
            return null; // Falha segura: permite se houver erro no banco
        }

        if (!allowed) {
            return new Response(
                JSON.stringify({
                    error: 'Muitas requisições. Por favor, tente novamente mais tarde.',
                    code: 'rate_limit_exceeded'
                }),
                {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
    } catch (e) {
        console.error('[RateLimit] Exceção:', e);
    }

    return null;
}
