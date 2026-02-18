// @ts-nocheck - Deno Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

// ============================================================================
// STRUCTURED LOGGING HELPER
// ============================================================================
interface LogContext {
    session_id?: string
    order_id?: string
    event_type?: string
    error?: string
    [key: string]: any
}

function logStructured(level: 'info' | 'warn' | 'error', message: string, context: LogContext = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context
    }

    if (level === 'error') {
        console.error(JSON.stringify(logEntry))
    } else {
        console.log(JSON.stringify(logEntry))
    }
}

// ============================================================================
// ASYNC PROCESSOR
// ============================================================================
async function processEvent(event: Stripe.Event) {
    let sessionId: string | undefined
    let eventType = event.type

    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        // --- SAGA: Handle Payment Failure ---
        if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object;
            const failMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

            logStructured('warn', 'Payment failed (SAGA)', {
                payment_intent: paymentIntent.id,
                error: failMessage
            });

            if (paymentIntent.metadata?.order_id) {
                const { error: sagaError } = await supabaseClient.rpc('transition_saga_status', {
                    p_order_id: paymentIntent.metadata.order_id,
                    p_new_status: 'PAYMENT_FAILED',
                    p_log_data: { error: failMessage, stripe_pi: paymentIntent.id }
                });

                if (sagaError) {
                    logStructured('error', 'Failed to transition SAGA to PAYMENT_FAILED', { error: sagaError.message });
                }
            }
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object
            sessionId = session.id
            const metadata = session.metadata

            logStructured('info', 'Processing checkout.session.completed', {
                session_id: sessionId,
                amount_total: session.amount_total
            })

            if (!metadata || !metadata.order_id) {
                logStructured('error', 'Missing order_id in session metadata', {
                    session_id: sessionId,
                    metadata: metadata
                })
                return
            }

            const { order_id } = metadata
            const amountTotal = session.amount_total

            // IDEMPOTENCY CHECK
            const { data: existingOrder } = await supabaseClient
                .from('orders')
                .select('id, payment_status, stripe_session_id')
                .eq('stripe_session_id', sessionId)
                .single()

            if (existingOrder) {
                logStructured('info', 'Webhook already processed (idempotent)', {
                    session_id: sessionId,
                    order_id: existingOrder.id
                })
                return
            }

            // PROCESS PAYMENT
            const { data: order, error: orderError } = await supabaseClient
                .from('orders')
                .update({
                    payment_status: 'paid',
                    stripe_session_id: sessionId,
                    amount_total: amountTotal,
                    receipt_url: session.url
                })
                .eq('id', order_id)
                .select()
                .single()

            if (orderError) throw new Error(`Order update failed: ${orderError.message}`)

            // SAGA: PAYMENT_CONFIRMED
            await supabaseClient.rpc('transition_saga_status', {
                p_order_id: order.id,
                p_new_status: 'PAYMENT_CONFIRMED',
                p_log_data: { stripe_session_id: sessionId, amount: amountTotal }
            });

            // COMMISSION SPLIT & WALLET
            const commissionRate = session.metadata?.commission_rate ? parseFloat(session.metadata.commission_rate) : 0.20
            const totalOrderValue = order.agreed_price || order.price || 0
            const sellerNetIncome = totalOrderValue * (1 - commissionRate)
            const seller_id = order.seller_id

            // Get/Create Wallet
            let { data: wallet } = await supabaseClient.from('wallets').select('*').eq('user_id', seller_id).single()
            if (!wallet) {
                const { data: newWallet } = await supabaseClient.from('wallets').insert({ user_id: seller_id }).select().single()
                wallet = newWallet
            }

            // Create Transaction
            const { data: existingTx } = await supabaseClient
                .from('transactions')
                .select('id')
                .eq('order_id', order.id)
                .eq('type', 'credit')
                .single()

            if (!existingTx) {
                await supabaseClient.from('transactions').insert({
                    wallet_id: wallet.id,
                    amount: sellerNetIncome,
                    type: 'credit',
                    status: 'pending',
                    order_id: order.id,
                    description: `Venda #${order.id.slice(0, 8)}`
                })

                // Update Balance
                const { error: balanceError } = await supabaseClient.rpc('increment_pending_balance', {
                    row_id: wallet.id,
                    amount_to_add: sellerNetIncome
                })

                if (balanceError) {
                    await supabaseClient
                        .from('wallets')
                        .update({ pending_balance: (wallet.pending_balance || 0) + sellerNetIncome })
                        .eq('id', wallet.id)
                }
            }

            // SAGA: ORDER_ACTIVE
            await supabaseClient.rpc('transition_saga_status', {
                p_order_id: order.id,
                p_new_status: 'ORDER_ACTIVE',
                p_log_data: { wallet_tx: wallet.id }
            });

            // Log Job completion
            await supabaseClient.from('saga_jobs').insert({
                order_id: order.id,
                event_type: 'ACTIVATE_ORDER',
                status: 'completed',
                payload: { session_id: sessionId, processed_at: new Date().toISOString() }
            });

        } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object
            const customerId = subscription.customer
            const status = subscription.status
            const priceId = subscription.items.data[0].price.id
            const productId = subscription.items.data[0].price.product

            logStructured('info', `Processing ${event.type}`, { customer_id: customerId, status })

            let planTier = 'starter'
            let commissionRate = 0.20
            const PRO_PRODUCT_ID = Deno.env.get('STRIPE_PRODUCT_ID_PRO')
            const AGENCY_PRODUCT_ID = Deno.env.get('STRIPE_PRODUCT_ID_AGENCY')

            if (['active', 'trialing'].includes(status)) {
                if (productId === AGENCY_PRODUCT_ID) {
                    planTier = 'agency'; commissionRate = 0.08
                } else if (productId === PRO_PRODUCT_ID) {
                    planTier = 'pro'; commissionRate = 0.12
                }
            } else if (['past_due', 'canceled', 'unpaid'].includes(status)) {
                // Handling resilience: downgrade to free/starter
                planTier = 'starter'
                commissionRate = 0.20
                logStructured('warn', `Subscription ${status} - downgrading company`, { customer_id: customerId })
            }

            const { error } = await supabaseClient
                .from('companies')
                .update({
                    subscription_status: status,
                    stripe_subscription_id: subscription.id,
                    current_plan_tier: planTier,
                    commission_rate: commissionRate
                })
                .eq('stripe_customer_id', customerId)

            if (error) logStructured('error', 'Company update failed', { error: error.message })
        }

    } catch (err) {
        logStructured('error', 'Background processing failed', { error: err.message })
    }
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================
serve(async (req) => {
    try {
        const signature = req.headers.get('stripe-signature')
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

        if (!signature || !webhookSecret) {
            return new Response(JSON.stringify({ error: 'Configuration error' }), { status: 400 })
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const body = await req.text()
        let event

        try {
            event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
        } catch (err) {
            logStructured('error', 'Signature verification failed', { error: err.message })
            return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
        }

        // Return 200 OK immediately
        const response = new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

        // Process in background
        const processingPromise = processEvent(event)

        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
            EdgeRuntime.waitUntil(processingPromise)
        } else {
            // In dev environment or if waitUntil misses, we might await it to ensure it runs
            // But to satisfy "Return 200 OK immediately", we don't await.
            // Note: Deno deploy might kill it if not waited. 
            // We assume this is deployed to Supabase which supports waitUntil.
            // For safety in local dev, we log that we are not awaiting.
            console.log('EdgeRuntime.waitUntil not found, processing in background (may be killed)')
            // processingPromise; 
        }

        return response

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
    }
})
