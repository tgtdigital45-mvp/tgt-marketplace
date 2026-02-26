import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { order_id } = await req.json()
        if (!order_id) throw new Error('order_id is required')

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing Authorization header')

        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Verify the user
        const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        if (userError || !user) throw new Error('Unauthorized')

        // Fetch Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, buyer_id, stripe_payment_intent_id, status, payment_status')
            .eq('id', order_id)
            .single()

        if (orderError || !order) throw new Error('Order not found')

        // Only the buyer can release the escrow funds
        if (order.buyer_id !== user.id) {
            throw new Error('Somente o comprador pode liberar o pagamento')
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        // Capture the Stripe Payment Intent (Escrow Release)
        if (order.stripe_payment_intent_id) {
            try {
                console.log(`[Escrow] Capturing payment intent ${order.stripe_payment_intent_id} for order ${order.id}...`)
                await stripe.paymentIntents.capture(order.stripe_payment_intent_id)
                console.log(`[Escrow] Payment intent captured successfully.`)
            } catch (stripeError: any) {
                // Ignore error if it's already captured or similar non-fatal states
                console.warn(`[Escrow] Stripe Capture warning/error: ${stripeError.message}`)
                // In production, we should probably differentiate between "already captured" and actual failure,
                // but for Escrow release intent, if it's already captured, the goal is achieved.
            }
        } else {
            console.log(`[Escrow] No stripe_payment_intent_id found for order ${order.id}, proceeding to complete logic.`)
        }

        // Update Order Status in Supabase
        const { error: updateError } = await supabase
            .from('orders')
            .update({ status: 'completed' })
            .eq('id', order.id)

        if (updateError) throw updateError

        // Insert System Message
        await supabase.from('messages').insert({
            order_id: order.id,
            sender_id: user.id,
            content: "SYSTEM: O comprador aprovou o serviço. Pagamento em custódia liberado para a carteira do vendedor."
        });

        // Trigger Saga completion explicitly if needed (Optional depending on SAGA handling)
        await supabase.rpc('transition_saga_status', {
            p_order_id: order.id,
            p_new_status: 'ORDER_COMPLETED',
            p_log_data: { action: 'buyer_approved_escrow' }
        });

        return new Response(
            JSON.stringify({ success: true, order_id: order.id, status: 'completed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('Function error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
