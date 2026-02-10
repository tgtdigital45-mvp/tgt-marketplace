import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../contexts/CompanyContext';
import { toast } from 'react-hot-toast';

interface UseSubscriptionReturn {
    currentPlan: 'starter' | 'pro' | 'agency';
    subscriptionStatus: string;
    loading: boolean;
    handleSubscribe: (priceId?: string) => Promise<void>;
    isLoadingSubscribe: boolean;
}

export const useSubscription = (): UseSubscriptionReturn => {
    const { company, refreshCompany } = useCompany();
    const [loading, setLoading] = useState(true);
    const [isLoadingSubscribe, setIsLoadingSubscribe] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<'starter' | 'pro' | 'agency'>('starter');
    const [subscriptionStatus, setSubscriptionStatus] = useState<string>('active');

    useEffect(() => {
        if (company) {
            setCurrentPlan(company.current_plan_tier || 'starter');
            setSubscriptionStatus(company.subscription_status || 'active');
            setLoading(false);
        }
    }, [company]);

    const handleSubscribe = async (priceId?: string) => {
        try {
            setIsLoadingSubscribe(true);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Você precisa estar logado para assinar.');
                return;
            }

            const { data, error } = await supabase.functions.invoke('manage-subscription', {
                body: { price_id: priceId },
            });

            if (error) throw error;

            if (data?.url) {
                window.location.href = data.url;
            } else {
                toast.error('Erro ao redirecionar para o pagamento.');
            }
        } catch (error: any) {
            console.error('Error handling subscription:', error);
            toast.error('Ocorreu um erro ao processar sua solicitação.');
        } finally {
            setIsLoadingSubscribe(false);
        }
    };

    return {
        currentPlan,
        subscriptionStatus,
        loading,
        handleSubscribe,
        isLoadingSubscribe
    };
};
