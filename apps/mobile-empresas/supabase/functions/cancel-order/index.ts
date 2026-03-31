import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "stripe";

// Inicializar Stripe com a chave secreta
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-04-10",
    httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
    // CORS headers para chamadas do app
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
        // Validação de entrada
        const { order_id, cancel_reason } = await req.json();
        if (!order_id) {
            return new Response(JSON.stringify({ error: "order_id é obrigatório." }), {
                status: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        // Recuperar o usuário que está chamando a função
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Autorização ausente." }), {
                status: 401,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                Authorization: authHeader,
                apikey: Deno.env.get("SUPABASE_ANON_KEY") || "",
            },
        });

        if (!userRes.ok) {
            return new Response(JSON.stringify({ error: "Usuário não autenticado." }), {
                status: 401,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        const user = await userRes.json();
        const userId = user.id;

        // Buscar detalhes do pedido
        // Precisamos verificar se o usuário é o cliente (client_id) ou o dono da empresa (company_id -> owner_id)
        const orderQueryRes = await fetch(
            `${supabaseUrl}/rest/v1/orders?id=eq.${order_id}&select=id,status,buyer_id,seller_id,stripe_payment_intent_id`,
            {
                headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`,
                },
            }
        );

        const orders = await orderQueryRes.json();
        const order = orders?.[0];

        if (!order) {
            return new Response(JSON.stringify({ error: "Pedido não encontrado." }), {
                status: 404,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        // Checar Permissão
        const isClient = userId === order.buyer_id;
        const isCompanyOwner = userId === order.seller_id;

        if (!isClient && !isCompanyOwner) {
            return new Response(JSON.stringify({ error: "Acesso negado. Apenas o cliente ou o profissional podem cancelar o pedido." }), {
                status: 403,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        // Checar Status
        if (order.status !== "pending" && order.status !== "accepted") {
            return new Response(JSON.stringify({ error: `O pedido não pode ser cancelado pois está com status: ${order.status}.` }), {
                status: 400,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        // 1. Atomic marker to prevent double cancellation
        const preUpdateRes = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order_id}&status=in.(pending,accepted)`, {
            method: "PATCH",
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            body: JSON.stringify({ status: "canceling" }),
        });

        const preUpdateBody = await preUpdateRes.json();
        if (!preUpdateRes.ok || !preUpdateBody || preUpdateBody.length === 0) {
            return new Response(JSON.stringify({ error: "O pedido já está sendo cancelado, atualizado ou o status atual não permite." }), {
                status: 409,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        // Executar Reembolso se houver Payment Intent
        if (order.stripe_payment_intent_id) {
            try {
                // Verificar o status do PaymentIntent no Stripe
                const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);

                // Só estorna se a cobrança foi efetivada
                if (paymentIntent.status === "succeeded") {
                    await stripe.refunds.create({
                        payment_intent: order.stripe_payment_intent_id,
                    }, { idempotencyKey: `cancel_order_refund_${order_id}` });
                } else if (paymentIntent.status === "requires_capture") {
                    // Se estiver apenas reservado, cancela a captura
                    await stripe.paymentIntents.cancel(
                        order.stripe_payment_intent_id,
                        { idempotencyKey: `cancel_order_intent_${order_id}` }
                    );
                }
            } catch (stripeError: any) {
                console.error("Erro no Stripe:", stripeError);

                // Revert to original status if stripe fails
                await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order_id}`, {
                    method: "PATCH",
                    headers: {
                        apikey: supabaseKey,
                        Authorization: `Bearer ${supabaseKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ status: order.status }),
                });

                return new Response(JSON.stringify({ error: `Falha ao estornar: ${stripeError.message}` }), {
                    status: 500,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
                });
            }
        }

        // Atualizar status do pedido no banco de dados para "canceled"
        const updateRes = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${order_id}`, {
            method: "PATCH",
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "canceled" }),
        });

        if (!updateRes.ok) {
            console.error("Erro atualizando pedido:", await updateRes.text());
            throw new Error("Falha ao atualizar o status do pedido.");
        }

        // Inserir mensagem de sistema no chat notificando o cancelamento
        const cancelerRole = isClient ? "Cliente" : "Profissional";
        let systemMessage = `O pedido foi cancelado pelo ${cancelerRole}.`;
        if (cancel_reason) {
            systemMessage += `\nMotivo: ${cancel_reason}`;
        }

        if (order.stripe_payment_intent_id) {
            systemMessage += `\nUm reembolso integral foi emitido.`;
        }

        await fetch(`${supabaseUrl}/rest/v1/messages`, {
            method: "POST",
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                order_id: order_id,
                content: systemMessage,
                is_system_message: true,
            }),
        });

        // Retornar sucesso
        return new Response(
            JSON.stringify({ success: true, message: "Pedido cancelado com sucesso." }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );

    } catch (error: any) {
        console.error("Erro na função cancel-order:", error);
        return new Response(
            JSON.stringify({ error: "Erro interno no servidor.", details: error.message }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    }
});
