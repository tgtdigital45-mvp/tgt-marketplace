import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@tgt/shared';

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

    const isDisabled = loading || !description.trim();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={22} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        Pedir Orçamento
                    </Text>
                </View>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                    {params.serviceTitle} • {params.companyName}
                </Text>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 120 }}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Descreva sua necessidade *</Text>
                    <Text style={styles.cardSubtitle}>
                        Dê o máximo de detalhes possível para que a empresa possa lhe enviar um orçamento preciso.
                    </Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Ex: Preciso de um serviço específico devido à X..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View style={[styles.card, styles.cardMarginTop]}>
                    <Text style={styles.cardTitle}>Expectativa de Valor (Opcional)</Text>
                    <Text style={styles.cardSubtitle}>
                        Se você tiver um orçamento mensal ou total em mente.
                    </Text>
                    <View style={styles.currencyRow}>
                        <Text style={styles.currencyPrefix}>R$</Text>
                        <TextInput
                            style={styles.currencyInput}
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
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isDisabled}
                    style={[styles.submitButton, isDisabled ? styles.submitDisabled : styles.submitActive]}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
                    ) : (
                        <Send size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    )}
                    <Text style={styles.submitText}>
                        {loading ? 'Enviando...' : 'Enviar Solicitação'}
                    </Text>
                </TouchableOpacity>
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
    header: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    backButton: { marginRight: 12 },
    headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', flex: 1 },
    headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
    scroll: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
    card: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
    cardMarginTop: { marginTop: 16 },
    cardTitle: { fontWeight: 'bold', color: COLORS.primary, fontSize: 18, marginBottom: 8 },
    cardSubtitle: { color: COLORS.secondary, fontSize: 14, marginBottom: 16, lineHeight: 20 },
    textArea: {
        backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
        borderRadius: 12, padding: 16, color: COLORS.primary, height: 128,
        textAlignVertical: 'top', fontSize: 15,
    },
    currencyRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc',
        borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16,
    },
    currencyPrefix: { color: COLORS.secondary, fontWeight: 'bold', marginRight: 8 },
    currencyInput: { flex: 1, paddingVertical: 16, color: COLORS.primary, fontSize: 16 },
    footer: { backgroundColor: COLORS.surface, borderTopWidth: 1, borderColor: COLORS.border, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
    submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 16 },
    submitActive: { backgroundColor: COLORS.accent },
    submitDisabled: { backgroundColor: '#cbd5e1' },
    submitText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});
