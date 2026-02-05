// @ts-nocheck - Deno Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Request Payout Function Invoked')

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { amount, user_id } = await req.json()

        if (!amount || amount <= 0 || !user_id) {
            throw new Error('Invalid amount or user_id')
        }

        // 1. Fetch Wallet and Verify Balance
        const { data: wallet, error: walletError } = await supabaseClient
            .from('wallets')
            .select('*')
            .eq('user_id', user_id)
            .single()

        if (walletError || !wallet) throw new Error('Wallet not found')

        if (wallet.balance < amount) {
            throw new Error(`Insufficient funds. Available: ${wallet.balance}, Requested: ${amount}`)
        }

        // 2. Process Payout (Transactional Logic)
        // Ideally should be a transaction but Supabase-js doesn't support complex transactions easily in client
        // We will do: Decrement Balance -> Insert Payout -> Insert Transaction
        // If one fails, we might have inconsistency. For MVP we proceed sequentially 
        // OR better: use an RPC `process_payout_request` if we want atomicity.
        // Let's stick to sequential with checks for MVP or use RPC if simple. I'll use RPC for safety.

        const { data, error: rpcError } = await supabaseClient.rpc('process_payout_request', {
            p_wallet_id: wallet.id,
            p_amount: amount
        })

        if (rpcError) throw new Error(rpcError.message)

        return new Response(
            JSON.stringify({ success: true, message: 'Payout requested successfully' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Payout Request Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
