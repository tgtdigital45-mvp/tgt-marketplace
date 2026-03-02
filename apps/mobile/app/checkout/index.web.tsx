/**
 * Web stub for CheckoutScreen.
 * @stripe/stripe-react-native is native-only — useStripe() is not available on web.
 * This file is automatically picked by Metro on platform=web.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function CheckoutScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Checkout não disponível</Text>
            <Text style={styles.message}>
                O processo de pagamento está disponível apenas no aplicativo mobile (iOS/Android).
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        color: '#94a3b8',
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    button: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
    },
});
