import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^14.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-04-10",
    httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
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

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Autorização ausente." }), {
                status: 401,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            });
        }

        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                Authorization: authHeader,
                apikey: supabaseAnonKey,
            },
        });

        if (!userRes.ok) {
            console.error("Auth error:", await userRes.text());
            return new Response(JSON.stringify({ error: "Usuário não autenticado." }), {
                status: 401,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            });
        }

        const user = await userRes.json();

        const { order_id } = await req.json();
        if (!order_id) {
            return new Response(JSON.stringify({ error: "order_id is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            });
        }

        // Fetch order with company data using Service Role to check ownership
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data: order, error: orderError } = await adminClient
            .from("service_orders")
            .select(`
                id, 
                total_price, 
                company_id, 
                client_id, 
                companies (
                    stripe_account_id
                )
            `)
            .eq("id", order_id)
            .single();

        if (orderError || !order) {
            console.error("Order fetch error:", orderError);
            return new Response(JSON.stringify({ error: "Order not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            });
        }

        // VALIDATION: Only the client who created the order can pay for it
        if (order.client_id !== user.id) {
            console.warn(`Tentativa de pagamento não autorizada: Usuário ${user.id} tentou pagar pedido ${order_id} pertencente ao cliente ${order.client_id}`);
            return new Response(JSON.stringify({ error: "Acesso negado: Você só pode iniciar pagamentos para seus próprios pedidos." }), {
                status: 403,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            });
        }

        // VALIDATION: Order status must be 'accepted' or 'pending' to proceed to payment
        if (order.status !== 'accepted' && order.status !== 'pending') {
            const currentStatus = order.status;
            console.warn(`Tentativa de pagamento em pedido inválido: Pedido ${order_id} com status '${currentStatus}'`);
            
            let message = `O pagamento não é permitido para pedidos com status '${currentStatus}'.`;
            
            return new Response(JSON.stringify({ error: message }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            });
        }

        const amount = Math.round((order.total_price || 0) * 100); // Convert BRL to centavos
        if (amount <= 0) {
            return new Response(JSON.stringify({ error: "Invalid order amount" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            });
        }

        // Get take rate for this company
        const { data: takeRate, error: takeRateError } = await adminClient
            .rpc("get_company_take_rate", { p_company_id: order.company_id });

        const feePercent = typeof takeRate === "number" ? takeRate : 20;
        const applicationFee = Math.round(amount * (feePercent / 100));

        // Get or create Stripe Customer for the client
        const { data: clientProfile } = await adminClient
            .from("profiles")
            .select("id, stripe_customer_id, first_name, last_name")
            .eq("id", order.client_id)
            .single();

        let stripeCustomerId = clientProfile?.stripe_customer_id;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                name: `${clientProfile?.first_name || ""} ${clientProfile?.last_name || ""}`.trim() || "Cliente",
                metadata: { supabase_id: order.client_id },
            });
            stripeCustomerId = customer.id;

            // Save stripe_customer_id
            await adminClient
                .from("profiles")
                .update({ stripe_customer_id: stripeCustomerId })
                .eq("id", order.client_id);
        }

        // Build PaymentIntent params
        const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
            amount,
            currency: "brl",
            customer: stripeCustomerId,
            metadata: {
                order_id,
                company_id: order.company_id,
                client_id: order.client_id,
                triggered_by: user.id
            },
        };

        // If company has Stripe Connect account, add split
        const connectedAccountId = order.companies?.stripe_account_id;
        if (connectedAccountId) {
            paymentIntentParams.application_fee_amount = applicationFee;
            paymentIntentParams.transfer_data = {
                destination: connectedAccountId,
            };
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

        // Audit Log (Optional but recommended)
        console.log(`PaymentIntent created: ${paymentIntent.id} for order ${order_id} by user ${user.id}`);

        return new Response(
            JSON.stringify({
                client_secret: paymentIntent.client_secret,
                payment_intent_id: paymentIntent.id,
                amount,
                fee: applicationFee,
                take_rate: feePercent,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            }
        );
    } catch (error: any) {
        console.error("Payment Intent Error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal Server Error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            }
        );
    }
});

