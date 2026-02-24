import { useState } from 'react';
import { supabase } from '@tgt/shared';

interface CheckoutOptions {
    order_id: string;
}

interface UseCheckoutReturn {
    isLoading: boolean;
    error: string | null;
    redirectToCheckout: (options: CheckoutOptions) => Promise<void>;
}

export const useCheckout = (): UseCheckoutReturn => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const redirectToCheckout = async ({ order_id }: CheckoutOptions) => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Invoke the Stripe Edge Function
            const { data, error: funcError } = await supabase.functions.invoke('create-checkout-session', {
                body: { order_id },
            });

            if (funcError) {
                // Try to parse error body if it exists
                const errorData = await funcError.context?.json?.();
                const errorMessage = errorData?.error || funcError.message || 'Failed to initiate checkout';
                throw new Error(errorMessage);
            }

            if (!data?.paymentUrl) {
                throw new Error('Invalid response from checkout service');
            }

            // 2. Redirect to Stripe Checkout
            window.location.href = data.paymentUrl;

        } catch (err: any) {
            console.error('Checkout error:', err);
            setError(err.message || 'An unexpected error occurred during checkout');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        redirectToCheckout,
    };
};
