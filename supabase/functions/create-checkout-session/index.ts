// @ts-nocheck - Deno Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { checkRateLimit } from '../_shared/rate-limit.ts'

console.log('Create Checkout Session Function Invoked')

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders, status: 204 })
    }

    // Proteção contra abuso: 5 requisições a cada 60 segundos
    const rateLimitResponse = await checkRateLimit(req, 'create-checkout-session', 5, 60);
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

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const { order_id, proposal_id } = await req.json()

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
        let priceFromDb = order.price || order.agreed_price
        let commissionRate = service.companies?.commission_rate ?? 0.20
        let applicationFeeAmount = 0
        let unitAmount = 0
        let proposalTitle = service.title
        let proposalData = null

        // If paying a proposal (chat hiring flow)
        if (proposal_id) {
            const { data: proposalMessage, error: proposalError } = await supabaseClient
                .from('messages')
                .select('metadata')
                .eq('id', proposal_id)
                .single()
            
            if (proposalError || !proposalMessage) {
                throw new Error('Proposal not found')
            }

            if (proposalMessage.metadata?.type !== 'proposal') {
                throw new Error('Invalid proposal message')
            }

            proposalData = proposalMessage.metadata
            
            // For split proposals we charge the UPFRONT AMOUNT
            priceFromDb = proposalData.upfrontAmount
            proposalTitle = `${service.title} - Sinal Antecipado (${proposalData.upfrontPercentage}%)`
            
            unitAmount = Math.round(priceFromDb * 100)
            
            // The platform fee on the upfront is proportional or full. 
            // In our system, TGT takes all its 10% from the upfront to avoid holding risk, or proportionally.
            // Let's use proportional to the charged amount for simplicity.
            const totalProjRate = proposalData.platformFee / proposalData.totalValue
            applicationFeeAmount = Math.round(unitAmount * totalProjRate)
            
        } else {
            if (!priceFromDb) throw new Error('Order price is invalid')
            unitAmount = Math.round(priceFromDb * 100)
            applicationFeeAmount = Math.round(unitAmount * commissionRate)
        }

        console.log(`Creating session for Order: ${order.id}. Total: ${unitAmount / 100}. Fee: ${applicationFeeAmount / 100}`)

        // 3.1 Verifica Conta Conectada e Configura Separate Charge & Transfer
        const sellerStripeAccountId = sellerCompany.stripe_account_id
        let paymentData = {
            payment_intent_data: {
                setup_future_usage: 'off_session'
            }
        }

        if (sellerStripeAccountId) {
            console.log(`Setting up Separate Charge for Seller Connect Account: ${sellerStripeAccountId}`)
            paymentData.payment_intent_data.transfer_group = order.id
        } else {
            console.warn(`Seller ${sellerCompany.id} has no Stripe Connected Account. Funds will remain in Platform Account.`)
        }

        // 4. Create Stripe Checkout Session (idempotent)
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: proposalTitle,
                            description: `Order #${order.id.slice(0, 8)} - ${sellerCompany.company_name}`,
                            metadata: {
                                service_id: service.id,
                                order_id: order.id,
                                proposal_id: proposal_id || null
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
                order_id: order.id,
                buyer_id: user.id,
                service_id: service.id,
                application_fee_amount: applicationFeeAmount,
                commission_rate: commissionRate,
                seller_id: sellerCompany.id,
                proposal_id: proposal_id || null,
                payment_phase: proposal_id ? 'upfront' : 'full'
            },
            ...paymentData // Inject Separate Charge transfer_group if available
        }, {
            idempotencyKey: `checkout_${order.id}_${proposal_id || 'full'}_${Date.now()}`
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
