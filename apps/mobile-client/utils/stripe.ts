import { supabase } from './supabase';

export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

/**
 * Chama a Edge Function do Supabase para criar um PaymentIntent no Stripe.
 * A secret key NUNCA toca no app — fica apenas no servidor.
 * Retorna o `client_secret` para inicializar o Payment Sheet.
 */
export async function createPaymentIntent(orderId: string): Promise<string> {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) throw new Error('Usuário não autenticado.');

    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { order_id: orderId },
        headers: {
            Authorization: `Bearer ${session.access_token}`
        }
    });

    if (error) throw new Error(error.message ?? 'Erro ao criar pagamento.');
    if (data?.error) throw new Error(data.error);
    if (!data?.client_secret) throw new Error('Resposta inválida do servidor.');

    return data.client_secret as string;
}
