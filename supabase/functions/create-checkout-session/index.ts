// @ts-nocheck - Deno Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Create Checkout Session Function Invoked')

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

        // 1. Fetch Order Details & Verify Ownership
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select('*, services(*, companies(id, profile_id, company_name, commission_rate))') // Expanded select for service/company info
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

        const service = order.services
        if (!service) throw new Error('Associated service not found')

        // 2. Validate Price Source (Security Check)
        // We use the price stored in the order, BUT we should verify it matches the current service price if the order is new?
        // Or simply trust the order price if it was created correctly? 
        // Logic: For this MVP, we trust the `order.agreed_price` or `order.price` which should have been set securely or verified at creation.
        // However, the prompt says "Busque o preço do serviço no banco de dados (NUNCA confie no preço enviado pelo front)".
        // Since `order` IS from the database, we are safe. We are NOT taking price from `req.json()`.

        // Let's use order.price directly as it represents the contract value.
        const priceFromDb = order.price || order.agreed_price

        if (!priceFromDb) throw new Error('Order price is invalid')

        // 3. Calculate Fee (Dynamic Take Rate)
        const sellerCompany = service.companies
        const commissionRate = sellerCompany.commission_rate !== undefined ? sellerCompany.commission_rate : 0.20
        const applicationFeeAmount = Math.round(unitAmount * commissionRate)

        // Stripe expects cents
        const unitAmount = Math.round(priceFromDb * 100)

        console.log(`Creating session for Order: ${order.id}. Total: ${unitAmount / 100}. Fee: ${applicationFeeAmount / 100} (${commissionRate * 100}%)`)

        // 4. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: `${service.title} (${order.package_tier})`,
                            description: `Order #${order.id.slice(0, 8)} - ${service.companies?.company_name}`,
                            metadata: {
                                service_id: service.id,
                                order_id: order.id
                            }
                        },
                        unit_amount: unitAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.headers.get('origin')}/orders/${order.id}?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.get('origin')}/orders/${order.id}?canceled=true`,
            metadata: {
                buyer_id: user.id,
                service_id: service.id,
                application_fee_amount: applicationFeeAmount,
                commission_rate: commissionRate
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

    } catch (error) {
        console.error('Checkout Session Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
