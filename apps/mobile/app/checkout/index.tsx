import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '@/lib/supabase';
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

            // 1. Create order via RPC (SAGA)
            const { data: orderData, error: orderError } = await supabase.rpc('create_order_saga', {
                p_service_id: params.serviceId,
                p_package_tier: packageTier,
                p_seller_id: undefined, // Will be fetched inside RPC or we could pass it
                p_booking_date: params.selectedDate,
                p_booking_time: params.selectedTime
            });

            if (orderError) throw orderError;
            if (!orderData?.order_id) throw new Error('Falha ao criar pedido.');

            // 2. Call Edge Function to get PaymentIntent
            const { data: paymentSheetData, error: fetchError } = await supabase.functions.invoke('create-payment-intent', {
                body: { order_id: orderData.order_id }
            });

            if (fetchError || !paymentSheetData) throw new Error('Falha ao inicializar pagamento.');

            const { paymentIntent, ephemeralKey, customer } = paymentSheetData;

            // 3. Initialize Payment Sheet
            const { error } = await initPaymentSheet({
                merchantDisplayName: 'TGT Contratto',
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                paymentIntentClientSecret: paymentIntent,
                defaultBillingDetails: {
                    name: 'Cliente TGT',
                },
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
            <View className="flex-1 bg-brand-background justify-center items-center">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="text-brand-secondary mt-4">Preparando checkout seguro...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-brand-background">
            {/* Header */}
            <View className="bg-brand-primary px-6 pt-14 pb-5 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <ArrowLeft size={22} color="#ffffff" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Checkout</Text>
            </View>

            <ScrollView className="flex-1 p-6">
                {/* Reservation Summary */}
                <View className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
                    <Text className="text-brand-secondary text-xs font-bold uppercase tracking-wider mb-3">
                        Resumo do Agendamento
                    </Text>
                    <Text className="text-brand-primary text-lg font-bold mb-1">
                        {params.serviceTitle}
                    </Text>
                    <Text className="text-brand-secondary text-sm mb-4">
                        Prestador: {params.companyName}
                    </Text>

                    <View className="flex-row justify-between mb-2">
                        <Text className="text-brand-secondary text-sm">Data</Text>
                        <Text className="text-brand-primary font-semibold">{params.selectedDate}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-brand-secondary text-sm">Horário</Text>
                        <Text className="text-brand-primary font-semibold">{params.selectedTime}</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-brand-secondary text-sm">Duração</Text>
                        <Text className="text-brand-primary font-semibold">{params.durationMinutes} min</Text>
                    </View>
                </View>

                {/* Pricing */}
                <View className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
                    <View className="flex-row justify-between mb-3">
                        <Text className="text-brand-secondary text-base">Subtotal</Text>
                        <Text className="text-brand-primary font-bold text-base">
                            R$ {price.toFixed(2).replace('.', ',')}
                        </Text>
                    </View>
                    <View className="flex-row justify-between pt-3 border-t border-slate-100">
                        <Text className="text-brand-primary font-bold text-lg">Total a pagar</Text>
                        <Text className="text-brand-accent font-bold text-xl">
                            R$ {price.toFixed(2).replace('.', ',')}
                        </Text>
                    </View>
                </View>

                {/* Security Info */}
                <View className="flex-row items-start bg-slate-50 rounded-xl p-4 mb-10">
                    <ShieldCheck size={20} color="#10b981" />
                    <View className="ml-3 flex-1">
                        <Text className="text-brand-primary font-semibold text-sm">Pagamento Seguro</Text>
                        <Text className="text-brand-secondary text-xs">
                            Seus dados de pagamento são processados de forma criptografada pelo Stripe.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Footer Button */}
            <View className="p-6 pb-10 bg-white border-t border-slate-100">
                <TouchableOpacity
                    onPress={handlePay}
                    disabled={loading}
                    className={`flex-row items-center justify-center rounded-2xl py-4 shadow-md ${loading ? 'bg-slate-300' : 'bg-brand-accent'
                        }`}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <>
                            <CreditCard size={20} color="#ffffff" />
                            <Text className="text-white font-bold text-lg ml-2">Pagar com Cartão</Text>
                        </>
                    )}
                </TouchableOpacity>
                <View className="flex-row items-center justify-center mt-4">
                    <Info size={14} color="#94a3b8" />
                    <Text className="text-slate-400 text-xs ml-1 italic">
                        Powered by Stripe
                    </Text>
                </View>
            </View>
        </View>
    );
}
