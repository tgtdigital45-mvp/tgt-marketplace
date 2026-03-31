import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface NotificationPayload {
    user_id: string;
    title: string;
    body: string;
    data?: Record<string, any>;
}

async function sendExpoPush(tokens: string[], title: string, body: string, data?: Record<string, any>) {
    const messages = tokens.map((token) => ({
        to: token,
        sound: "default",
        title,
        body,
        data: data || {},
    }));

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
    });

    return response.json();
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    try {
        // Require Authentication
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized: Missing Authorization header" }), {
                status: 401,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                Authorization: authHeader,
                apikey: Deno.env.get("SUPABASE_ANON_KEY") || supabaseKey, 
                // Fallback to service key if no ANON_KEY set
            },
        });

        if (!userRes.ok) {
            return new Response(JSON.stringify({ error: "Unauthorized: Invalid token" }), {
                status: 401,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        const user = await userRes.json();
        
        const reqJson = await req.json();
        let payload: NotificationPayload;

        // Check if it's a Supabase Webhook (insert into notifications table)
        if (reqJson.type === 'INSERT' && reqJson.table === 'notifications' && reqJson.record) {
            payload = {
                user_id: reqJson.record.user_id,
                title: reqJson.record.title,
                body: reqJson.record.body,
                data: reqJson.record.data,
            };
        } else {
            // Direct payload
            payload = reqJson as NotificationPayload;
        }

        if (!payload.user_id || !payload.title) {
            return new Response(JSON.stringify({ error: "user_id and title are required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Fetch active push tokens for user
        const tokensRes = await fetch(
            `${supabaseUrl}/rest/v1/push_tokens?user_id=eq.${payload.user_id}&is_active=eq.true&select=token`,
            {
                headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`,
                },
            }
        );
        const tokensData = await tokensRes.json();
        const tokens: string[] = (tokensData || []).map((t: any) => t.token);

        if (tokens.length === 0) {
            return new Response(
                JSON.stringify({ success: true, message: "No active tokens found for user" }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        }

        // Send via Expo Push API
        const result = await sendExpoPush(tokens, payload.title, payload.body || "", payload.data);

        return new Response(
            JSON.stringify({ success: true, sent_to: tokens.length, result }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    } catch (error: any) {
        console.error("Push Notification Error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal Server Error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
});
