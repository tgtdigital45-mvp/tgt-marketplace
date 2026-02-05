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
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const { service_id, package_tier, user_id } = await req.json()

        if (!service_id || !package_tier || !user_id) {
            throw new Error('Missing required fields: service_id, package_tier, or user_id')
        }

        // 1. Fetch Service & Seller Details
        const { data: service, error: serviceError } = await supabaseClient
            .from('services')
            .select('*, companies(id, owner_id, company_name)')
            .eq('id', service_id)
            .single()

        if (serviceError || !service) {
            throw new Error('Service not found')
        }

        const seller_id = service.companies?.owner_id
        if (!seller_id) throw new Error('Seller not found for this service')

        // 2. Determine base price
        let basePrice = 0
        const packages = service.packages as any
        if (packages && packages[package_tier]) {
            basePrice = packages[package_tier].price
        } else if (package_tier === 'basic' && service.price) {
            basePrice = service.price
        } else {
            throw new Error('Invalid package tier or price not found')
        }

        // 3. Calculate Fee (5% Platform Fee)
        const platformFeePercentage = 0.05
        const feeAmount = Math.round(basePrice * platformFeePercentage)
        const totalPrice = basePrice + feeAmount // In cents logic? No, assuming database stores float 100.00

        // Stripe expects amounts in cents (integers)
        const unitAmount = Math.round(totalPrice * 100)

        console.log(`Creating session for: ${service.title} (${package_tier}). Base: ${basePrice}, Fee: ${feeAmount}, Total: ${totalPrice}`)

        // 4. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: `${service.title} (${package_tier})`,
                            description: `Serviço de ${service.companies?.company_name}`,
                            metadata: {
                                service_id,
                                package_tier
                            }
                        },
                        unit_amount: unitAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.headers.get('origin')}/orders?success=true`,
            cancel_url: `${req.headers.get('origin')}/service/${service_id}?canceled=true`,
            metadata: {
                service_id,
                package_tier,
                buyer_id: user_id,
                seller_id,
                base_price: basePrice.toString(), // Store useful stats
                platform_fee: feeAmount.toString()
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
