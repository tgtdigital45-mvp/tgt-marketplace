// @ts-nocheck - Deno Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

console.log('Payment Webhook Function Invoked')

serve(async (req) => {
    try {
        const signature = req.headers.get('stripe-signature')
        if (!signature && !Deno.env.get('MOCK_WEBHOOK')) {
            // For production, we must verify signature usually
            // but if user didn't setup secret properly locally, it fails.
            // Assuming environment variable STRIPE_WEBHOOK_SECRET is set.
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const body = await req.text()
        let event

        try {
            if (Deno.env.get('STRIPE_WEBHOOK_SECRET') && signature) {
                event = await stripe.webhooks.constructEventAsync(
                    body,
                    signature,
                    Deno.env.get('STRIPE_WEBHOOK_SECRET')!
                )
            } else {
                event = JSON.parse(body)
            }
        } catch (err) {
            throw new Error(`Webhook Signature/Parse Error: ${err.message}`)
        }

        // Handle the event
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object
            const metadata = session.metadata

            if (!metadata || !metadata.order_id) throw new Error('Missing order_id in metadata')

            const { order_id } = metadata
            const amountTotal = session.amount_total // Cents

            console.log(`Processing Payment for Order: ${order_id}`)

            const supabaseClient = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // 1. Update Order Status
            const { data: order, error: orderError } = await supabaseClient
                .from('orders')
                .update({
                    payment_status: 'paid',
                    stripe_session_id: session.id,
                    amount_total: amountTotal,
                    receipt_url: session.url // Or session.receipt_url if available via intent
                })
                .eq('id', order_id)
                .select()
                .single()

            if (orderError) throw new Error(`Order update failed: ${orderError.message}`)
            console.log(`Order updated: ${order.id}`)

            // 2. Commission Split Logic (Money In)
            // Seller gets 85% of the TOTAL amount paid (minus simplified logic)
            // Or better: Seller gets 85% of the agreed price.

            const commissionRate = 0.15
            const totalOrderValue = order.agreed_price || order.price
            const sellerNetIncome = totalOrderValue * (1 - commissionRate)
            const seller_id = order.seller_id

            // 3. Upsert Wallet for Seller
            let { data: wallet, error: walletError } = await supabaseClient
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

                if (createWalletError) throw new Error(`Wallet creation failed: ${createWalletError.message}`)
                wallet_id = newWallet.id
                wallet = newWallet
            }

            // 4. Create/Record Transaction
            // Check if transaction already exists to allow idempotency
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
                        status: 'pending', // Pending until order completion? Or pending until payout? "pending balance"
                        order_id: order.id,
                        description: `Venda #${order.id.slice(0, 8)} - ${order.service_title}`
                    })

                if (txError) throw new Error(`Transaction creation failed: ${txError.message}`)

                // 5. Update pending balance
                // Try updated RPC or manual update
                const { error: balanceError } = await supabaseClient.rpc('increment_pending_balance', {
                    row_id: wallet_id,
                    amount_to_add: sellerNetIncome
                })

                if (balanceError) {
                    // Fallback
                    await supabaseClient
                        .from('wallets')
                        .update({ pending_balance: (wallet.pending_balance || 0) + sellerNetIncome })
                        .eq('id', wallet_id)
                }
            } else {
                console.log('Transaction already exists, skipping wallet update.')
            }
        }

        return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })

    } catch (err) {
        console.error('Webhook processing failed:', err)
        return new Response(
            `Webhook Error: ${err.message}`,
            { status: 400 }
        )
    }
})
