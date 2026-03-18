// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Create Portal Session Function Invoked')

serve(async (req) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log('Headers:', req.headers)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            console.error('User auth error:', userError)
            throw new Error('Unauthorized')
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const body = await req.json()
        const { return_url } = body
        console.log('Request body:', body)

        if (!return_url) throw new Error('Missing return_url')

        // Get Company & Customer ID
        console.log(`Fetching company for profile_id: ${user.id}`)
        const { data: company, error: companyError } = await supabaseClient
            .from('companies')
            .select('stripe_customer_id')
            .eq('profile_id', user.id)
            .single()

        if (companyError || !company) {
            console.error('Company error:', companyError)
            throw new Error('Company not found')
        }

        let customerId = company.stripe_customer_id

        if (!customerId) {
            console.log(`Creating new Stripe Customer for company: ${company.id}`)
            const customer = await stripe.customers.create({
                email: user.email,
                name: 'Cliente Contratto', // fallback if company_name not available in select
                metadata: {
                    company_id: company.id,
                    user_id: user.id
                }
            })
            customerId = customer.id

            await supabaseClient
                .from('companies')
                .update({ stripe_customer_id: customerId })
                .eq('id', company.id)
        } else {
            // Check if customer exists and is not deleted in Stripe
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
                        name: 'Cliente Contratto',
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

        // Create Portal Session
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: return_url,
        })

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error: any) {
        console.error('Portal Session Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
