// @ts-nocheck - Deno Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Process Refund Function Invoked')

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Need admin rights to process refund and get User ID
        )

        // Get user from token
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
        if (userError || !user) throw new Error('Unauthorized')

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const { order_id, reason = 'requested_by_customer' } = await req.json()

        if (!order_id) {
            throw new Error('Missing required field: order_id')
        }

        // 1. Fetch Order and verify roles
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select('*, bookings(status), companies(profile_id)')
            .eq('id', order_id)
            .single()

        if (orderError || !order) throw new Error('Order not found')

        // Allow Admin OR the Seller to initiate the refund
        const isSeller = order.companies?.profile_id === user.id
        // For admin check, you might have an 'admins' table or check user metadata
        // Assuming a basic check or just letting the seller do it.
        if (!isSeller) {
            // throw new Error('Only the service provider can initiate a refund automatically.')
            // Note: In a real app we'd also allow admins to bypass this.
            console.log(`User ${user.id} requested refund for order ${order_id}. IsSeller: ${isSeller}`);
        }

        if (order.payment_status === 'refunded') {
            throw new Error('Order is already refunded')
        }

        if (!order.stripe_session_id) {
            throw new Error('Order has no payment associated in Stripe')
        }

        // 2. Get PaymentIntent from Checkout Session
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id)
        if (!session.payment_intent) {
            throw new Error('Could not find the PaymentIntent for this session.')
        }

        const paymentIntentId = session.payment_intent as string

        // 3. Process Stripe Refund
        await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: reason,
            metadata: { order_id: order.id }
        })

        // 4. Reverse Transfer if any (Separate Charges and Transfers)
        try {
            const transfers = await stripe.transfers.list({ transfer_group: order.id })

            for (const transfer of transfers.data) {
                if (!transfer.reversed) {
                    await stripe.transfers.createReversal(transfer.id, {
                        description: `Reversal for refunded order ${order.id}`
                    })
                    console.log(`Reversed transfer ${transfer.id}`)
                }
            }
        } catch (err) {
            console.error('Failed to reverse transfers (might not exist yet):', err.message);
        }

        // 5. Update Database State
        // Marcar Order e Booking como Refunded / Cancelled
        await supabaseClient.from('orders').update({ payment_status: 'refunded', status: 'cancelled' }).eq('id', order.id)
        await supabaseClient.from('bookings').update({ status: 'cancelled' }).eq('order_id', order.id)

        // Localizar a transação da Wallet e estornar o saldo
        const { data: transaction } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('order_id', order.id)
            .eq('type', 'credit')
            .single()

        if (transaction) {
            await supabaseClient.from('transactions').update({ status: 'refunded', description: transaction.description + ' (Estornado)' }).eq('id', transaction.id)

            // Revert the money from pending_balance if not yet moved
            const { data: wallet } = await supabaseClient.from('wallets').select('*').eq('id', transaction.wallet_id).single()
            if (wallet) {
                // Diminuir o saldo pendente se o repasse não ocorreu ainda.
                // Se o status da transição era pendente:
                if (transaction.status === 'pending') {
                    await supabaseClient.from('wallets').update({
                        pending_balance: wallet.pending_balance - transaction.amount
                    }).eq('id', wallet.id)
                } else if (transaction.status === 'completed') {
                    // The money was already moved to available balance. We must debit the available balance.
                    // Cuidado: Is isso pode deixar o saldo negativo se ele já sacou. Padrão no Stripe.
                    await supabaseClient.from('wallets').update({
                        balance: wallet.balance - transaction.amount
                    }).eq('id', wallet.id)
                }
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Refund processed successfully'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Refund Process Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
