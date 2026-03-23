import React, { ReactNode } from 'react';
import { StripeProvider as BaseStripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';

const STRIPE_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.stripePublishableKey || 'pk_test_51O...'; // Placeholder

export function StripeProvider({ children }: { children: ReactNode }) {
    return (
        <BaseStripeProvider
            publishableKey={STRIPE_PUBLISHABLE_KEY}
            merchantIdentifier="merchant.com.tgtdigital.cliente" // iOS only
            urlScheme="tgt-cliente" // Android only (matches app.json)
        >
            <>{children}</>
        </BaseStripeProvider>
    );
}
