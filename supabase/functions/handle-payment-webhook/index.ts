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

        if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
            const isPI = event.type === 'payment_intent.succeeded'
            const object = event.data.object
            const sessionId = isPI ? undefined : object.id
            const paymentIntentId = isPI ? object.id : object.payment_intent
            const metadata = object.metadata

            logStructured('info', `Processing ${event.type}`, {
                id: object.id,
                amount_total: isPI ? object.amount : object.amount_total
            })

            if (!metadata || !metadata.order_id) {
                logStructured('info', `Event ${event.type} ignored (no order_id)`, { id: object.id })
                return
            }

            const { order_id } = metadata
            const amountTotal = isPI ? object.amount : object.amount_total

            // IDEMPOTENCY CHECK
            const query = supabaseClient.from('orders').select('id, payment_status, stripe_payment_intent_id, stripe_session_id')
            if (isPI) {
                query.eq('stripe_payment_intent_id', object.id)
            } else {
                query.eq('stripe_session_id', object.id)
            }

            const { data: existingOrder } = await query.single()

            if (existingOrder && existingOrder.payment_status === 'paid') {
                logStructured('info', 'Webhook already processed (idempotent)', {
                    id: object.id,
                    order_id: existingOrder.id
                })
                return
            }

            // PROCESS PAYMENT
            const updateData = {
                payment_status: 'paid',
                amount_total: amountTotal,
            }
            if (isPI) {
                updateData.stripe_payment_intent_id = object.id
            } else {
                updateData.stripe_session_id = object.id
                updateData.receipt_url = object.url
            }

            const { data: order, error: orderError } = await supabaseClient
                .from('orders')
                .update(updateData)
                .eq('id', order_id)
                .select()
                .single()

            if (orderError) throw new Error(`Order update failed: ${orderError.message}`)

            // Confirm associated booking
            await supabaseClient
                .from('bookings')
                .update({ status: 'confirmed' })
                .eq('order_id', order_id);

            // SAGA: PAYMENT_CONFIRMED
            await supabaseClient.rpc('transition_saga_status', {
                p_order_id: order.id,
                p_new_status: 'PAYMENT_CONFIRMED',
                p_log_data: { [isPI ? 'stripe_pi' : 'stripe_session_id']: object.id, amount: amountTotal }
            });

            // SPRINT 4: REGISTRAR PARCELAMENTO SE FOR PROPOSTA
            if (metadata.proposal_id) {
                // Registrar parcela paga (Sinal)
                await supabaseClient.from('order_installments').insert({
                    order_id: order.id,
                    phase: metadata.payment_phase || 'upfront',
                    amount: amountTotal / 100,
                    stripe_payment_intent_id: isPI ? object.id : object.payment_intent,
                    status: 'paid',
                    paid_at: new Date().toISOString()
                })

                // Atualizar status da proposta no metadata da mensagem para 'accepted'
                const { data: proposalMessage } = await supabaseClient.from('messages')
                    .select('metadata')
                    .eq('id', metadata.proposal_id)
                    .single()
                    
                if (proposalMessage && proposalMessage.metadata) {
                    const newMetadata = { ...proposalMessage.metadata, status: 'accepted' }
                    await supabaseClient.from('messages').update({ metadata: newMetadata }).eq('id', metadata.proposal_id)
                }

                // Inserir mensagem de sistema de sucesso no chat
                await supabaseClient.from('messages').insert({
                    order_id: order.id,
                    sender_id: metadata.buyer_id, // technically the system on behalf of the buyer
                    receiver_id: metadata.seller_id,
                    content: JSON.stringify({
                         type: 'payment_success',
                         title: metadata.payment_phase === 'upfront' ? 'Sinal Antecipado Recebido!' : 'Pagamento Final Recebido!',
                         description: metadata.payment_phase === 'upfront' 
                            ? 'O cliente pagou o sinal. O projeto está oficialmente iniciado.' 
                            : 'O cliente liberou o pagamento final. Excelente trabalho!',
                         amount: amountTotal / 100,
                         fee: metadata.application_fee_amount ? Number(metadata.application_fee_amount) / 100 : undefined,
                         net: (amountTotal - Number(metadata.application_fee_amount || 0)) / 100
                    }),
                    is_system_message: true
                })
            }

            // COMMISSION SPLIT & WALLET
            const seller_id = metadata.seller_id;
            let commissionRate: number | null = metadata.commission_rate
                ? parseFloat(metadata.commission_rate)
                : null;

            if (commissionRate === null || isNaN(commissionRate)) {
                const { data: companyData } = await supabaseClient
                    .from('companies')
                    .select('commission_rate')
                    .eq('profile_id', seller_id)
                    .maybeSingle();

                commissionRate = companyData?.commission_rate ?? null;
            }

            if (commissionRate === null || isNaN(commissionRate)) {
                commissionRate = 0.20;
            }

            const realAmountPaid = amountTotal / 100;
            const exactFeeAmount = metadata.application_fee_amount ? Number(metadata.application_fee_amount) / 100 : (realAmountPaid * commissionRate);
            const sellerNetIncome = realAmountPaid - exactFeeAmount;

            // Get/Create Wallet
            let { data: wallet } = await supabaseClient.from('wallets').select('*').eq('user_id', metadata.seller_id).single()
            if (!wallet) {
                const { data: newWallet } = await supabaseClient.from('wallets').insert({ user_id: metadata.seller_id }).select().single()
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

                await supabaseClient.rpc('increment_pending_balance', {
                    p_wallet_id: wallet.id,
                    p_amount: sellerNetIncome,
                    p_order_id: order.id
                })
            }

            const newSagaStatus = metadata.proposal_id && metadata.payment_phase === 'upfront' 
                ? 'ORDER_ACTIVE' 
                : 'WAITING_ACCEPTANCE';

            await supabaseClient.rpc('transition_saga_status', {
                p_order_id: order.id,
                p_new_status: newSagaStatus,
                p_log_data: { wallet_tx: existingTx ? existingTx.id : 'new' }
            });

            await supabaseClient.from('saga_jobs').insert({
                order_id: order.id,
                event_type: 'ACTIVATE_ORDER',
                status: 'completed',
                payload: { [isPI ? 'stripe_pi' : 'stripe_session_id']: object.id, processed_at: new Date().toISOString() }
            });

        } else if (
            event.type === 'customer.subscription.created' ||
            event.type === 'customer.subscription.updated' || 
            event.type === 'customer.subscription.deleted'
        ) {
            const subscription = event.data.object
            const customerId = subscription.customer
            const status = subscription.status
            const priceId = subscription.items.data[0].price.id

            logStructured('info', `Processing subscription event ${event.type}`, { customer_id: customerId, status, price_id: priceId })

            let planTier = 'starter'
            let commissionRate = 0.20
            
            const PRO_PRICES = ['price_1TCON9E72T1QHvIb9sWMS11c', 'price_1TCONBE72T1QHvIbzBzuu5MA'];
            const AGENCY_PRICES = ['price_1TCON9E72T1QHvIbU94cmdBj', 'price_1TCONCE72T1QHvIbh3DazzwM'];

            if (['active', 'trialing'].includes(status)) {
                if (AGENCY_PRICES.includes(priceId)) {
                    planTier = 'agency'; commissionRate = 0.08
                } else if (PRO_PRICES.includes(priceId)) {
                    planTier = 'pro'; commissionRate = 0.12
                }
            }

            // Update standard company plan info
            const { error: updateError } = await supabaseClient
                .from('companies')
                .update({
                    subscription_status: status,
                    stripe_subscription_id: subscription.id,
                    current_plan_tier: planTier,
                    commission_rate: commissionRate
                })
                .eq('stripe_customer_id', customerId)

            if (updateError) logStructured('error', 'Company update failed', { error: updateError.message })

            // --- TRATAMENTO DE BOOST (SPONSORSHIP) --- 
            const boostType = subscription.metadata?.boost_type || null;
            const boostServiceId = subscription.metadata?.service_id || null;
            const isBoostActive = ['active', 'trialing'].includes(status);

            if (boostType === 'service' && boostServiceId) {
                logStructured('info', `Atualizando status de Boost de Serviço: ${isBoostActive} para ${boostServiceId}`, { boost_type: boostType, service_id: boostServiceId });
                await supabaseClient
                    .from('services')
                    .update({ is_sponsored: isBoostActive })
                    .eq('id', boostServiceId);
            } else if (boostType === 'company') {
                logStructured('info', `Atualizando status de Boost de Perfil da Empresa: ${isBoostActive}`, { boost_type: boostType });
                await supabaseClient
                    .from('companies')
                    .update({ is_sponsored: isBoostActive })
                    .eq('stripe_customer_id', customerId);
            }
        }

    } catch (err: any) {
        logStructured('error', 'Background processing failed', { error: err.message })
        
        try {
            await supabaseClient.from('stripe_webhook_dlq').insert({
                stripe_event_id: event.id,
                event_type: event.type,
                payload: event,
                error_message: err.message || 'Unknown error',
                status: 'pending'
            });
            logStructured('info', 'Event added to DLQ', { event_id: event.id });
        } catch (dlqErr: any) {
            logStructured('error', 'Failed to insert into DLQ', { error: dlqErr.message });
        }
    }
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================
serve(async (req) => {
    try {
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const body = await req.text()
        let event

        const isInternalRetry = req.headers.get('Authorization') === `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`;

        if (isInternalRetry) {
            event = JSON.parse(body);
        } else {
            const signature = req.headers.get('stripe-signature')
            const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

            if (!signature || !webhookSecret) {
                return new Response(JSON.stringify({ error: 'Configuration error' }), { status: 400 })
            }

            try {
                event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
            } catch (err: any) {
                return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
            }
        }

        const response = new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

        const processingPromise = processEvent(event)

        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
            EdgeRuntime.waitUntil(processingPromise)
        }

        return response

    } catch (err) {
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
    }
})
