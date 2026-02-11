// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

console.log('Manage Stripe Customer Function Invoked')

serve(async (req) => {
    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const payload = await req.json()
        const { record, type, table } = payload
        // Handles both 'profiles' (users) and 'companies' (if we treat companies as customers directly)
        // User asked for: "cadastra o cliente na tgt cadastrar como cliente no stripe tbm"
        // Usually this means the 'profiles' table.

        if (!record) throw new Error('No record provided')

        let email, name, metadata, userId, companyId;

        if (table === 'profiles') {
            email = record.email // Assuming profile has email. If not, we might need to fetch from auth.
            // Profiles usually has id, full_name, etc.
            // Wait, profiles is usually linked to auth.users. 
            // If profiles doesn't have email, we might need to fetch it.
            // Let's check if we can get email. If not, use ID as email placeholder or skip.
            name = record.full_name || record.username || 'Novo Usuário'
            userId = record.id
            metadata = { user_id: userId }
        } else if (table === 'companies') {
            // If companies are strictly sellers, they have Stripe Connect accounts.
            // If they are also buyers (subscription), they need a Customer object.
            // The prompt says "cadastra o cliente", implying the end-user (Buyer).
            // But also companies pay for subscription.
            // Let's handle both.
            name = record.company_name
            companyId = record.id
            metadata = { company_id: companyId }
            // Companies might not have email directly on them, usually on the owner.
        }

        // Check if customer already exists (we should store stripe_customer_id in the table)
        const existingStripeId = record.stripe_customer_id

        if (existingStripeId) {
            // Update logic if needed
            if (type === 'DELETE') {
                await stripe.customers.del(existingStripeId)
                return new Response(JSON.stringify({ deleted: true }), { status: 200 })
            }
            // Update
            await stripe.customers.update(existingStripeId, {
                name: name,
                email: email, // Might be undefined
                metadata: metadata
            })
        } else {
            // Create
            const customer = await stripe.customers.create({
                name: name,
                email: email,
                metadata: metadata
            })

            // Update DB with stripe_customer_id
            await supabaseClient
                .from(table) // 'profiles' or 'companies'
                .update({ stripe_customer_id: customer.id })
                .eq('id', record.id)
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Error syncing customer:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
