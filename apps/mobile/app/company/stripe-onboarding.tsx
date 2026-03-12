import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../utils/theme';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import FadeInView from '../../components/ui/FadeInView';
import { logger } from '../../utils/logger';

export default function StripeOnboardingScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [company, setCompany] = useState<any>(null);

    useEffect(() => {
        async function fetchCompany() {
            if (!user) return;
            const { data } = await supabase
                .from('companies')
                .select('id, stripe_account_id, stripe_onboarding_complete, company_name')
                .eq('profile_id', user.id)
                .single();
            setCompany(data);
            setLoading(false);
        }
        fetchCompany();
    }, [user]);

    const handleConnect = async () => {
        if (!company) return;
        setConnecting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const { data, error } = await supabase.functions.invoke('stripe-connect-onboarding', {
                body: {
                    company_id: company.id,
                    return_url: 'myapp://stripe-return'
                },
            });

            if (error) throw new Error(error.message);
            if (data?.url) {
                await Linking.openURL(data.url);
            }
        } catch (err: any) {
            logger.error(err);
            Alert.alert('Erro', 'Não foi possível iniciar a conexão com o Stripe.');
        } finally {
            setConnecting(false);
        }
    };

    const handleRefreshStatus = async () => {
        if (!company) return;
        setLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const { data } = await supabase
            .from('companies')
            .select('id, stripe_account_id, stripe_onboarding_complete, company_name')
            .eq('id', company.id)
            .single();
        setCompany(data);
        setLoading(false);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} aria-label="Integração de Pagamentos">
                <View style={styles.navHeader}><Skeleton width={40} height={40} borderRadius={20} /><Skeleton width={140} height={24} /><View style={{ width: 40 }} /></View>
                <View style={{ padding: 24 }}><Skeleton width="100%" height={200} borderRadius={32} style={{ marginBottom: 24 }} /><Skeleton width="100%" height={100} borderRadius={24} /></View>
            </SafeAreaView>
        );
    }

    const isConnected = company?.stripe_onboarding_complete;
    const hasAccount = !!company?.stripe_account_id;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']} aria-label="Integração de Pagamentos">
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pagamentos</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {isConnected ? (
                    <FadeInView delay={100}>
                        <View style={styles.successCard}>
                            <View style={styles.successIconCircle}>
                                <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
                            </View>
                            <Text style={styles.successTitle}>Tudo pronto!</Text>
                            <Text style={styles.successText}>Suas vendas na CONTRATTO serão depositadas automaticamente na sua conta Stripe.</Text>

                            <View style={styles.detailsBox}>
                                <Text style={styles.detailLabel}>ID DA CONTA</Text>
                                <Text style={styles.detailValue}>{company.stripe_account_id}</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.manageBtn}
                                onPress={handleConnect}
                                disabled={connecting}
                            >
                                {connecting ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.manageBtnText}>Alterar dados bancários</Text>}
                            </TouchableOpacity>
                        </View>
                    </FadeInView>
                ) : (
                    <>
                        <FadeInView delay={100} translateY={10}>
                            <View style={styles.hero}>
                                <View style={styles.heroIconBox}>
                                    <Ionicons name="card" size={40} color={Colors.primary} />
                                </View>
                                <Text style={styles.heroTitle}>Receba Direto</Text>
                                <Text style={styles.heroSubtitle}>Conecte sua conta Stripe e receba pagamentos via Cartão ou PIX com segurança total.</Text>
                            </View>
                        </FadeInView>

                        <FadeInView delay={300} translateY={20}>
                            <View style={styles.benefitList}>
                                {[
                                    { icon: 'shield-checkmark', title: '100% Seguro', desc: 'Tecnologia de ponta Stripe Brasil.' },
                                    { icon: 'speedometer', title: 'Depósitos Rápidos', desc: 'Transferência direta para seu banco.' },
                                    { icon: 'stats-chart', title: 'Gestão Completa', desc: 'Acompanhe cada centavo que entra.' }
                                ].map((item, idx) => (
                                    <View key={idx} style={styles.benefitItem}>
                                        <View style={styles.benefitIconBox}>
                                            <Ionicons name={item.icon as any} size={20} color={Colors.textTertiary} />
                                        </View>
                                        <View>
                                            <Text style={styles.benefitTitle}>{item.title}</Text>
                                            <Text style={styles.benefitDesc}>{item.desc}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </FadeInView>

                        <FadeInView delay={500} translateY={10}>
                            <TouchableOpacity
                                style={[styles.connectBtn, connecting && { opacity: 0.6 }]}
                                onPress={handleConnect}
                                disabled={connecting}
                            >
                                {connecting ? <ActivityIndicator color={Colors.white} /> : (
                                    <>
                                        <Text style={styles.connectBtnText}>{hasAccount ? 'Continuar no Stripe' : 'Ativar Recebimentos'}</Text>
                                        <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                                    </>
                                )}
                            </TouchableOpacity>

                            {hasAccount && (
                                <TouchableOpacity style={styles.syncBtn} onPress={handleRefreshStatus}>
                                    <Ionicons name="refresh" size={14} color={Colors.primary} />
                                    <Text style={styles.syncBtnText}>Já completei o cadastro</Text>
                                </TouchableOpacity>
                            )}
                        </FadeInView>
                    </>
                )}

                <TouchableOpacity style={styles.planCard} onPress={() => router.push('/company/plans')}>
                    <View style={styles.planIcon}>
                        <Ionicons name="rocket" size={20} color={Colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.planTitle}>Aumente seus lucros</Text>
                        <Text style={styles.planDesc}>Taxas menores e maior visibilidade.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.border} />
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, backgroundColor: Colors.white, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, ...Shadows.sm },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...Typography.h4, color: Colors.text, fontWeight: '900' },

    scroll: { padding: 24, gap: 24, paddingBottom: 60 },

    successCard: { backgroundColor: Colors.white, borderRadius: 40, padding: 32, alignItems: 'center', ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
    successIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.success + '10', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    successTitle: { ...Typography.h2, color: Colors.text, fontWeight: '900', marginBottom: 12 },
    successText: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    detailsBox: { width: '100%', backgroundColor: Colors.surface, padding: 20, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
    detailLabel: { fontSize: 10, fontWeight: '900', color: Colors.textTertiary, marginBottom: 8, letterSpacing: 1 },
    detailValue: { fontSize: 14, fontWeight: '700', color: Colors.text, letterSpacing: 1 },
    manageBtn: { marginTop: 32, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16, backgroundColor: Colors.primary + '10' },
    manageBtnText: { color: Colors.primary, fontWeight: '800', fontSize: 14 },

    hero: { alignItems: 'center', paddingTop: 20, marginBottom: 10 },
    heroIconBox: { width: 80, height: 80, borderRadius: 32, backgroundColor: Colors.white, ...Shadows.md, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    heroTitle: { ...Typography.h2, color: Colors.text, fontWeight: '900', marginBottom: 16 },
    heroSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },

    benefitList: { backgroundColor: Colors.white, borderRadius: 32, padding: 24, gap: 20, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
    benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    benefitIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    benefitTitle: { fontSize: 14, fontWeight: '900', color: Colors.text, marginBottom: 2 },
    benefitDesc: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary },

    connectBtn: { backgroundColor: Colors.primary, height: 64, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, ...Shadows.lg, marginTop: 10 },
    connectBtnText: { color: Colors.white, fontSize: 17, fontWeight: '900' },
    syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
    syncBtnText: { fontSize: 13, fontWeight: '800', color: Colors.primary },

    planCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: 20, borderRadius: 28, gap: 16, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight, marginTop: 20 },
    planIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadows.md },
    planTitle: { fontSize: 14, fontWeight: '900', color: Colors.text, marginBottom: 2 },
    planDesc: { fontSize: 12, fontWeight: '700', color: Colors.primary }
});
