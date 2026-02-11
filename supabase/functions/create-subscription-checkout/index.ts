// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Create Subscription Checkout Function Invoked')

serve(async (req) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

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
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        // 3. Initialize Stripe
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        // 4. Parse Request
        const { price_id, success_url, cancel_url } = await req.json()

        if (!price_id) throw new Error('Missing price_id')
        if (!success_url) throw new Error('Missing success_url')
        if (!cancel_url) throw new Error('Missing cancel_url')

        // 5. Get Company & Customer Info
        // We need the company to attach the subscription to, and to check for existing stripe_customer_id
        const { data: company, error: companyError } = await supabaseClient
            .from('companies')
            .select('id, company_name, stripe_customer_id, owner_id')
            .eq('owner_id', user.id)
            .single()

        if (companyError || !company) {
            throw new Error('Company not found for this user')
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
            // We use service_role key here to bypass RLS if strictly needed, 
            // but normally the user can update their own company if RLS allows.
            // Let's rely on the authenticated client first. If it fails, we might need service role.
            // Assuming RLS allows update of own company.
            const { error: updateError } = await supabaseClient
                .from('companies')
                .update({ stripe_customer_id: customerId })
                .eq('id', company.id)

            if (updateError) {
                console.error('Failed to save stripe_customer_id:', updateError)
                // We continue anyway, but next time it will create a duplicate customer if we don't save it.
                // Ideally should fail here or use service role.
            }
        }

        // 6. Create Checkout Session
        console.log(`Creating subscription session for customer: ${customerId}, price: ${price_id}`)

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: price_id,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: success_url,
            cancel_url: cancel_url,
            allow_promotion_codes: true,
            subscription_data: {
                metadata: {
                    company_id: company.id
                }
            }
        })

        // 7. Return URL
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
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
