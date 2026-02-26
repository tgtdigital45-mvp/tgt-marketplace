// @ts-nocheck - Deno Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

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

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        })

        const { company_id, return_url, refresh_url } = await req.json()
        if (!company_id) throw new Error('Missing company_id')

        // 1. Fetch company and verify ownership
        const { data: company, error: companyError } = await supabaseClient
            .from('companies')
            .select('*')
            .eq('id', company_id)
            .single()

        if (companyError || !company) throw new Error('Company not found')
        if (company.owner_id !== user.id && company.profile_id !== user.id) {
            throw new Error('Unauthorized ownership')
        }

        let stripeAccountId = company.stripe_account_id

        // 2. Create Stripe Connect Account if doesn't exist
        if (!stripeAccountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                country: 'BR',
                email: user.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: 'individual',
                metadata: {
                    company_id: company.id,
                },
            })
            stripeAccountId = account.id

            // Update company with the new account ID
            await supabaseClient
                .from('companies')
                .update({ stripe_account_id: stripeAccountId })
                .eq('id', company.id)
        }

        // 3. Create Account Link for Onboarding
        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: refresh_url || return_url,
            return_url: return_url,
            type: 'account_onboarding',
        })

        return new Response(
            JSON.stringify({ url: accountLink.url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Connect Onboarding Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
