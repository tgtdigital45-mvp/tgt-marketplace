// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'

console.log('Create Subscription Checkout Function Invoked')

serve(async (req) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders, status: 204 })
    }

    // Proteção contra abuso: 5 requisições a cada 60 segundos
    const rateLimitResponse = await checkRateLimit(req, 'create-subscription-checkout', 5, 60);
    if (rateLimitResponse) return rateLimitResponse;

    try {
        // 1. Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // 2. Authenticate User
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError || !user) {
            console.error('Auth error:', userError)
            throw new Error('Unauthorized')
        }

        // 3. Initialize Stripe
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        // 4. Parse Request
        const body = await req.json()
        console.log('Request body:', body)

        const priceId = body.priceId || body.price_id
        const successUrl = body.successUrl || body.success_url
        const cancelUrl = body.cancelUrl || body.cancel_url
        const isMonthly = body.is_monthly !== undefined ? body.is_monthly : true

        if (!priceId) {
            console.error('Missing priceId in body:', body)
            throw new Error('Missing priceId')
        }
        if (!successUrl) throw new Error('Missing successUrl')
        if (!cancelUrl) throw new Error('Missing cancelUrl')

        // 5. Get Company & Customer Info
        console.log(`Fetching company for profile_id: ${user.id}`)
        const { data: company, error: companyError } = await supabaseClient
            .from('companies')
            .select('id, company_name, stripe_customer_id, profile_id, stripe_subscription_id, subscription_status')
            .eq('profile_id', user.id)
            .single()

        if (companyError || !company) {
            console.error('Company fetch error:', companyError)
            throw new Error(`Company not found for user ${user.id}`)
        }

        let customerId = company.stripe_customer_id

        // Create Stripe Customer if not exists
        if (!customerId) {
            console.log(`Creating new Stripe Customer for company: ${company.id}`)
            const customer = await stripe.customers.create({
                email: user.email,
                name: company.company_name,
                metadata: {
                    company_id: company.id,
                    user_id: user.id
                }
            })
            customerId = customer.id

            // Save customer ID to database
            const { error: updateError } = await supabaseClient
                .from('companies')
                .update({ stripe_customer_id: customerId })
                .eq('id', company.id)

            if (updateError) {
                console.error('Failed to save stripe_customer_id:', updateError)
            }
        } else {
            // Check if customer is valid in Stripe
            try {
                const customer = await stripe.customers.retrieve(customerId)
                if (customer.deleted) {
                    throw new Error('deleted')
                }
            } catch (err: any) {
                if (err.statusCode === 404 || err.message === 'deleted' || err.type === 'invalid_request_error') {
                    console.log(`Customer ${customerId} not found or deleted in Stripe. Recreating...`)
                    const newCustomer = await stripe.customers.create({
                        email: user.email,
                        name: company.company_name,
                        metadata: {
                            company_id: company.id,
                            user_id: user.id
                        }
                    })
                    customerId = newCustomer.id

                    await supabaseClient
                        .from('companies')
                        .update({ 
                            stripe_customer_id: customerId, 
                            stripe_subscription_id: null, 
                            subscription_status: 'inactive' 
                        })
                        .eq('id', company.id)
                } else {
                    throw err
                }
            }
        }

        // 6. Handle Native Upgrade if Active Subscription exists
        if (company.stripe_subscription_id && company.subscription_status === 'active') {
            try {
                console.log(`Upgrading subscription: ${company.stripe_subscription_id} to price: ${priceId}`);
                const subscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id);
                
                if (subscription && subscription.items.data.length > 0) {
                    const itemId = subscription.items.data[0].id;
                    
                    // Directly update the subscription via API (prorated)
                    await stripe.subscriptions.update(company.stripe_subscription_id, {
                        items: [{
                            id: itemId,
                            price: priceId
                        }],
                        proration_behavior: 'create_prorations'
                    });
                    
                    // Respond with a success signal pointing back to the dashboard success URL
                    return new Response(
                        JSON.stringify({ url: successUrl }),
                        {
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                            status: 200,
                        }
                    )
                }
            } catch (upgradeErr) {
                console.error('Failed to upgrade subscription natively:', upgradeErr);
                // Fallback to generating a session below if this fails (e.g. subscription canceled in Stripe)
            }
        }

        // 7. Create Checkout Session for new subscription
        console.log(`Creating subscription session for customer: ${customerId}, price: ${priceId}`)

        const sessionConfig = {
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            allow_promotion_codes: true,
            subscription_data: {
                metadata: {
                    company_id: company.id
                }
            }
        };

        // Add 30-day Free Trial only for monthly plans (assuming user requested it for monthly plans)
        // REMOVED HARCODED TRIAL: This can cause 400 errors if the Stripe Price is configured differently or already has a trial.
        // if (isMonthly) {
        //     sessionConfig.subscription_data.trial_period_days = 30;
        // }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        // 8. Return URL
        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error: any) {
        console.error('Subscription Checkout Error:', error)
        return new Response(
            JSON.stringify({ error: error.message, stack: error.stack, type: error.type }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
