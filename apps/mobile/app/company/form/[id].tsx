import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../utils/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadows, AnimationConfig } from '../../../utils/theme';
import { Skeleton } from '../../../components/ui/SkeletonLoader';
import FadeInView from '../../../components/ui/FadeInView';
import { logger } from '../../../utils/logger';

type formField = {
    id: string;
    title: string;
    required: boolean;
    type: 'text' | 'select';
    options?: string[];
};

const DEFAULT_QUESTIONS: formField[] = [
    { id: 'q1', type: 'text', title: 'Descreva de forma curta o que você precisa:', required: true },
    { id: 'q2', type: 'select', title: 'Qual a urgência do serviço?', required: true, options: ['Alta (O quanto antes)', 'Média (Próximos dias)', 'Baixa (Sem pressa)'] },
    { id: 'q3', type: 'text', title: 'Alguma observação, detalhe ou dúvida extra? (Opcional)', required: false }
];

export default function ServiceFormScreen() {
    const { id } = useLocalSearchParams<{ id: string }>(); // service_id
    const router = useRouter();
    const { session } = useAuth();

    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeQuestions, setActiveQuestions] = useState<formField[]>(DEFAULT_QUESTIONS);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function fetchServiceAndForm() {
            try {
                // Fetch service and form in parallel
                const [svcRes, formRes] = await Promise.all([
                    supabase
                        .from('services')
                        .select('id, company_id, price, title')
                        .eq('id', id)
                        .single(),
                    supabase
                        .from('service_forms')
                        .select('questions, is_required')
                        .eq('service_id', id)
                        .maybeSingle()
                ]);

                if (svcRes.error) throw svcRes.error;
                setService(svcRes.data);

                // If dynamic form exists and has questions
                if (formRes && formRes.data && formRes.data.questions && Array.isArray(formRes.data.questions) && formRes.data.questions.length > 0) {
                    const dynamicFields: formField[] = formRes.data.questions.map((q: string, idx: number) => ({
                        id: `dq_${idx}`,
                        title: q,
                        required: formRes.data?.is_required ?? true,
                        type: 'text' // Custom forms currently support text input
                    }));
                    setActiveQuestions(dynamicFields);
                }
            } catch (error) {
                logger.error('Error fetching service/form:', error);
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchServiceAndForm();
    }, [id]);

    const handleAnswer = (questionId: string, text: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: text }));
    };

    const handleSubmit = async () => {
        if (!session?.user.id || !service || submitting) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Validate required questions
        for (const q of activeQuestions) {
            if (q.required && !answers[q.id]) {
                Alert.alert("Atenção", `Por favor, responda a pergunta obrigatória: ${q.title}`);
                return;
            }
        }

        setSubmitting(true);

        try {
            // 1. Create the order
            const { data: orderData, error: orderError } = await supabase
                .from('service_orders')
                .insert({
                    client_id: session.user.id,
                    company_id: service.company_id,
                    service_id: id,
                    status: 'pending',
                    total_price: null
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Save structured answers to form_responses
            const { error: responseError } = await supabase
                .from('form_responses')
                .insert({
                    order_id: orderData.id,
                    answers: answers
                });

            if (responseError) logger.warn('Failed to save structured responses, but order was created:', responseError);

            // 3. Format Answers for Chat Message (Human readable summary)
            let messageContent = `**Nova Solicitação de Orçamento**\n\n`;
            activeQuestions.forEach(q => {
                if (answers[q.id]) {
                    messageContent += `**${q.title}**\n${answers[q.id]}\n\n`;
                }
            });

            // 4. Insert into 'messages'
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    order_id: orderData.id,
                    sender_id: session.user.id,
                    content: messageContent.trim(),
                    is_system_message: false
                });

            if (msgError) throw msgError;

            // Request Push Permission contextually after a successful budget request
            try {
                const { requestPushPermissionContextually } = await import('../../../utils/pushNotifications');
                await requestPushPermissionContextually(session.user.id);
            } catch (e) {
                logger.error('Failed to request push permissions after budget request', e);
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // 5. Success! Navigate directly to the newly created chat
            router.replace({ pathname: '/orders/chat', params: { orderId: orderData.id } });

        } catch (error) {
            logger.error('Submit Error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Erro", "Não foi possível enviar sua solicitação. Tente novamente.");
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} aria-label="Formulário">
                <View style={styles.navHeader}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <Skeleton width={180} height={20} />
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.scrollContent}>
                    <Skeleton width={200} height={32} style={{ marginBottom: 8 }} />
                    <Skeleton width="100%" height={40} style={{ marginBottom: 32 }} />
                    <Skeleton width="100%" height={150} borderRadius={16} style={{ marginBottom: 20 }} />
                    <Skeleton width="100%" height={150} borderRadius={16} />
                </View>
            </SafeAreaView>
        );
    }

    if (!service) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
                <Text style={styles.errorText}>Serviço não encontrado.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonFallback}>
                    <Text style={styles.backButtonFallbackText}>Voltar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']} aria-label="Formulário">
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.navHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Informações Iniciais</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <FadeInView translateY={20} delay={100}>
                        <View style={styles.headerContext}>
                            <Text style={styles.pageTitle}>Solicitar Orçamento</Text>
                            <Text style={styles.pageDesc}>Preencha estas informações para que o profissional entenda sua necessidade antes de abrir o chat.</Text>
                        </View>
                    </FadeInView>

                    {activeQuestions.map((q: formField, index: number) => (
                        <FadeInView key={q.id} translateY={20} delay={200 + index * 100}>
                            <View style={styles.questionCard}>
                                <Text style={styles.questionTitle}>
                                    {index + 1}. {q.title} {q.required && <Text style={{ color: Colors.error }}>*</Text>}
                                </Text>

                                {q.type === 'text' && (
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Sua resposta..."
                                        placeholderTextColor={Colors.textTertiary}
                                        multiline
                                        value={answers[q.id] || ''}
                                        onChangeText={(t) => handleAnswer(q.id, t)}
                                    />
                                )}

                                {q.type === 'select' && q.options && (
                                    <View style={styles.optionsContainer}>
                                        {q.options.map((opt: string) => (
                                            <TouchableOpacity
                                                key={opt}
                                                style={[styles.optionBox, answers[q.id] === opt && styles.optionBoxSelected]}
                                                onPress={() => {
                                                    Haptics.selectionAsync();
                                                    handleAnswer(q.id, opt);
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <View style={[styles.radio, answers[q.id] === opt && styles.radioSelected]}>
                                                    {answers[q.id] === opt && <View style={styles.radioInner} />}
                                                </View>
                                                <Text style={[styles.optionText, answers[q.id] === opt && styles.optionTextSelected]}>{opt}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </FadeInView>
                    ))}

                    <View style={{ height: 40 }} />
                </ScrollView>

                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[styles.submitButton, submitting && { opacity: 0.7 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                        activeOpacity={0.8}
                    >
                        {submitting ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>Iniciar Conversa</Text>
                                <Ionicons name="chatbubbles" size={20} color={Colors.white} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface
    },
    container: {
        flex: 1,
        backgroundColor: Colors.surface
    },
    navHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: Colors.white,
        ...Shadows.sm
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: {
        ...Typography.h4,
        color: Colors.text
    },
    errorText: {
        ...Typography.h4,
        color: Colors.text,
        marginTop: 16,
    },
    backButtonFallback: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md
    },
    backButtonFallbackText: {
        ...Typography.button,
        color: Colors.white,
    },

    scrollContent: {
        padding: 24
    },

    headerContext: {
        marginBottom: 32
    },
    pageTitle: {
        ...Typography.h2,
        color: Colors.text,
        marginBottom: 8
    },
    pageDesc: {
        ...Typography.body,
        color: Colors.textSecondary,
    },

    questionCard: {
        backgroundColor: Colors.white,
        padding: 20,
        borderRadius: BorderRadius.lg,
        marginBottom: 20,
        ...Shadows.md,
        borderWidth: 1,
        borderColor: Colors.borderLight
    },
    questionTitle: {
        ...Typography.h4,
        color: Colors.text,
        marginBottom: 16,
    },

    textInput: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        padding: 16,
        ...Typography.body,
        color: Colors.text,
        minHeight: 120,
        textAlignVertical: 'top'
    },

    optionsContainer: {
        gap: 12
    },
    optionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface
    },
    optionBoxSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.border,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    radioSelected: {
        borderColor: Colors.primary
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary
    },
    optionText: {
        ...Typography.bodySmall,
        color: Colors.textSecondary,
    },
    optionTextSelected: {
        color: Colors.primary,
        fontWeight: '700'
    },

    bottomBar: {
        padding: 24,
        paddingTop: 16,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        ...Shadows.xl
    },
    submitButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 18,
        borderRadius: BorderRadius.lg,
        gap: 12,
        ...Shadows.lg
    },
    submitButtonText: {
        ...Typography.button,
        color: Colors.white,
    }
});

