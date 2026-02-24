// @ts-nocheck - Deno Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as crypto from "https://deno.land/std@0.177.0/node/crypto.ts";

console.log('Abacate Pay Webhook Handler Invoked')

interface AbacateEvent {
    event: 'billing.paid' | 'withdraw.done' | 'withdraw.failed';
    data: {
        id: string;
        amount: number;
        status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
        externalId: string; // This corresponds to our order_id
    }
}

serve(async (req) => {
    try {
        const signature = req.headers.get('x-webhook-signature')
        const webhookSecret = Deno.env.get('ABACATE_PAY_WEBHOOK_SECRET')
        const body = await req.text()

        // 1. Verify Signature (Security)
        if (webhookSecret) {
            const hmac = crypto.createHmac('sha256', webhookSecret);
            hmac.update(body);
            const digest = hmac.digest('hex');

            if (digest !== signature) {
                console.error('Invalid signature digest:', digest, 'vs', signature)
                return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
            }
        }

        const payload: AbacateEvent = JSON.parse(body)
        console.log(`Processing Abacate Pay event: ${payload.event} for internal ID: ${payload.data.externalId}`)

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Handle Billing Paid
        if (payload.event === 'billing.paid') {
            const orderId = payload.data.externalId

            // Check if already processed (Idempotency)
            const { data: existingOrder } = await supabaseClient
                .from('orders')
                .select('payment_status')
                .eq('id', orderId)
                .single()

            if (existingOrder && existingOrder.payment_status === 'paid') {
                return new Response(JSON.stringify({ received: true, info: 'Already processed' }), { status: 200 })
            }

            // Update Order & Booking
            const { error: updateError } = await supabaseClient
                .from('orders')
                .update({
                    payment_status: 'paid',
                    external_payment_id: payload.data.id, // Storing Abacate Pay ID
                    paid_at: new Date().toISOString()
                })
                .eq('id', orderId)

            if (updateError) throw updateError

            await supabaseClient
                .from('bookings')
                .update({ status: 'confirmed' })
                .eq('order_id', orderId)

            // Transition SAGA to confirmed status
            await supabaseClient.rpc('transition_saga_status', {
                p_order_id: orderId,
                p_new_status: 'PAYMENT_CONFIRMED',
                p_log_data: { gateway: 'abacate_pay', billing_id: payload.data.id }
            })

            // Trigger order activation logic (similar to Stripe webhook)
            // Note: In a full implementation, we'd calculate splits here or via DB triggers
            await supabaseClient.rpc('transition_saga_status', {
                p_order_id: orderId,
                p_new_status: 'ORDER_ACTIVE',
                p_log_data: { source: 'abacate_webhook' }
            })
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Webhook processing failed:', error.message)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
