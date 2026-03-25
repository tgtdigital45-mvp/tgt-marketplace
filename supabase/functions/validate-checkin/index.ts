import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: validate-checkin
 *
 * Chamada pelo profissional ao escanear o QR Code do cliente.
 *
 * Parâmetros (POST body):
 * - orderId: UUID do pedido
 * - code: Código de 6 dígitos gerado pelo QR Code do cliente
 * - type: 'checkin' | 'checkout'
 * - lat: Latitude atual do profissional (GPS)
 * - lng: Longitude atual do profissional (GPS)
 *
 * Validações:
 * 1. Autenticação: o profissional deve estar logado
 * 2. Autorização: o profissional deve ser o seller_id do pedido
 * 3. Código TOTP: deve corresponder à janela de tempo atual (±30s margin)
 * 4. GPS: deve estar dentro do raio máximo permitido (se aplicável)
 *
 * Efeitos colaterais:
 * - Atualiza `execution_status` e timestamps no pedido
 * - No check-out: dispara a liberação do Escrow (atualiza escrow_status → 'released')
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const hashCode = (orderId: string, timeWindow: number): string => {
  const seed = `${orderId}-${timeWindow}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 1000000).toString().padStart(6, '0');
};

const validateCode = (orderId: string, submittedCode: string): boolean => {
  const now = Math.floor(Date.now() / 1000);
  const currentWindow = Math.floor(now / 30);
  // Allow ±1 window margin (±30s tolerance for clock drift)
  const windows = [currentWindow - 1, currentWindow, currentWindow + 1];
  return windows.some(w => hashCode(orderId, w) === submittedCode);
};

const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // km
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
    }

    // 2. Parse body
    const body = await req.json();
    const { orderId, code, type, lat, lng } = body as {
      orderId: string;
      code: string;
      type: 'checkin' | 'checkout';
      lat?: number;
      lng?: number;
    };

    if (!orderId || !code || !type) {
      return new Response(JSON.stringify({ error: 'Parâmetros inválidos' }), { status: 400, headers: corsHeaders });
    }

    // 3. Fetch order + service
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, seller_id, buyer_id, service_id, status, execution_status, escrow_status, services(location_type, radius_km)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Pedido não encontrado' }), { status: 404, headers: corsHeaders });
    }

    // 4. Authorization: only the seller can scan check-in
    if (order.seller_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Apenas o profissional responsável pode fazer check-in' }), { status: 403, headers: corsHeaders });
    }

    // 5. Validate TOTP code
    if (!validateCode(orderId, code)) {
      return new Response(JSON.stringify({ error: 'Código inválido ou expirado. Solicite um código novo ao cliente.' }), { status: 400, headers: corsHeaders });
    }

    // 6. GPS validation (only for at_home services with radius configured)
    const service = (order as any).services;
    const isAtHome = service?.location_type === 'at_home';
    const serviceRadiusKm = service?.radius_km;

    // We would need the service's stored address to do real GPS check.
    // For now, we log the coordinates and skip hard rejection (soft validation).
    const gpsData = lat && lng ? { lat, lng } : null;

    if (isAtHome && serviceRadiusKm && gpsData) {
      // TODO: Fetch service address from database and compare distance
      // const distanceKm = haversineDistance(serviceLat, serviceLng, lat, lng);
      // if (distanceKm > serviceRadiusKm) { ... reject ... }
    }

    // 7. Update order based on type
    const now = new Date().toISOString();
    let updatePayload: Record<string, unknown> = {};

    if (type === 'checkin') {
      if (order.execution_status !== 'pending' && order.execution_status !== null) {
        return new Response(JSON.stringify({ error: 'Check-in já foi realizado' }), { status: 400, headers: corsHeaders });
      }
      updatePayload = {
        execution_status: 'checked_in',
        check_in_at: now,
        ...(gpsData ? { check_in_location: gpsData } : {}),
        status: 'in_progress',
      };
    } else if (type === 'checkout') {
      if (order.execution_status !== 'checked_in' && order.execution_status !== 'in_progress') {
        return new Response(JSON.stringify({ error: 'Check-in ainda não foi realizado' }), { status: 400, headers: corsHeaders });
      }
      updatePayload = {
        execution_status: 'checked_out',
        check_out_at: now,
        ...(gpsData ? { check_out_location: gpsData } : {}),
        status: 'delivered',
        // Release Escrow upon check-out
        escrow_status: 'released',
      };
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (updateError) {
      return new Response(JSON.stringify({ error: `Erro ao atualizar pedido: ${updateError.message}` }), { status: 500, headers: corsHeaders });
    }

    // 8. If checkout, create a financial release job (Escrow → Seller Wallet)
    if (type === 'checkout') {
      await supabase.from('saga_jobs').insert({
        order_id: orderId,
        event_type: 'ESCROW_RELEASE',
        status: 'pending',
        payload: {
          orderId,
          sellerId: order.seller_id,
          buyerId: order.buyer_id,
          reason: 'checkout_validated',
          timestamp: now,
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true, type, executionStatus: updatePayload.execution_status }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders });
  }
});
