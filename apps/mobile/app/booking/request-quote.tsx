import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function RequestQuoteScreen() {
    const params = useLocalSearchParams<{
        serviceId: string;
        serviceTitle: string;
        companyName: string;
    }>();

    const router = useRouter();
    const { user } = useAuth();

    const [description, setDescription] = useState('');
    const [budgetExpectation, setBudgetExpectation] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!user) {
            Alert.alert('Atenção', 'Você precisa estar logado para pedir um orçamento.');
            router.push('/(auth)/client-login');
            return;
        }

        if (!description.trim()) {
            Alert.alert('Atenção', 'Por favor, descreva o que você precisa.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('quotes').insert({
                user_id: user.id,
                service_id: params.serviceId,
                description: description.trim(),
                budget_expectation: budgetExpectation ? parseFloat(budgetExpectation.replace(',', '.')) : null,
                status: 'pending'
            });

            if (error) throw error;

            Alert.alert(
                'Sucesso',
                'Orçamento solicitado! A empresa entrará em contato em breve.',
                [
                    { text: 'OK', onPress: () => router.push('/(tabs)/orders') }
                ]
            );

        } catch (error: any) {
            console.error('Error requesting quote:', error);
            Alert.alert('Erro', error.message || 'Não foi possível solicitar o orçamento.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-brand-background">
            {/* Header */}
            <View className="bg-brand-primary px-6 pt-14 pb-5">
                <View className="flex-row items-center mb-3">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <ArrowLeft size={22} color="#ffffff" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold flex-1" numberOfLines={1}>
                        Pedir Orçamento
                    </Text>
                </View>
                <Text className="text-white/70 text-sm" numberOfLines={1}>
                    {params.serviceTitle} • {params.companyName}
                </Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 120 }}>
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <Text className="font-bold text-brand-primary text-lg mb-2">Descreva sua necessidade *</Text>
                    <Text className="text-brand-secondary text-sm mb-4">
                        Dê o máximo de detalhes possível para que a empresa possa lhe enviar um orçamento preciso.
                    </Text>
                    <TextInput
                        className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-brand-primary h-32 text-left"
                        placeholder="Ex: Preciso de um serviço específico devido à X..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mt-4">
                    <Text className="font-bold text-brand-primary text-lg mb-2">Expectativa de Valor (Opcional)</Text>
                    <Text className="text-brand-secondary text-sm mb-4">
                        Se você tiver um orçamento mensal ou total em mente.
                    </Text>
                    <View className="relative justify-center flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4">
                        <Text className="text-brand-secondary font-bold mr-2">R$</Text>
                        <TextInput
                            className="flex-1 py-4 text-brand-primary"
                            placeholder="0,00"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={budgetExpectation}
                            onChangeText={setBudgetExpectation}
                        />
                    </View>
                </View>
            </ScrollView>

            {/* Fixed Bottom CTA */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 pb-8">
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading || !description.trim()}
                    className={`rounded-xl py-4 items-center shadow-md flex-row justify-center ${loading || !description.trim() ? 'bg-slate-300' : 'bg-brand-accent'}`}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" className="mr-2" />
                    ) : (
                        <Send size={20} color="#ffffff" className="mr-2" />
                    )}
                    <Text className="text-white font-bold text-base">
                        {loading ? 'Enviando...' : 'Enviar Solicitação'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
