import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../utils/theme';
import FadeInView from '../../components/ui/FadeInView';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import { logger } from '../../utils/logger';

type Plan = {
    id: string;
    name: string;
    price_brl: number;
    take_rate: number;
    max_services: number;
    features: string[];
};

const PLAN_COLORS: Record<string, { bg: string; accent: string; badge: string; light: string }> = {
    'Start': { bg: Colors.white, accent: Colors.textSecondary, badge: Colors.borderLight, light: Colors.surface },
    'Pro': { bg: '#F0F7FF', accent: Colors.primary, badge: Colors.primaryLight, light: '#F0F7FF' },
    'Scale': { bg: '#F0F9FF', accent: '#0EA5E9', badge: '#E0F2FE', light: '#F0F9FF' },
};

export default function PlansScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(false);
    const [companyId, setCompanyId] = useState('');
    const [activePlanId, setActivePlanId] = useState<string | null>(null);
    const [kycStatus, setKycStatus] = useState<'pending' | 'submitted' | 'in_review' | 'approved' | 'rejected'>('pending');

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const [{ data: plansData }, { data: company }] = await Promise.all([
                supabase.from('subscription_plans').select('*').eq('is_active', true).order('price_brl'),
                supabase.from('companies').select('id, kyc_status').eq('profile_id', user.id).single(),
            ]);

            if (plansData) setPlans(plansData as Plan[]);
            if (company) {
                setCompanyId(company.id);
                setKycStatus(company.kyc_status || 'pending');
                const { data: sub } = await supabase
                    .from('company_subscriptions')
                    .select('plan_id')
                    .eq('company_id', company.id)
                    .eq('status', 'active')
                    .single();
                if (sub) setActivePlanId(sub.plan_id);
            }
        } catch (e) {
            logger.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSelectPlan = async (plan: Plan) => {
        if (plan.id === activePlanId) return;

        // KYC check for paid plans
        if (plan.price_brl > 0 && kycStatus !== 'approved') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert(
                'Identidade Necessária',
                'Para assinar planos pagos e aumentar seus limites, você precisa primeiro verificar sua identidade e documentos.',
                [
                    { text: 'Agora não', style: 'cancel' },
                    { text: 'Verificar Documentos', onPress: () => router.push('/company/compliance') }
                ]
            );
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        Alert.alert(
            `Ativar plano ${plan.name}`,
            plan.price_brl > 0
                ? `Valor: R$ ${plan.price_brl.toFixed(2)}/mês\nComissão da plataforma: ${plan.take_rate}%`
                : `Plano gratuito com comissão de ${plan.take_rate}%`,
            [
                { text: 'Agora não', style: 'cancel' },
                {
                    text: 'Confirmar Upgrade',
                    onPress: async () => {
                        setSubscribing(true);
                        try {
                            if (activePlanId) {
                                await supabase
                                    .from('company_subscriptions')
                                    .update({ status: 'canceled' })
                                    .eq('company_id', companyId)
                                    .eq('status', 'active');
                            }

                            const { error } = await supabase
                                .from('company_subscriptions')
                                .insert({
                                    company_id: companyId,
                                    plan_id: plan.id,
                                    status: 'active',
                                    current_period_start: new Date().toISOString(),
                                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                                });

                            if (error) throw error;

                            setActivePlanId(plan.id);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert('Sucesso!', `Bem-vindo ao plano ${plan.name}.`);
                        } catch (err: any) {
                            logger.error(err);
                            Alert.alert('Erro', 'Não foi possível ativar o plano.');
                        } finally {
                            setSubscribing(false);
                        }
                    }
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} aria-label="Planos">
                <View style={styles.navHeader}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <Skeleton width={100} height={20} />
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.scrollContent}>
                    <Skeleton width="100%" height={300} borderRadius={24} style={{ marginBottom: 20 }} />
                    <Skeleton width="100%" height={300} borderRadius={24} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']} aria-label="Planos">
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Planos</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <FadeInView delay={100} translateY={20}>
                    <Text style={styles.heroTitle}>Evolua seu negócio</Text>
                    <Text style={styles.subtitle}>
                        Escolha o plano ideal para crescer. Quanto melhor seu plano, menor é a taxa administrativa sobre suas vendas.
                    </Text>
                </FadeInView>

                {kycStatus !== 'approved' && (
                    <FadeInView delay={150}>
                        <TouchableOpacity
                            style={styles.kycWarning}
                            onPress={() => router.push('/company/compliance')}
                        >
                            <View style={styles.kycIconBox}>
                                <Ionicons name="shield-checkmark" size={20} color={Colors.warning} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.kycWarningTitle}>Verificação Pendente</Text>
                                <Text style={styles.kycWarningDesc}>Envie seus documentos para liberar os planos Pro e Scale.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={Colors.border} />
                        </TouchableOpacity>
                    </FadeInView>
                )}

                {plans.map((plan, index) => {
                    const colors = PLAN_COLORS[plan.name] || PLAN_COLORS['Start'];
                    const isActive = plan.id === activePlanId;
                    const isPopular = plan.name === 'Pro';

                    return (
                        <FadeInView key={plan.id} delay={200 + index * 100} translateY={10}>
                            <View
                                style={[
                                    styles.planCard,
                                    { backgroundColor: colors.bg },
                                    isActive && styles.planCardActive,
                                    isPopular && styles.planCardPopular
                                ]}
                            >
                                {isPopular && (
                                    <View style={[styles.popularBadge, { backgroundColor: colors.accent }]}>
                                        <Ionicons name="sparkles" size={10} color={Colors.white} />
                                        <Text style={styles.popularText}>MAIS POPULAR</Text>
                                    </View>
                                )}

                                {isActive && (
                                    <View style={styles.activeBadge}>
                                        <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                                        <Text style={styles.activeText}>PLANO ATUAL</Text>
                                    </View>
                                )}

                                <View style={styles.cardHeader}>
                                    <Text style={[styles.planName, { color: colors.accent }]}>{plan.name}</Text>
                                    <View style={[styles.rateBadge, { backgroundColor: colors.badge }]}>
                                        <Text style={[styles.rateText, { color: colors.accent }]}>
                                            Taxa: {plan.take_rate}%
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.priceRow}>
                                    {plan.price_brl > 0 ? (
                                        <>
                                            <Text style={styles.priceCurrency}>R$</Text>
                                            <Text style={[styles.priceValue, { color: Colors.text }]}>
                                                {plan.price_brl.toFixed(0)}
                                            </Text>
                                            <Text style={styles.priceDecimals}>
                                                ,{plan.price_brl.toFixed(2).split('.')[1]}
                                            </Text>
                                            <Text style={styles.priceUnit}>/mês</Text>
                                        </>
                                    ) : (
                                        <Text style={[styles.priceValue, { color: Colors.text }]}>Grátis</Text>
                                    )}
                                </View>

                                <View style={styles.featuresList}>
                                    <View style={styles.featureRow}>
                                        <View style={[styles.featureIcon, { backgroundColor: colors.badge }]}>
                                            <Ionicons name="layers" size={12} color={colors.accent} />
                                        </View>
                                        <Text style={styles.featureText}>
                                            Até {plan.max_services >= 100 ? 'Ilimitados' : plan.max_services} serviços
                                        </Text>
                                    </View>
                                    {plan.features.map((feat, i) => (
                                        <View key={i} style={styles.featureRow}>
                                            <View style={[styles.featureIcon, { backgroundColor: colors.badge }]}>
                                                <Ionicons name="checkmark" size={14} color={colors.accent} />
                                            </View>
                                            <Text style={styles.featureText}>{feat}</Text>
                                        </View>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.selectBtn,
                                        { backgroundColor: isActive ? Colors.borderLight : colors.accent },
                                        subscribing && { opacity: 0.6 }
                                    ]}
                                    onPress={() => handleSelectPlan(plan)}
                                    disabled={isActive || subscribing}
                                >
                                    {subscribing && plan.id !== activePlanId ? (
                                        <ActivityIndicator color={Colors.white} />
                                    ) : (
                                        <Text style={[styles.selectBtnText, isActive && { color: Colors.textTertiary }]}>
                                            {isActive ? 'Ativo' : 'Selecionar este plano'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </FadeInView>
                    );
                })}

                <View style={styles.footerNote}>
                    <Ionicons name="shield-checkmark" size={16} color={Colors.textTertiary} />
                    <Text style={styles.footerNoteText}>Alteração de plano segura e instantânea</Text>
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    navHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.white,
        ...Shadows.sm
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...Typography.h4, color: Colors.text },

    scrollContent: { padding: Spacing.lg },
    heroTitle: { ...Typography.h1, color: Colors.text, textAlign: 'center', marginBottom: 8 },
    subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl, paddingHorizontal: 20 },

    planCard: { borderRadius: 24, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: Colors.borderLight, position: 'relative', ...Shadows.md },
    planCardActive: { borderColor: Colors.success, borderWidth: 2 },
    planCardPopular: { borderColor: Colors.primary, borderWidth: 2 },

    popularBadge: { position: 'absolute', top: -12, right: 24, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
    popularText: { color: Colors.white, fontSize: 10, fontWeight: '900' },

    activeBadge: { position: 'absolute', top: -12, left: 24, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.success },
    activeText: { color: Colors.success, fontSize: 10, fontWeight: '900' },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    planName: { ...Typography.h3, fontWeight: '900' },

    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 24 },
    priceCurrency: { ...Typography.bodySmall, fontWeight: '800', color: Colors.textTertiary, marginRight: 4 },
    priceValue: { fontSize: 48, fontWeight: '900', letterSpacing: -2 },
    priceDecimals: { ...Typography.h4, fontWeight: '800', color: Colors.text },
    priceUnit: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '700', marginLeft: 6 },

    rateBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.md },
    rateText: { ...Typography.caption, fontWeight: '800' },

    featuresList: { gap: 14, marginBottom: 32 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureIcon: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    featureText: { ...Typography.bodySmall, color: Colors.text, fontWeight: '600' },

    selectBtn: { paddingVertical: 18, borderRadius: BorderRadius.lg, alignItems: 'center', ...Shadows.sm },
    selectBtnText: { ...Typography.button, color: Colors.white },

    footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: Spacing.lg },
    footerNoteText: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '700' },

    kycWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warning + '10', padding: 16, borderRadius: 24, gap: 14, marginBottom: 24, borderWidth: 1, borderColor: Colors.warning + '30' },
    kycIconBox: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
    kycWarningTitle: { fontSize: 13, fontWeight: '900', color: Colors.text },
    kycWarningDesc: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginTop: 1 },
});
