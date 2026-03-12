import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "stripe";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2024-04-10",
    httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
        const { company_id, return_url } = await req.json();
        if (!company_id) {
            return new Response(JSON.stringify({ error: "company_id is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Fetch company from Supabase
        const companyRes = await fetch(
            `${supabaseUrl}/rest/v1/companies?id=eq.${company_id}&select=id,stripe_account_id,business_name,owner_id`,
            {
                headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`,
                },
            }
        );
        const companies = await companyRes.json();
        const company = companies?.[0];

        if (!company) {
            return new Response(JSON.stringify({ error: "Company not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        let accountId = company.stripe_account_id;

        // Create Stripe Express account if not exists
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: "express",
                country: "BR",
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: "individual",
                metadata: {
                    company_id: company_id,
                    supabase_owner_id: company.owner_id,
                },
            });

            accountId = account.id;

            // Save stripe_account_id to company
            await fetch(
                `${supabaseUrl}/rest/v1/companies?id=eq.${company_id}`,
                {
                    method: "PATCH",
                    headers: {
                        apikey: supabaseKey,
                        Authorization: `Bearer ${supabaseKey}`,
                        "Content-Type": "application/json",
                        Prefer: "return=minimal",
                    },
                    body: JSON.stringify({ stripe_account_id: accountId }),
                }
            );
        }

        // Check if onboarding is already complete in DB
        const isComplete = company.stripe_onboarding_complete;

        let url;
        if (isComplete) {
            // Create Login Link for managing account (Payouts, Bank etc)
            const loginLink = await stripe.accounts.createLoginLink(accountId);
            url = loginLink.url;
        } else {
            // Create Account Link for onboarding
            const appReturnUrl = return_url || "myapp://stripe-onboarding-return";
            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: `${supabaseUrl}/functions/v1/stripe-connect-onboarding`,
                return_url: appReturnUrl,
                type: "account_onboarding",
            });
            url = accountLink.url;
        }

        return new Response(
            JSON.stringify({
                url,
                account_id: accountId,
                is_management: isComplete,
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            }
        );
    } catch (error: any) {
        console.error("Stripe Connect Onboarding Error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal Server Error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
});
