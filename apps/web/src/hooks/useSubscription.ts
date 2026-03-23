import { useState } from 'react';
import { supabase } from '@tgt/core';
import { useToast } from '@/contexts/ToastContext';
import { useCompany } from '@/contexts/CompanyContext';

// Helper to get the current window origin for redirects
const getRedirectUrl = (path: string) => {
    return `${window.location.origin}${path}`;
};

export const useSubscription = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();
    const { company } = useCompany();

    const subscribe = async (priceId: string, companyId: string, isMonthly: boolean = true) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;
            // Pegando a URL via import.meta.env
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
            const url = `${supabaseUrl}/functions/v1/create-subscription-checkout`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    price_id: priceId,
                    is_monthly: isMonthly,
                    success_url: getRedirectUrl(`/dashboard/empresa/${companyId}/assinatura?success=true`),
                    cancel_url: getRedirectUrl(`/dashboard/empresa/${companyId}/assinatura?canceled=true`),
                }),
            });

            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                console.error("Supabase Edge Function falhou com 400:", responseData);
                throw new Error(responseData.error || `Erro HTTP ${response.status}`);
            }

            const data = responseData;

            // Redirect to Stripe
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Falha ao iniciar checkout.';
            console.error('Subscription error:', err);
            setError(msg);
            addToast(msg, 'error');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const manageSubscription = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.functions.invoke('create-portal-session', {
                body: {
                    return_url: window.location.href,
                },
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No portal URL returned');
            }

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Falha ao abrir portal de cobrança.';
            console.error('Portal error:', err);
            setError(msg);
            addToast(msg, 'error');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubscribe = async (priceId?: string, isMonthly: boolean = true) => {
        if (priceId && company?.id) {
            await subscribe(priceId, company.id, isMonthly);
        } else {
            await manageSubscription();
        }
    };

    return {
        subscribe,
        manageSubscription,
        handleSubscribe,
        isLoadingSubscribe: isLoading,
        currentPlan: company?.current_plan_tier,
        error
    };
};
