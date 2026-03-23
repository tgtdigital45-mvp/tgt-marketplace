import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Método não permitido." }), {
            status: 405,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
    }

    try {
        // Verificar autenticação do usuário
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Autorização ausente." }), {
                status: 401,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            });
        }

        // Obter dados do usuário autenticado
        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                Authorization: authHeader,
                apikey: Deno.env.get("SUPABASE_ANON_KEY") || "",
            },
        });

        if (!userRes.ok) {
            return new Response(JSON.stringify({ error: "Usuário não autenticado." }), {
                status: 401,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            });
        }

        const user = await userRes.json();
        const userId = user.id;

        // Cancelar pedidos pendentes do usuário antes de excluir
        await fetch(`${supabaseUrl}/rest/v1/orders?buyer_id=eq.${userId}&status=in.(pending,accepted)`, {
            method: "PATCH",
            headers: {
                apikey: supabaseServiceKey,
                Authorization: `Bearer ${supabaseServiceKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "canceled" }),
        });

        // Remover tokens de push
        await fetch(`${supabaseUrl}/rest/v1/push_tokens?user_id=eq.${userId}`, {
            method: "DELETE",
            headers: {
                apikey: supabaseServiceKey,
                Authorization: `Bearer ${supabaseServiceKey}`,
            },
        });

        // Excluir a conta do usuário via Admin API (usa service role)
        const deleteRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
            method: "DELETE",
            headers: {
                apikey: supabaseServiceKey,
                Authorization: `Bearer ${supabaseServiceKey}`,
            },
        });

        if (!deleteRes.ok) {
            const errBody = await deleteRes.text();
            throw new Error(`Falha ao excluir usuário: ${errBody}`);
        }

        return new Response(
            JSON.stringify({ success: true, message: "Conta excluída com sucesso." }),
            {
                status: 200,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: "Erro interno ao excluir conta.", details: error.message }),
            {
                status: 500,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            }
        );
    }
});
