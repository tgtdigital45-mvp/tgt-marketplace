// @ts-nocheck - Deno Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Create Payment Intent Function Invoked')

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

        const { order_id } = await req.json()

        if (!order_id) {
            throw new Error('Missing required field: order_id')
        }

        // 1. Fetch Order Details
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select('*, services(*, companies(*))')
            .eq('id', order_id)
            .single()

        if (orderError || !order) {
            throw new Error('Order not found')
        }

        if (order.buyer_id !== user.id) {
            throw new Error('Unauthorized: You can only pay for your own orders')
        }

        if (order.payment_status === 'paid') {
            throw new Error('Order is already paid')
        }

        const priceFromDb = order.price || order.agreed_price
        if (!priceFromDb) throw new Error('Order price is invalid')

        // 2. Manage Stripe Customer
        let stripeCustomerId = user.user_metadata?.stripe_customer_id

        if (!stripeCustomerId) {
            // Search by email first
            const customers = await stripe.customers.list({ email: user.email, limit: 1 })
            if (customers.data.length > 0) {
                stripeCustomerId = customers.data[0].id
            } else {
                const customer = await stripe.customers.create({
                    email: user.email,
                    metadata: { supabase_uid: user.id }
                })
                stripeCustomerId = customer.id
            }

            // Update user metadata in Supabase Auth (Service Role would be better, but we use what we have)
            // Note: Updating auth metadata requires admin privileges or the user themselves. 
            // In Edge Functions, we usually use Service Role for this.
        }

        // 3. Create Ephemeral Key for PaymentSheet
        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: stripeCustomerId },
            { apiVersion: '2023-10-16' }
        )

        // 4. Create PaymentIntent
        const unitAmount = Math.round(priceFromDb * 100)
        const sellerCompany = order.services?.companies
        const commissionRate = sellerCompany?.commission_rate ?? 0.20
        const applicationFeeAmount = Math.round(unitAmount * commissionRate)

        const paymentIntentPayload: Stripe.PaymentIntentCreateParams = {
            amount: unitAmount,
            currency: 'brl',
            customer: stripeCustomerId,
            automatic_payment_methods: {
                enabled: true,
            },
            capture_method: 'manual', // Enforce manual capture for Escrow
            metadata: {
                order_id: order.id,
                buyer_id: user.id,
                service_id: order.service_id,
                seller_id: order.seller_id,
                application_fee_amount: applicationFeeAmount,
                commission_rate: commissionRate,
                type: 'service_order'
            },
        }

        if (sellerCompany?.stripe_account_id) {
            paymentIntentPayload.transfer_data = {
                destination: sellerCompany.stripe_account_id,
            }
            paymentIntentPayload.application_fee_amount = applicationFeeAmount
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentPayload)

        return new Response(
            JSON.stringify({
                paymentIntent: paymentIntent.client_secret,
                ephemeralKey: ephemeralKey.secret,
                customer: stripeCustomerId,
                publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY') // Optional, but helps front
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Payment Intent Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
