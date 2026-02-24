// @ts-nocheck - Deno Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

console.log('Cron Daily Jobs Function Invoked')

serve(async (req) => {
    try {
        // Only allow POST requests (Cron triggers)
        if (req.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 })
        }

        // Verify Auth: Allow only Service Role or Authorization Header Match
        // Assuming Supabase pg_cron sends a configured secret header, 
        // or we use the Anon key if it's securely triggered natively in Supabase Platform
        const authHeader = req.headers.get('Authorization')
        if (authHeader !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` && authHeader !== `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`) {
            console.warn('Unauthorized cron execution attempt');
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const results = {
            transfers_processed: 0,
            webhooks_reconciled: 0,
            errors: [] as any[]
        }

        // ============================================================================
        // 0. CLEANUP EXPIRED BOOKING LOCKS
        // ============================================================================
        console.log('Cleaning up expired booking locks...');
        await supabaseClient.rpc('cleanup_expired_booking_locks');

        // ============================================================================
        // 1. CLEAR PENDING TRANSFERS (7 DAYS RETENTION)
        // ============================================================================
        console.log('Starting 7-day retention payouts...');

        // Buscamos transações "pending" de crédito que passaram do prazo de disputa
        // Logicamente: bookings associados devem estar "completed" há > 7 dias
        // Para simplificar a query, fazemos em 2 passos. 

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const isoLimitDate = sevenDaysAgo.toISOString();

        // Pega as transactions e o booking
        const { data: pendingTx, error: txError } = await supabaseClient
            .from('transactions')
            .select(`
                id, amount, order_id, wallet_id,
                orders (
                    id, seller_id,
                    bookings (status, updated_at),
                    companies (stripe_account_id),
                    disputes (status)
                )
            `)
            .eq('type', 'credit')
            .eq('status', 'pending');

        if (txError) throw txError;

        for (const tx of pendingTx || []) {
            try {
                const booking = tx.orders?.bookings?.[0]; // Assumindo relação 1:1
                const sellerStripeAccount = tx.orders?.companies?.stripe_account_id;

                // Verifica se há alguma disputa aberta ou em revisão
                const hasOpenDispute = tx.orders?.disputes?.some(d => d.status === 'open' || d.status === 'in_review');

                // Se o serviço foi concluído há mais de 7 dias e NÃO tem disputa aberta
                if (!hasOpenDispute && booking?.status === 'completed' && booking.updated_at < isoLimitDate) {

                    if (sellerStripeAccount) {
                        // Faz a Transferência usando o Stripe Connect (Separate Charges)
                        const transfer = await stripe.transfers.create({
                            amount: Math.round(tx.amount * 100),
                            currency: 'brl',
                            destination: sellerStripeAccount,
                            transfer_group: tx.order_id
                        });
                        console.log(`Transfer ${transfer.id} to ${sellerStripeAccount} for order ${tx.order_id}`);
                    }

                    // Se não tiver conta Stripe, o dinheiro vai pro saldo "Available" padrão da Wallet

                    // Update Transaction to "completed"
                    await supabaseClient.from('transactions').update({ status: 'completed' }).eq('id', tx.id);

                    // Move Balance from Pending to Available
                    // Diminui pending_balance e aumenta balance
                    await supabaseClient.rpc('settle_pending_balance', {
                        p_wallet_id: tx.wallet_id,
                        p_amount: tx.amount
                    });

                    results.transfers_processed++;
                }

            } catch (err) {
                console.error(`Error processing tx ${tx.id}:`, err);
                results.errors.push({ type: 'transfer', tx_id: tx.id, message: err.message });
            }
        }

        // ============================================================================
        // 2. RECONCILE FAILED WEBHOOKS (SILENT FAILURES)
        // ============================================================================
        console.log('Starting Webhook Reconciliation...');

        // Orders created > 1 hour ago but still "pending" payment
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const { data: pendingOrders, error: poError } = await supabaseClient
            .from('orders')
            .select('id, stripe_session_id, payment_status')
            .eq('payment_status', 'pending')
            .lt('created_at', oneHourAgo.toISOString());

        if (poError) throw poError;

        for (const order of pendingOrders || []) {
            if (!order.stripe_session_id) continue;

            try {
                // Verify session status on Stripe
                const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);

                if (session.payment_status === 'paid') {
                    console.log(`Reconciling order ${order.id}. Marking as PAID.`);
                    // Fallback to "handle-payment-webhook" logic (Triggering transition)

                    // Force update DB
                    await supabaseClient.from('orders').update({
                        payment_status: 'paid',
                        amount_total: session.amount_total
                    }).eq('id', order.id);

                    await supabaseClient.from('bookings').update({ status: 'confirmed' }).eq('order_id', order.id);

                    results.webhooks_reconciled++;
                } else if (session.status === 'expired') {
                    await supabaseClient.from('orders').update({
                        payment_status: 'failed'
                    }).eq('id', order.id);
                }

            } catch (err) {
                console.error(`Error reconciling order ${order.id}:`, err);
                results.errors.push({ type: 'reconciliation', order_id: order.id, message: err.message });
            }
        }

        // ============================================================================
        // 3. AUTO-APPROVE DELIVERED ORDERS (3 DAYS INACTIVITY)
        // ============================================================================
        console.log('Starting Auto-Approval for delivered orders...');
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const isoThreeDaysAgo = threeDaysAgo.toISOString();

        const { data: deliveredOrders, error: dError } = await supabaseClient
            .from('orders')
            .select('id')
            .eq('status', 'delivered')
            .lt('updated_at', isoThreeDaysAgo);

        if (dError) throw dError;

        for (const order of deliveredOrders || []) {
            try {
                console.log(`Auto-approving order ${order.id}...`);
                // Update Order to "completed"
                await supabaseClient.from('orders').update({ status: 'completed' }).eq('id', order.id);
                // Update corresponding booking
                await supabaseClient.from('bookings').update({ status: 'completed' }).eq('order_id', order.id);

                // Note: The settlement will be handled by the next cron run (Retention logic in step 1)
            } catch (err) {
                console.error(`Error auto-approving order ${order.id}:`, err);
                results.errors.push({ type: 'auto-approval', order_id: order.id, message: err.message });
            }
        }

        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (err) {
        console.error('Cron Error:', err)
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})
