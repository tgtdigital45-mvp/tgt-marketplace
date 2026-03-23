/**
 * Web stub for StripeProvider.
 * @stripe/stripe-react-native is native-only and not available on web.
 * This file is automatically used by Metro/Expo on `platform=web` builds
 * via the platform-specific extension resolution (.web.tsx > .tsx).
 */
import React, { ReactNode } from 'react';

export function StripeProvider({ children }: { children: ReactNode }) {
    // On web, Stripe React Native is not available.
    // Payments on web are handled separately (e.g., Stripe.js / Elements).
    return <>{children}</>;
}
