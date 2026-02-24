// @ts-nocheck - Deno Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

// ============================================================================
// STRUCTURED LOGGING HELPER
// ============================================================================
interface LogContext {
    company_id?: string
    order_id?: string
    error?: string
    [key: string]: any
}

function logStructured(level: 'info' | 'warn' | 'error', message: string, context: LogContext = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context
    }

    if (level === 'error') {
        console.error(JSON.stringify(logEntry))
    } else {
        console.log(JSON.stringify(logEntry))
    }
}

// ============================================================================
// HOURLY JOB
// ============================================================================
serve(async (req) => {
    // Basic security: only accept POST (though pg_cron sends POST)
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';

        if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
            throw new Error('Missing environment variables');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });

        logStructured('info', 'Starting Hourly Auto-Refund check');

        // 1. Fetch pending bookings
        const { data: bookings, error: fetchError } = await supabase
            .from('bookings')
            .select(`
                id, 
                company_id, 
                booking_date,
                booking_time,
                status,
                proposal_expires_at,
                order_id,
                orders ( id, stripe_session_id, payment_status, escrow_status )
            `)
            .in('status', ['pending', 'pending_client_approval']);

        if (fetchError) {
            throw new Error(`Failed to fetch pending bookings: ${fetchError.message}`);
        }

        if (!bookings || bookings.length === 0) {
            logStructured('info', 'No pending bookings found');
            return new Response(JSON.stringify({ success: true, processed: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const now = new Date();
        const targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

        let processedCount = 0;

        for (const booking of bookings) {
            try {
                let isExpired = false;
                let shouldStrikeCompany = false;

                if (booking.status === 'pending') {
                    // Pending company approval - check 24h before booking date
                    const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
                    if (bookingDateTime <= targetTime) {
                        isExpired = true;
                        shouldStrikeCompany = true;
                    }
                } else if (booking.status === 'pending_client_approval') {
                    // Pending client approval - check if proposal expired
                    if (booking.proposal_expires_at) {
                        const proposalExpiresDateTime = new Date(booking.proposal_expires_at);
                        if (proposalExpiresDateTime <= now) {
                            isExpired = true;
                            shouldStrikeCompany = false; // Company proposed, client didn't respond
                        }
                    }
                }

                if (isExpired) {
                    logStructured('info', 'Processing expired booking', { booking_id: booking.id, company_id: booking.company_id, status: booking.status });

                    // A) Refund stripe if valid order with session
                    if (booking.orders && booking.orders.stripe_session_id) {
                        try {
                            const session = await stripe.checkout.sessions.retrieve(booking.orders.stripe_session_id);
                            if (session.payment_intent) {
                                await stripe.refunds.create({
                                    payment_intent: session.payment_intent as string,
                                    reason: 'requested_by_customer',
                                });
                                logStructured('info', 'Stripe refunded successfully', { order_id: booking.orders.id });
                            }
                        } catch (stripeErr: any) {
                            logStructured('error', 'Stripe refund failed', { order_id: booking.orders.id, error: stripeErr.message });
                            // Still proceed with cancellation to avoid stuck states, but manual review might be needed.
                        }
                    }

                    // B) Update Database (Booking & Order)
                    await supabase
                        .from('bookings')
                        .update({ status: 'cancelled' })
                        .eq('id', booking.id);

                    if (booking.order_id) {
                        await supabase
                            .from('orders')
                            .update({
                                status: 'cancelled',
                                escrow_status: 'refunded',
                                payment_status: 'refunded'
                            })
                            .eq('id', booking.order_id);
                    }

                    // C) Increment Strike Policy on Company
                    if (shouldStrikeCompany && booking.company_id) {
                        // Get current strikes
                        const { data: companyData } = await supabase
                            .from('companies')
                            .select('ignored_orders')
                            .eq('id', booking.company_id)
                            .single();

                        const currentStrikes = companyData?.ignored_orders || 0;
                        const newStrikes = currentStrikes + 1;
                        const isActive = newStrikes < 3; // Suspend if 3 or more strikes

                        await supabase
                            .from('companies')
                            .update({
                                ignored_orders: newStrikes,
                                is_active: isActive
                            })
                            .eq('id', booking.company_id);

                        logStructured(isActive ? 'info' : 'warn', 'Company strike recorded', {
                            company_id: booking.company_id,
                            ignored_orders: newStrikes,
                            is_active: isActive
                        });
                    }

                    processedCount++;
                }

            } catch (err: any) {
                logStructured('error', 'Error processing individual booking', { booking_id: booking.id, error: err.message });
            }
        }

        logStructured('info', 'Finished Hourly Auto-Refund check', { processedCount });

        return new Response(JSON.stringify({ success: true, processed: processedCount }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        logStructured('error', 'Edge Function Fatal Error', { error: err.message });
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
});
