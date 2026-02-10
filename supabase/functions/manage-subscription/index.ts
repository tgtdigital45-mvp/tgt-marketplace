// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Manage Subscription Function Invoked')

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

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

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const { price_id, plan_tier } = await req.json()

        // 1. Get Company
        const { data: company, error: companyError } = await supabaseClient
            .from('companies')
            .select('*')
            .eq('profile_id', user.id) // Assuming 1 company per user (profile_id)
            .single()

        if (companyError || !company) {
            throw new Error('Company not found')
        }

        // 2. Get/Create Stripe Customer
        let customerId = company.stripe_customer_id

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: company.company_name,
                metadata: {
                    company_id: company.id,
                    user_id: user.id
                }
            })
            customerId = customer.id

            // Save to DB (using service role key if needed, but RLS might allow owner update? 
            // Safer to assume we might need service role if RLS is strict on this field, 
            // but for now let's try with current client. If it fails, we need service role client.)
            const supabaseService = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )
            await supabaseService
                .from('companies')
                .update({ stripe_customer_id: customerId })
                .eq('id', company.id)
        }

        // 3. Check for existing subscription
        let subscriptionId = company.stripe_subscription_id
        let currentSubscription = null

        if (subscriptionId) {
            try {
                currentSubscription = await stripe.subscriptions.retrieve(subscriptionId)
                if (currentSubscription.status === 'canceled') {
                    currentSubscription = null
                }
            } catch (e) {
                console.log('Error fetching subscription (might be deleted):', e.message)
                currentSubscription = null
            }
        }

        // 4. Handle Logic
        // If existing active subscription -> Upgrade/Downgrade directly if possible, or Portal?
        // Prompt says: "Se for upgrade/downgrade, use a API de Subscriptions do Stripe."

        if (currentSubscription) {
            // Upgrade/Downgrade logic
            // We need to fetch the subscription item to update
            const itemId = currentSubscription.items.data[0].id

            const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
                items: [{
                    id: itemId,
                    price: price_id,
                }],
                proration_behavior: 'create_prorations',
            })

            return new Response(
                JSON.stringify({
                    message: 'Subscription updated',
                    subscription: updatedSubscription
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )

        } else {
            // New Subscription -> Checkout Session
            const session = await stripe.checkout.sessions.create({
                customer: customerId,
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: price_id,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: `${req.headers.get('origin')}/dashboard?subscription_success=true&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${req.headers.get('origin')}/dashboard?subscription_canceled=true`,
                metadata: {
                    company_id: company.id,
                    plan_tier: plan_tier || 'pro' // fallback
                },
            })

            return new Response(
                JSON.stringify({
                    sessionId: session.id,
                    paymentUrl: session.url
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

    } catch (error) {
        console.error('Manage Subscription Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
