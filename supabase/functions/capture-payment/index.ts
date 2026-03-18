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
            .select('id, buyer_id, stripe_payment_intent_id, status, payment_status, services(*, companies(profile_id))')
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

        // -- SPRINT 4 ROUTING --
        // Check if this is a split-payment (30/70 proposal flow)
        const { data: upfrontInstallment } = await supabase
            .from('order_installments')
            .select('*')
            .eq('order_id', order.id)
            .eq('phase', 'upfront')
            .eq('status', 'paid')
            .maybeSingle()

        if (upfrontInstallment) {
            // -- FLOW B: 30/70 SPLIT (CHARGE REMAINING 70%) --
            console.log(`[Escrow] Order ${order.id} is a split-payment (30/70). Charging final 70%...`)
            
            // fetch proposal data to know the exact final amount
            const { data: proposalMessage } = await supabase
                .from('messages')
                .select('id, metadata')
                .eq('order_id', order.id)
                .eq('type', 'proposal')
                .contains('metadata', { status: 'accepted' })
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()
                
            const finalAmount = proposalMessage?.metadata?.finalAmount
            if (!finalAmount) throw new Error('Could not calculate final amount from proposal.')
            
            const unitAmount = Math.round(finalAmount * 100)
            const totalProjRate = proposalMessage.metadata.platformFee / proposalMessage.metadata.totalValue
            const applicationFeeAmount = Math.round(unitAmount * totalProjRate)
            
            let paymentIntentId = upfrontInstallment.stripe_payment_intent_id;
            if (paymentIntentId.startsWith('cs_')) {
                const session = await stripe.checkout.sessions.retrieve(paymentIntentId)
                paymentIntentId = session.payment_intent as string
            }
            
            const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
            if (!pi.customer || !pi.payment_method) throw new Error('Cliente/Cartão não salvos para cobrar os 70%.')

            // Fetch seller Connect info
            const { data: companyData } = await supabase
                .from('companies')
                .select('stripe_account_id, commission_rate')
                .eq('profile_id', order.services.companies.profile_id)
                .single()

            let paymentData = {}
            if (companyData?.stripe_account_id) {
                paymentData = { transfer_group: order.id }
            }

            const finalPaymentIntent = await stripe.paymentIntents.create({
                amount: unitAmount,
                currency: 'brl',
                customer: pi.customer as string,
                payment_method: pi.payment_method as string,
                off_session: true,
                confirm: true,
                description: `Order #${order.id.slice(0, 8)} - Pagamento Final (70%)`,
                metadata: {
                    order_id: order.id,
                    buyer_id: order.buyer_id,
                    service_id: order.services.id,
                    application_fee_amount: applicationFeeAmount,
                    commission_rate: companyData?.commission_rate ?? 0.20,
                    seller_id: order.services.companies.profile_id,
                    proposal_id: proposalMessage.id,
                    payment_phase: 'final'
                },
                ...paymentData
            }, {
                idempotencyKey: `charge_final_${order.id}_${Date.now()}`
            })

            console.log(`[Escrow] Charged final 70%: PaymentIntent status ${finalPaymentIntent.status}`)
            
        } else {
            // -- FLOW A: 100% UPFRONT ESCROW (LEGACY) --
            // Capture the Stripe Payment Intent (Escrow Release)
            if (order.stripe_payment_intent_id) {
                try {
                    console.log(`[Escrow] Capturing payment intent ${order.stripe_payment_intent_id} for order ${order.id}...`)
                    await stripe.paymentIntents.capture(order.stripe_payment_intent_id)
                    console.log(`[Escrow] Payment intent captured successfully.`)
                } catch (stripeError: any) {
                    // Ignore error if it's already captured or similar non-fatal states
                    console.warn(`[Escrow] Stripe Capture warning/error: ${stripeError.message}`)
                }
            } else {
                console.log(`[Escrow] No stripe_payment_intent_id found for order ${order.id}, proceeding to complete logic.`)
            }
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
