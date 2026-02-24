// @ts-nocheck - Deno Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Create Abacate Pay Checkout Function Invoked')

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

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
        if (userError || !user) throw new Error('Unauthorized')

        const { order_id } = await req.json()
        if (!order_id) throw new Error('Missing order_id')

        // 1. Fetch Order & Service Details
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select('*, services(*, companies(id, company_name, logo_url))')
            .eq('id', order_id)
            .single()

        if (orderError || !order) throw new Error('Order not found')
        const service = order.services
        const company = service.companies

        // 2. Fetch User Details for Abacate Pay (Metadata)
        // We use the auth user email and name recorded in profiles if available
        const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single()

        // 3. Prepare Abacate Pay Payload
        // Abacate Pay expects cents
        const unitAmount = Math.round((order.price || order.agreed_price || 0) * 100)
        const origin = req.headers.get('origin') || 'https://contratto.com.br'

        const apiKey = Deno.env.get('ABACATE_PAY_API_KEY')

        const payload = {
            frequency: 'ONE_TIME',
            methods: ['PIX', 'CARD'], // Contratto supports both
            products: [{
                externalId: service.id,
                name: service.title,
                description: `Pedido #${order.id.slice(0, 8)}`,
                amount: unitAmount,
                quantity: 1
            }],
            returnUrl: `${origin}/orders/${order.id}`,
            completionUrl: `${origin}/orders/${order.id}?paid=true`,
            customer: {
                name: profile?.full_name || user.email?.split('@')[0] || 'Cliente Contratto',
                email: user.email,
                cellphone: profile?.phone || '00999999999',
                taxId: profile?.tax_id || '000.000.000-00' // Placeholder if not in profile, Abacate needs 11 or 14 digits
            },
            externalId: order.id
        }

        console.log('Sending payload to Abacate Pay:', JSON.stringify(payload))

        // 4. Create Billing via Abacate Pay API
        const response = await fetch('https://api.abacatepay.com/v1/billing/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        const result = await response.json()

        if (result.error) {
            console.error('Abacate Pay API Error:', result.error)
            throw new Error(result.error)
        }

        // 5. Return the payment URL to the frontend
        return new Response(
            JSON.stringify({
                paymentUrl: result.data.url,
                id: result.data.id
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Checkout Error:', error)
        return new Response(
            JSON.stringify({
                error: error.message,
                details: error instanceof Error ? error.stack : String(error)
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
