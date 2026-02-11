// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

console.log('Manage Stripe Product Function Invoked')

serve(async (req) => {
    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Service Role needed for Database Triggers
        )

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const payload = await req.json()
        const { record, type } = payload // 'type' can be 'INSERT', 'UPDATE', 'DELETE'

        if (!record) throw new Error('No record provided')

        // Maps Service -> Product
        const productId = record.stripe_product_id
        const serviceId = record.id

        if (type === 'DELETE') {
            if (productId) {
                await stripe.products.update(productId, { active: false })
            }
            return new Response(JSON.stringify({ received: true }), { status: 200 })
        }

        const productData = {
            name: record.title,
            description: record.description ? record.description.slice(0, 500) : undefined, // Stripe limit
            metadata: {
                service_id: serviceId,
                company_id: record.company_id
            }
        }

        let stripeProduct;

        if (productId) {
            console.log(`Updating product: ${productId}`)
            stripeProduct = await stripe.products.update(productId, productData)
        } else {
            console.log(`Creating new product for service: ${serviceId}`)
            stripeProduct = await stripe.products.create(productData)

            // Save stripe_product_id back to DB
            await supabaseClient
                .from('services')
                .update({ stripe_product_id: stripeProduct.id })
                .eq('id', serviceId)
        }

        // Handle Price (Simple implementation: Update default price if price changed)
        // Note: Realistically, you'd create a new Price object and set it as default.
        if (record.price) {
            const unitAmount = Math.round(record.price * 100)
            // Check if we need to create a price
            // For simplicity in this MVP sync, we create a new price every time
            const price = await stripe.prices.create({
                product: stripeProduct.id,
                unit_amount: unitAmount,
                currency: 'brl',
            })

            await stripe.products.update(stripeProduct.id, {
                default_price: price.id
            })
        }

        return new Response(JSON.stringify({ success: true, product: stripeProduct.id }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Error syncing product:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
