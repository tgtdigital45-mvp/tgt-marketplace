import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    httpClient: Stripe.createFetchHttpClient(),
})

const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { record } = await req.json()

        // Se já tiver stripe_customer_id, não faz nada
        if (record.stripe_customer_id) {
            return new Response(JSON.stringify({ message: 'Customer already exists' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Criar Customer no Stripe
        const customer = await stripe.customers.create({
            email: record.email || undefined,
            name: `${record.first_name || ''} ${record.last_name || ''}`.trim() || undefined,
            metadata: {
                supabase_user_id: record.id,
            },
        })

        // Atualizar profile com o ID do Stripe
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: customer.id })
            .eq('id', record.id)

        if (updateError) throw updateError

        return new Response(JSON.stringify({ stripe_customer_id: customer.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
