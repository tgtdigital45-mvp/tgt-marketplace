import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../utils/supabase';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../../utils/theme';
import { isValidDocument, formatCPFCNPJ } from '../../../utils/validators';
import FadeInView from '../../../components/ui/FadeInView';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { logger } from '../../../utils/logger';

type ProviderOnboardingProps = {
    userId: string;
    onComplete: () => void;
};

export default function ProviderOnboarding({ userId, onComplete }: ProviderOnboardingProps) {
    const [step, setStep] = useState(1);
    const [businessName, setBusinessName] = useState('');
    const [documentId, setDocumentId] = useState('');
    const [description, setDescription] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleDocumentChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 14) {
            setDocumentId(formatCPFCNPJ(cleaned));
        }
        if (errorMsg) setErrorMsg('');
    };

    const nextStep = () => {
        if (step === 1) {
            if (!businessName.trim() || !documentId.trim()) {
                setErrorMsg('Preencha os campos obrigatórios.');
                return;
            }
            const cleanedDoc = documentId.replace(/\D/g, '');
            if (!isValidDocument(cleanedDoc)) {
                setErrorMsg('CPF ou CNPJ inválido.');
                return;
            }
        }
        if (step === 2 && !description.trim()) {
            setErrorMsg('Conte um pouco sobre seu negócio.');
            return;
        }
        setErrorMsg('');
        setStep(prev => prev + 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const prevStep = () => {
        setStep(prev => prev - 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleCreateCompany = async () => {
        if (!city.trim() || !state.trim()) {
            setErrorMsg('Cidade e Estado são obrigatórios.');
            return;
        }

        const cleanedDoc = documentId.replace(/\D/g, '');
        setLoading(true);
        setErrorMsg('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const { error } = await supabase.from('companies').insert({
                profile_id: userId,
                company_name: businessName.trim(),
                document_id: cleanedDoc,
                description: description.trim() || null,
                city: city.trim(),
                state: state.trim().toUpperCase(),
                is_public: true
            });

            if (error) {
                logger.error('Error creating company:', error);
                setErrorMsg('Erro ao cadastrar. Tente novamente.');
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onComplete();
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Ocorreu um erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <FadeInView key="step1" delay={100} translateY={20}>
            <View style={styles.formCard}>
                <Text style={styles.stepTitle}>Dados Básicos</Text>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nome Fantasia ou Seu Nome</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="business-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={businessName}
                            onChangeText={setBusinessName}
                            placeholder="Ex: Pedro Reformas"
                            placeholderTextColor={Colors.textTertiary}
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Documento (CPF ou CNPJ)</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="card-outline" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={documentId}
                            onChangeText={handleDocumentChange}
                            placeholder="000.000.000-00"
                            keyboardType="numeric"
                            placeholderTextColor={Colors.textTertiary}
                            maxLength={18}
                        />
                    </View>
                </View>
            </View>
        </FadeInView>
    );

    const renderStep2 = () => (
        <FadeInView key="step2" delay={100} translateY={20}>
            <View style={styles.formCard}>
                <Text style={styles.stepTitle}>Sobre seu Negócio</Text>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Conte aos clientes por que escolher você</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Ex: Sou profissional há 10 anos, especialista em..."
                        placeholderTextColor={Colors.textTertiary}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                    />
                </View>
            </View>
        </FadeInView>
    );

    const renderStep3 = () => (
        <FadeInView key="step3" delay={100} translateY={20}>
            <View style={styles.formCard}>
                <Text style={styles.stepTitle}>Onde você atua?</Text>
                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 2 }]}>
                        <Text style={styles.label}>Cidade</Text>
                        <TextInput
                            style={styles.inputSimple}
                            value={city}
                            onChangeText={setCity}
                            placeholder="Ex: São Paulo"
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.label}>UF</Text>
                        <TextInput
                            style={styles.inputSimple}
                            value={state}
                            onChangeText={text => setState(text.toUpperCase())}
                            placeholder="SP"
                            maxLength={2}
                            autoCapitalize="characters"
                        />
                    </View>
                </View>
            </View>
        </FadeInView>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.progressContainer}>
                        {[1, 2, 3].map(i => (
                            <View key={i} style={[styles.progressStep, step >= i && styles.progressStepActive]} />
                        ))}
                    </View>

                    <FadeInView delay={100} translateY={30}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Passo {step} de 3</Text>
                            <Text style={styles.subtitle}>
                                Vamos configurar seu perfil profissional.
                            </Text>
                        </View>
                    </FadeInView>

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}

                    {errorMsg ? (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={16} color={Colors.error} />
                            <Text style={styles.errorText}>{errorMsg}</Text>
                        </View>
                    ) : null}

                    <View style={styles.footer}>
                        {step > 1 && (
                            <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
                                <Text style={styles.backBtnText}>Voltar</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.button, { flex: 1 }, loading && styles.buttonDisabled]}
                            disabled={loading}
                            onPress={step < 3 ? nextStep : handleCreateCompany}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <>
                                    <Text style={styles.buttonText}>{step < 3 ? 'Continuar' : 'Finalizar'}</Text>
                                    <Ionicons name={step < 3 ? "arrow-forward" : "checkmark-circle"} size={18} color={Colors.white} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.surface },
    container: { flex: 1 },
    scrollContent: { padding: Spacing.lg, paddingBottom: 60 },

    progressContainer: { flexDirection: 'row', gap: 8, marginBottom: 32, marginTop: 10 },
    progressStep: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.borderLight },
    progressStepActive: { backgroundColor: Colors.primary },

    header: { alignItems: 'center', marginBottom: Spacing.xl },
    title: { ...Typography.h3, color: Colors.text, textAlign: 'center', marginBottom: 4, fontWeight: '900' },
    subtitle: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', fontWeight: '600' },

    formCard: { backgroundColor: Colors.white, borderRadius: 28, padding: 24, paddingVertical: 32, ...Shadows.md, borderWidth: 1, borderColor: Colors.borderLight },
    stepTitle: { ...Typography.h4, color: Colors.text, marginBottom: 24, fontWeight: '800' },
    inputGroup: { marginBottom: 20 },
    row: { flexDirection: 'row', gap: 12 },
    label: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '800', marginBottom: 8, paddingLeft: 4, textTransform: 'uppercase' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.borderLight, paddingHorizontal: 16 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, height: 56, fontSize: 16, fontWeight: '600', color: Colors.text },
    inputSimple: { height: 56, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.borderLight, paddingHorizontal: 16, fontSize: 16, fontWeight: '600', color: Colors.text },
    textArea: { height: 160, paddingTop: 16, paddingHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.borderLight },

    footer: { flexDirection: 'row', gap: 12, marginTop: 24 },
    backBtn: { paddingHorizontal: 24, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight },
    backBtnText: { ...Typography.buttonSmall, color: Colors.textSecondary },
    button: {
        backgroundColor: Colors.primary, height: 64,
        borderRadius: BorderRadius.lg, justifyContent: 'center',
        alignItems: 'center', ...Shadows.lg,
        flexDirection: 'row', gap: 10
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: Colors.white, fontSize: 16, fontWeight: '900' },

    errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF5F5', padding: 12, borderRadius: 12, marginTop: 20 },
    errorText: { color: Colors.error, fontSize: 13, fontWeight: '700', flex: 1 },
});
