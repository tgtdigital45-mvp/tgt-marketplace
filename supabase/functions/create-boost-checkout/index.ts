// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'

console.log('Create Boost Checkout Function Invoked')

serve(async (req) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders, status: 204 })
    }

    // Proteção contra abuso
    const rateLimitResponse = await checkRateLimit(req, 'create-boost-checkout', 5, 60);
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError || !user) throw new Error('Unauthorized');

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const body = await req.json()
        const { price_id, boost_type, service_id, success_url, cancel_url } = body

        if (!price_id || !boost_type || !success_url || !cancel_url) {
            throw new Error('Missing required fields: price_id, boost_type, success_url, cancel_url')
        }

        // 5. Get Company & Customer Info
        const { data: company, error: companyError } = await supabaseClient
            .from('companies')
            .select('id, company_name, stripe_customer_id')
            .eq('profile_id', user.id)
            .single()

        if (companyError || !company) throw new Error('Company not found')

        let customerId = company.stripe_customer_id

        // Create/Validate Stripe Customer
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: company.company_name,
                metadata: { company_id: company.id, user_id: user.id }
            })
            customerId = customer.id
            await supabaseClient.from('companies').update({ stripe_customer_id: customerId }).eq('id', company.id)
        }

        // 7. Create Checkout Session
        console.log(`Creating boost session für ${boost_type}, service: ${service_id}`)

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [{ price: price_id, quantity: 1 }],
            mode: 'subscription',
            success_url: success_url,
            cancel_url: cancel_url,
            subscription_data: {
                metadata: {
                    company_id: company.id,
                    boost_type: boost_type,
                    service_id: service_id || null
                }
            },
            metadata: {
                company_id: company.id,
                boost_type: boost_type,
                service_id: service_id || null
            }
        });

        return new Response(
            JSON.stringify({ url: session.url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('Boost Checkout Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
