import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
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

type Service = {
    id: string;
    company_id: string;
    title: string;
    price: number;
    price_type: 'fixed' | 'budget';
    companies: {
        business_name: string;
    };
    service_forms?: { id: string; questions: string[] }[];
};

export default function CheckoutScreen() {
    const { id, scheduledFor, addressRef } = useLocalSearchParams<{ id: string; scheduledFor?: string; addressRef?: string }>();
    const router = useRouter();
    const { session } = useAuth();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'local'>('card');
    const [formAnswers, setFormAnswers] = useState<string[]>([]);

    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Trava de segurança extra para evitar múltiplos cliques rápidos
    const submissionRef = useRef(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: svcData, error: svcError } = await supabase
                    .from('services')
                    .select('*, companies(business_name), service_forms(id, questions)')
                    .eq('id', id)
                    .single();

                if (svcError) throw svcError;
                
                const typedData = svcData as unknown as Service;
                setService(typedData);
                
                if (typedData.service_forms && typedData.service_forms.length > 0) {
                    setFormAnswers(new Array(typedData.service_forms[0].questions.length).fill(''));
                }
            } catch (error) {
                logger.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchData();
    }, [id]);

    const handleConfirmBooking = async () => {
        // Guardas de segurança
        if (!session?.user.id || !service || isSubmitting || submissionRef.current) return;
        
        const isBudgetFlow = service.price_type === 'budget';
        
        if (isBudgetFlow && service.service_forms && service.service_forms.length > 0) {
            if (formAnswers.some(a => !a.trim())) {
                Alert.alert("Atenção", "Por favor, responda todas as perguntas do profissional para enviar o pedido de orçamento.");
                return;
            }
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setIsSubmitting(true);
        submissionRef.current = true;

        try {
            const { data: newOrder, error } = await supabase
                .from('service_orders')
                .insert({
                    client_id: session.user.id,
                    company_id: service.company_id,
                    service_id: service.id,
                    status: 'pending',
                    total_price: isBudgetFlow ? null : service.price,
                    scheduled_for: scheduledFor ? decodeURIComponent(scheduledFor) : null,
                    address_reference: addressRef ? decodeURIComponent(addressRef) : null,
                })
                .select('id')
                .single();

            if (error) throw error;
            
            if (isBudgetFlow && service.service_forms && service.service_forms.length > 0) {
                const questionsObj = service.service_forms[0].questions;
                const finalAnswers: Record<string, string> = {};
                questionsObj.forEach((q, idx) => {
                    finalAnswers[q] = formAnswers[idx];
                });

                await supabase.from('form_responses').insert({
                    order_id: newOrder.id,
                    answers: finalAnswers
                });
            }

            // Feedback visual de sucesso antes de navegar
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Request Push Permission contextually after a successful booking
            try {
                const { requestPushPermissionContextually } = await import('../../../utils/pushNotifications');
                await requestPushPermissionContextually(session.user.id);
            } catch (e) {
                logger.error('Failed to request push permissions after booking', e);
            }

            Alert.alert(
                "Tudo pronto!",
                "Sua solicitação foi enviada. Você será notificado assim que o profissional responder.",
                [{ text: "OK", onPress: () => router.replace('/(tabs)/orders') }]
            );
        } catch (error) {
            logger.error('Booking Error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert("Ops!", "Não conseguimos concluir seu agendamento no momento. Tente novamente.");
            setIsSubmitting(false);
            submissionRef.current = false;
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} aria-label="Checkout">
                <View style={styles.navHeader}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <Skeleton width={150} height={20} />
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.scrollContent}>
                    <Skeleton width={150} height={24} style={{ marginBottom: 16 }} />
                    <Skeleton width="100%" height={120} borderRadius={16} style={{ marginBottom: 32 }} />
                    <Skeleton width={150} height={24} style={{ marginBottom: 16 }} />
                    <Skeleton width="100%" height={80} borderRadius={16} />
                </View>
            </SafeAreaView>
        );
    }

    if (!service) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
                <Text style={styles.errorText}>Dados do serviço não encontrados.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonFallback}>
                    <Text style={styles.backButtonFallbackText}>Voltar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const isBudget = service.price_type === 'budget';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']} aria-label="Checkout">
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Revisão e Confirmação</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <FadeInView translateY={20} delay={100}>
                    {/* Order Summary */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Resumo do Pedido</Text>
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Serviço</Text>
                                <Text style={styles.summaryValue}>{service.title}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Profissional</Text>
                                <Text style={styles.summaryValue}>{service.companies?.business_name}</Text>
                            </View>
                            {addressRef && (
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Local</Text>
                                    <Text style={styles.summaryValue} numberOfLines={2}>{decodeURIComponent(addressRef)}</Text>
                                </View>
                            )}
                            <View style={[styles.summaryRow, { marginBottom: 0 }]}>
                                <Text style={styles.summaryLabel}>Valor</Text>
                                <Text style={styles.summaryValueHighlight}>
                                    {isBudget ? 'Sob Orçamento' : `R$ ${Number(service.price).toFixed(2).replace('.', ',')}`}
                                </Text>
                            </View>
                        </View>
                    </View>
                </FadeInView>

                <FadeInView translateY={20} delay={200}>
                    {/* Payment Method */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
                        {isBudget ? (
                            <View style={styles.paymentBoxBlue}>
                                <Ionicons name="chatbubbles" size={24} color={Colors.primary} style={{ marginBottom: 8 }} />
                                <Text style={styles.paymentBoxTitle}>Combinar no Chat</Text>
                                <Text style={styles.paymentBoxDesc}>O profissional fará uma avaliação e enviará o orçamento final diretamente no chat.</Text>
                            </View>
                        ) : (
                            <View style={styles.paymentMethods}>
                                <TouchableOpacity
                                    style={[styles.methodCard, selectedPaymentMethod === 'card' && styles.methodSelected]}
                                    activeOpacity={0.8}
                                    onPress={() => setSelectedPaymentMethod('card')}
                                >
                                    <Ionicons name="card" size={24} color={selectedPaymentMethod === 'card' ? Colors.primary : Colors.textTertiary} />
                                    <Text style={selectedPaymentMethod === 'card' ? styles.methodTextActive : styles.methodText}>Cartão / PIX (Padrão)</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </FadeInView>

                <FadeInView translateY={20} delay={300}>
                    {/* Formulario Dinamico (Orcamento) */}
                    {isBudget && service.service_forms && service.service_forms.length > 0 && service.service_forms[0].questions.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Questionário do Profissional</Text>
                            <Text style={styles.sectionSubtitle}>Responda para que o profissional possa avaliar seu pedido e enviar um orçamento preciso.</Text>
                            
                            {service.service_forms[0].questions.map((q, idx) => (
                                <View key={idx} style={styles.questionBlock}>
                                    <Text style={styles.questionLabel}>{q}</Text>
                                    <TextInput
                                        style={styles.answerInput}
                                        value={formAnswers[idx]}
                                        onChangeText={(text) => {
                                            const newAnswers = [...formAnswers];
                                            newAnswers[idx] = text;
                                            setFormAnswers(newAnswers);
                                        }}
                                        placeholder="Sua resposta..."
                                        placeholderTextColor={Colors.textTertiary}
                                        multiline
                                    />
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Security Info */}
                    <View style={styles.securityInfo}>
                        <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
                        <Text style={styles.securityText}>Seu pagamento é processado com segurança via Stripe.</Text>
                    </View>

                    {/* Confirm Button */}
                    <TouchableOpacity
                        style={[styles.confirmBtn, isSubmitting && { opacity: 0.8 }]}
                        onPress={handleConfirmBooking}
                        disabled={isSubmitting}
                        activeOpacity={0.8}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <>
                                <Text style={styles.confirmBtnText}>
                                    {isBudget ? 'Enviar Solicitação' : 'Confirmar e Finalizar'}
                                </Text>
                                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                            </>
                        )}
                    </TouchableOpacity>
                </FadeInView>

                <View style={{ height: 40 }} />
            </ScrollView>
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
        paddingVertical: 14,
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
        paddingHorizontal: 20,
        paddingTop: 24
    },

    section: {
        marginBottom: 32
    },
    sectionTitle: {
        ...Typography.h4,
        color: Colors.text,
        marginBottom: 16
    },
    sectionSubtitle: {
        ...Typography.caption,
        color: Colors.textSecondary,
        marginBottom: 16,
        lineHeight: 20
    },

    questionBlock: {
        marginBottom: 16
    },
    questionLabel: {
        ...Typography.bodySmall,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8
    },
    answerInput: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: BorderRadius.md,
        padding: 16,
        ...Typography.bodySmall,
        color: Colors.text,
        minHeight: 100,
        textAlignVertical: 'top'
    },

    summaryCard: {
        backgroundColor: Colors.white,
        padding: 20,
        borderRadius: BorderRadius.lg,
        ...Shadows.md,
        borderWidth: 1,
        borderColor: Colors.borderLight
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    summaryLabel: {
        ...Typography.bodySmall,
        color: Colors.textSecondary,
    },
    summaryValue: {
        ...Typography.bodySmall,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'right',
        flex: 1,
        marginLeft: 20
    },
    summaryValueHighlight: {
        ...Typography.h3,
        color: Colors.primary,
        textAlign: 'right',
        flex: 1,
        marginLeft: 20
    },

    paymentBoxBlue: {
        backgroundColor: Colors.primaryLight,
        padding: 24,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight
    },
    paymentBoxTitle: {
        ...Typography.h4,
        color: Colors.primary,
        marginBottom: 4
    },
    paymentBoxDesc: {
        ...Typography.caption,
        color: Colors.text,
        lineHeight: 18
    },

    paymentMethods: {
        flexDirection: 'row',
        gap: 12
    },
    methodCard: {
        flex: 1,
        backgroundColor: Colors.white,
        padding: 20,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        alignItems: 'center',
        gap: 8,
        ...Shadows.sm
    },
    methodSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
        ...Shadows.md
    },
    methodText: {
        ...Typography.caption,
        color: Colors.textSecondary,
        fontWeight: '600'
    },
    methodTextActive: {
        ...Typography.caption,
        color: Colors.primary,
        fontWeight: '800'
    },

    securityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 20,
    },
    securityText: {
        ...Typography.caption,
        color: Colors.textTertiary,
        fontSize: 11,
    },

    confirmBtn: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        paddingVertical: 18,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        ...Shadows.lg,
    },
    confirmBtnText: {
        ...Typography.button,
        color: Colors.white,
    }
});

