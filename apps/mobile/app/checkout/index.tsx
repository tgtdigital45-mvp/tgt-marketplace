import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '@tgt/shared';
import { ArrowLeft, CreditCard, ShieldCheck, Info } from 'lucide-react-native';

export default function CheckoutScreen() {
    const params = useLocalSearchParams<{
        serviceId: string;
        serviceTitle: string;
        servicePrice: string;
        companyName: string;
        durationMinutes: string;
        selectedDate: string;
        selectedTime: string;
        packageTier?: string;
    }>();

    const router = useRouter();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);

    const price = parseFloat(params.servicePrice || '0');
    const packageTier = params.packageTier || 'basic';

    useEffect(() => {
        initializePaymentSheet();
    }, []);

    const initializePaymentSheet = async () => {
        try {
            setInitializing(true);

            const { data: orderData, error: orderError } = await supabase.rpc('create_order_saga', {
                p_service_id: params.serviceId,
                p_package_tier: packageTier,
                p_seller_id: undefined,
                p_booking_date: params.selectedDate,
                p_booking_time: params.selectedTime
            });

            if (orderError) throw orderError;
            if (!orderData?.order_id) throw new Error('Falha ao criar pedido.');

            const { data: paymentSheetData, error: fetchError } = await supabase.functions.invoke('create-payment-intent', {
                body: { order_id: orderData.order_id }
            });

            if (fetchError || !paymentSheetData) throw new Error('Falha ao inicializar pagamento.');

            const { paymentIntent, ephemeralKey, customer } = paymentSheetData;

            const { error } = await initPaymentSheet({
                merchantDisplayName: 'TGT Contratto',
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                paymentIntentClientSecret: paymentIntent,
                defaultBillingDetails: { name: 'Cliente TGT' },
                allowsDelayedPaymentMethods: false,
                returnURL: 'tgt-cliente://stripe-redirect',
            });

            if (error) throw error;

        } catch (e: any) {
            console.error('Checkout Init Error:', e);
            Alert.alert('Erro', e.message || 'Não foi possível carregar o checkout.');
            router.back();
        } finally {
            setInitializing(false);
        }
    };

    const handlePay = async () => {
        setLoading(true);
        const { error } = await presentPaymentSheet();

        if (error) {
            if (error.code !== 'Canceled') {
                Alert.alert(`Erro no pagamento: ${error.code}`, error.message);
            }
            setLoading(false);
        } else {
            Alert.alert('Sucesso!', 'Seu pagamento foi confirmado com sucesso.', [
                { text: 'Ir para meus pedidos', onPress: () => router.replace('/(tabs)/orders') }
            ]);
        }
    };

    if (initializing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Preparando checkout seguro...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={22} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
            </View>

            <ScrollView style={styles.scroll}>
                {/* Reservation Summary */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Resumo do Agendamento</Text>
                    <Text style={styles.serviceTitle}>{params.serviceTitle}</Text>
                    <Text style={styles.companyText}>Prestador: {params.companyName}</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Data</Text>
                        <Text style={styles.detailValue}>{params.selectedDate}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Horário</Text>
                        <Text style={styles.detailValue}>{params.selectedTime}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Duração</Text>
                        <Text style={styles.detailValue}>{params.durationMinutes} min</Text>
                    </View>
                </View>

                {/* Pricing */}
                <View style={[styles.card, styles.cardMargin]}>
                    <View style={styles.detailRow}>
                        <Text style={styles.priceLabel}>Subtotal</Text>
                        <Text style={styles.priceValue}>R$ {price.toFixed(2).replace('.', ',')}</Text>
                    </View>
                    <View style={[styles.detailRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total a pagar</Text>
                        <Text style={styles.totalValue}>R$ {price.toFixed(2).replace('.', ',')}</Text>
                    </View>
                </View>

                {/* Security */}
                <View style={styles.securityCard}>
                    <ShieldCheck size={20} color="#10b981" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={styles.securityTitle}>Pagamento Seguro</Text>
                        <Text style={styles.securityText}>
                            Seus dados de pagamento são processados de forma criptografada pelo Stripe.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handlePay}
                    disabled={loading}
                    style={[styles.payButton, loading ? styles.payDisabled : styles.payActive]}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <>
                            <CreditCard size={20} color="#ffffff" />
                            <Text style={styles.payText}>Pagar com Cartão</Text>
                        </>
                    )}
                </TouchableOpacity>
                <View style={styles.poweredRow}>
                    <Info size={14} color="#94a3b8" />
                    <Text style={styles.poweredText}>Powered by Stripe</Text>
                </View>
            </View>
        </View>
    );
}

const COLORS = {
    primary: '#0f172a',
    secondary: '#475569',
    accent: '#2563eb',
    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: COLORS.secondary, marginTop: 16 },
    header: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 20, flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 12 },
    headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
    scroll: { flex: 1, padding: 24 },
    card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border },
    cardMargin: { marginTop: 24 },
    cardLabel: { color: COLORS.secondary, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    serviceTitle: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    companyText: { color: COLORS.secondary, fontSize: 14, marginBottom: 16 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    detailLabel: { color: COLORS.secondary, fontSize: 14 },
    detailValue: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
    priceLabel: { color: COLORS.secondary, fontSize: 16 },
    priceValue: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
    totalRow: { borderTopWidth: 1, borderColor: COLORS.border, paddingTop: 12, marginTop: 4 },
    totalLabel: { color: COLORS.primary, fontWeight: 'bold', fontSize: 18 },
    totalValue: { color: COLORS.accent, fontWeight: 'bold', fontSize: 20 },
    securityCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, marginTop: 24, marginBottom: 40 },
    securityTitle: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
    securityText: { color: COLORS.secondary, fontSize: 12, marginTop: 2 },
    footer: { backgroundColor: COLORS.surface, borderTopWidth: 1, borderColor: COLORS.border, padding: 24, paddingBottom: 40 },
    payButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 18, gap: 8 },
    payActive: { backgroundColor: COLORS.accent },
    payDisabled: { backgroundColor: '#cbd5e1' },
    payText: { color: '#ffffff', fontWeight: 'bold', fontSize: 18 },
    poweredRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 4 },
    poweredText: { color: '#94a3b8', fontSize: 12, fontStyle: 'italic' },
});
