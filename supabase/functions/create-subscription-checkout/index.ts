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
            console.error('Auth error:', userError)
            throw new Error('Unauthorized')
        }

        // 3. Initialize Stripe
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        // 4. Parse Request
        const { priceId, successUrl, cancelUrl } = await req.json()

        if (!priceId) throw new Error('Missing priceId')
        if (!successUrl) throw new Error('Missing successUrl')
        if (!cancelUrl) throw new Error('Missing cancelUrl')

        // 5. Get Company & Customer Info
        // We use profile_id based on schema logic (companies linked to profiles)
        const { data: company, error: companyError } = await supabaseClient
            .from('companies')
            .select('id, company_name, stripe_customer_id, profile_id')
            .eq('profile_id', user.id)
            .single()

        if (companyError || !company) {
            console.error('Company error:', companyError)
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
            const { error: updateError } = await supabaseClient
                .from('companies')
                .update({ stripe_customer_id: customerId })
                .eq('id', company.id)

            if (updateError) {
                console.error('Failed to save stripe_customer_id:', updateError)
            }
        }

        // 6. Create Checkout Session
        console.log(`Creating subscription session for customer: ${customerId}, price: ${priceId}`)

        const session = await stripe.checkout.sessions.create({
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
