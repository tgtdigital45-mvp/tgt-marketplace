import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
            },
        });
    }

    try {
        const { stripe_account_id } = await req.json();

        if (!stripe_account_id) {
            return new Response(JSON.stringify({ error: "stripe_account_id is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 1. Get Balance
        const balance = await stripe.balance.retrieve({
            stripeAccount: stripe_account_id,
        });

        // 2. Get Recent Transactions
        const transactions = await stripe.balanceTransactions.list(
            { limit: 10 },
            { stripeAccount: stripe_account_id }
        );

        // 3. Get Account details to check Payouts status
        const account = await stripe.accounts.retrieve(stripe_account_id);

        return new Response(
            JSON.stringify({
                balance,
                transactions: transactions.data,
                payouts_enabled: account.payouts_enabled,
                requirements: account.requirements,
            }),
            {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    } catch (error: any) {
        console.error("Stripe Balance Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
