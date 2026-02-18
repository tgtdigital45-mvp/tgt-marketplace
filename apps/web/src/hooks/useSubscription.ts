import { useState } from 'react';
import { supabase } from '@tgt/shared';
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

    const subscribe = async (priceId: string, companyId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
                body: {
                    price_id: priceId,
                    success_url: getRedirectUrl(`/dashboard/empresa/${companyId}/assinatura?success=true`),
                    cancel_url: getRedirectUrl(`/dashboard/empresa/${companyId}/assinatura?canceled=true`),
                },
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            // Redirect to Stripe
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }

        } catch (err: any) {
            console.error('Subscription error:', err);
            const msg = err.message || 'Falha ao iniciar checkout.';
            setError(msg);
            addToast(msg, 'error');
            // Re-throw if you want the component to handle it too
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

        } catch (err: any) {
            console.error('Portal error:', err);
            const msg = err.message || 'Falha ao abrir portal de cobrança.';
            setError(msg);
            addToast(msg, 'error');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubscribe = async (priceId?: string) => {
        if (priceId && company?.id) {
            await subscribe(priceId, company.id);
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
