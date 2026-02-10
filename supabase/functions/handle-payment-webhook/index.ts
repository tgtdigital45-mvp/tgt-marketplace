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
// WEBHOOK HANDLER
// ============================================================================
serve(async (req) => {
    const startTime = Date.now()
    let sessionId: string | undefined
    let eventType: string | undefined

    try {
        // ====================================================================
        // STEP 1: VALIDATE STRIPE SIGNATURE (MANDATORY)
        // ====================================================================
        const signature = req.headers.get('stripe-signature')
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

        if (!signature) {
            logStructured('error', 'Missing Stripe signature header', {
                error: 'No stripe-signature header found'
            })
            return new Response(
                JSON.stringify({ error: 'Missing signature' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
        }

        if (!webhookSecret) {
            logStructured('error', 'STRIPE_WEBHOOK_SECRET not configured', {
                error: 'Environment variable missing'
            })
            return new Response(
                JSON.stringify({ error: 'Webhook secret not configured' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // ====================================================================
        // STEP 2: CONSTRUCT AND VERIFY EVENT
        // ====================================================================
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const body = await req.text()
        let event

        try {
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                webhookSecret
            )

            eventType = event.type
            logStructured('info', 'Webhook signature validated successfully', {
                event_type: eventType
            })
        } catch (err) {
            logStructured('error', 'Webhook signature validation failed', {
                error: err.message,
                signature_present: !!signature
            })
            return new Response(
                JSON.stringify({ error: 'Invalid signature' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // ====================================================================
        // STEP 3: HANDLE checkout.session.completed EVENT
        // ====================================================================
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object
            sessionId = session.id
            const metadata = session.metadata

            logStructured('info', 'Processing checkout.session.completed', {
                session_id: sessionId,
                amount_total: session.amount_total
            })

            // Validate metadata
            if (!metadata || !metadata.order_id) {
                logStructured('error', 'Missing order_id in session metadata', {
                    session_id: sessionId,
                    metadata: metadata
                })
                return new Response(
                    JSON.stringify({ error: 'Missing order_id in metadata' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                )
            }

            const { order_id } = metadata
            const amountTotal = session.amount_total

            // Initialize Supabase client
            const supabaseClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // ================================================================
            // STEP 4: IDEMPOTENCY CHECK - Early Exit
            // ================================================================
            try {
                const { data: existingOrder } = await supabaseClient
                    .from('orders')
                    .select('id, payment_status, stripe_session_id')
                    .eq('stripe_session_id', sessionId)
                    .single()

                if (existingOrder) {
                    logStructured('info', 'Webhook already processed (idempotent)', {
                        session_id: sessionId,
                        order_id: existingOrder.id,
                        payment_status: existingOrder.payment_status
                    })
                    return new Response(
                        JSON.stringify({ received: true, idempotent: true }),
                        { status: 200, headers: { 'Content-Type': 'application/json' } }
                    )
                }
            } catch (err) {
                // No existing order found, proceed with processing
                logStructured('info', 'No existing order found, proceeding with processing', {
                    session_id: sessionId,
                    order_id: order_id
                })
            }

            // ================================================================
            // STEP 5: PROCESS PAYMENT - Update Order
            // ================================================================
            try {
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

                if (orderError) {
                    throw new Error(`Order update failed: ${orderError.message}`)
                }

                logStructured('info', 'Order updated successfully', {
                    session_id: sessionId,
                    order_id: order.id,
                    payment_status: 'paid'
                })

                // ============================================================
                // STEP 6: COMMISSION SPLIT & WALLET UPDATE
                // ============================================================
                const commissionRate = 0.15
                const totalOrderValue = order.agreed_price || order.price
                const sellerNetIncome = totalOrderValue * (1 - commissionRate)
                const seller_id = order.seller_id

                logStructured('info', 'Calculating commission split', {
                    session_id: sessionId,
                    order_id: order.id,
                    total_value: totalOrderValue,
                    seller_net: sellerNetIncome,
                    commission_rate: commissionRate
                })

                // Get or create wallet
                let { data: wallet } = await supabaseClient
                    .from('wallets')
                    .select('*')
                    .eq('user_id', seller_id)
                    .single()

                let wallet_id = wallet?.id

                if (!wallet) {
                    const { data: newWallet, error: createWalletError } = await supabaseClient
                        .from('wallets')
                        .insert({ user_id: seller_id })
                        .select()
                        .single()

                    if (createWalletError) {
                        throw new Error(`Wallet creation failed: ${createWalletError.message}`)
                    }

                    wallet_id = newWallet.id
                    wallet = newWallet

                    logStructured('info', 'Created new wallet for seller', {
                        session_id: sessionId,
                        seller_id: seller_id,
                        wallet_id: wallet_id
                    })
                }

                // ============================================================
                // STEP 7: CREATE TRANSACTION (Idempotent)
                // ============================================================
                const { data: existingTx } = await supabaseClient
                    .from('transactions')
                    .select('id')
                    .eq('order_id', order.id)
                    .eq('type', 'credit')
                    .single()

                if (!existingTx) {
                    const { error: txError } = await supabaseClient
                        .from('transactions')
                        .insert({
                            wallet_id: wallet_id,
                            amount: sellerNetIncome,
                            type: 'credit',
                            status: 'pending',
                            order_id: order.id,
                            description: `Venda #${order.id.slice(0, 8)} - ${order.service_title}`
                        })

                    if (txError) {
                        throw new Error(`Transaction creation failed: ${txError.message}`)
                    }

                    logStructured('info', 'Transaction created successfully', {
                        session_id: sessionId,
                        order_id: order.id,
                        wallet_id: wallet_id,
                        amount: sellerNetIncome
                    })

                    // Update pending balance
                    const { error: balanceError } = await supabaseClient.rpc('increment_pending_balance', {
                        row_id: wallet_id,
                        amount_to_add: sellerNetIncome
                    })

                    if (balanceError) {
                        logStructured('warn', 'RPC increment_pending_balance failed, using fallback', {
                            session_id: sessionId,
                            error: balanceError.message
                        })

                        // Fallback: manual update
                        await supabaseClient
                            .from('wallets')
                            .update({ pending_balance: (wallet.pending_balance || 0) + sellerNetIncome })
                            .eq('id', wallet_id)
                    }

                    logStructured('info', 'Wallet balance updated successfully', {
                        session_id: sessionId,
                        wallet_id: wallet_id,
                        new_pending_balance: (wallet.pending_balance || 0) + sellerNetIncome
                    })
                } else {
                    logStructured('info', 'Transaction already exists, skipping wallet update', {
                        session_id: sessionId,
                        order_id: order.id,
                        existing_tx_id: existingTx.id
                    })
                }

            } catch (processingError) {
                logStructured('error', 'Payment processing failed', {
                    session_id: sessionId,
                    order_id: order_id,
                    error: processingError.message,
                    stack: processingError.stack
                })

                return new Response(
                    JSON.stringify({ error: 'Processing failed', details: processingError.message }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                )
            }
        } else {
            // Other event types - log and acknowledge
            logStructured('info', 'Received non-checkout event', {
                event_type: event.type
            })
        }

        // ====================================================================
        // SUCCESS RESPONSE
        // ====================================================================
        const duration = Date.now() - startTime
        logStructured('info', 'Webhook processed successfully', {
            session_id: sessionId,
            event_type: eventType,
            duration_ms: duration
        })

        return new Response(
            JSON.stringify({ received: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        // ====================================================================
        // TOP-LEVEL ERROR HANDLER
        // ====================================================================
        logStructured('error', 'Webhook handler failed', {
            session_id: sessionId,
            event_type: eventType,
            error: err.message,
            stack: err.stack
        })

        return new Response(
            JSON.stringify({ error: 'Webhook processing failed', details: err.message }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }
})
