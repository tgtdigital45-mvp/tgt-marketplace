import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

export default function AuthLayout() {
    const { session, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && session) {
            router.replace('/(tabs)');
        }
    }, [session, loading]);

    if (loading) return null;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="forgot-password" />
        </Stack>
    );
}
