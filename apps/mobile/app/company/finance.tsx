import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../utils/theme';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import FadeInView from '../../components/ui/FadeInView';
import EmptyState from '../../components/ui/EmptyState';
import * as Haptics from 'expo-haptics';
import { logger } from '../../utils/logger';

type StripeBalance = {
    available: { amount: number; currency: string }[];
    pending: { amount: number; currency: string }[];
};

type StripeTransaction = {
    id: string;
    amount: number;
    currency: string;
    description: string;
    created: number;
    status: string;
    type: string;
};

export default function FinanceScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [company, setCompany] = useState<any>(null);
    const [balance, setBalance] = useState<StripeBalance | null>(null);
    const [transactions, setTransactions] = useState<StripeTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [payoutsEnabled, setPayoutsEnabled] = useState(false);
    const [monthlyMetrics, setMonthlyMetrics] = useState({ total: 0, count: 0 });
    const [error, setError] = useState(false);

    const fetchFinanceData = useCallback(async (silent = false) => {
        if (!user) return;
        if (!silent) setLoading(true);
        setError(false);

        try {
            const { data: comp } = await supabase
                .from('companies')
                .select('id, stripe_account_id, company_name')
                .eq('profile_id', user.id)
                .single();

            if (!comp) {
                setLoading(false);
                return;
            }
            setCompany(comp);

            if (!comp.stripe_account_id) {
                setLoading(false);
                return;
            }

            const { data, error: invokeError } = await supabase.functions.invoke('get-stripe-balance', {
                body: { stripe_account_id: comp.stripe_account_id }
            });

            if (invokeError) throw invokeError;

            if (data) {
                setBalance(data.balance);
                setTransactions(data.transactions);
                setPayoutsEnabled(data.payouts_enabled);
            }

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const { data: dbOrders, error: ordersError } = await supabase
                .from('orders')
                .select('price')
                .eq('seller_id', user.id)
                .eq('status', 'completed')
                .gte('created_at', startOfMonth);

            if (ordersError) throw ordersError;

            const monthlyTotal = (dbOrders || []).reduce((sum: number, o: any) => sum + (Number(o.price) || 0), 0);
            setMonthlyMetrics({ total: monthlyTotal, count: dbOrders?.length || 0 });

        } catch (e) {
            logger.error('Finance Fetch Error:', e);
            setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => { fetchFinanceData(); }, [fetchFinanceData]);

    const handleRefresh = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRefreshing(true);
        fetchFinanceData(true);
    };

    const formatCurrency = (amount: number, currency: string) => {
        return (amount / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: currency.toUpperCase(),
        });
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
        });
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'payout': return { name: 'arrow-up-circle', color: Colors.primary };
            case 'charge': return { name: 'add-circle', color: Colors.success };
            case 'refund': return { name: 'remove-circle', color: Colors.error };
            default: return { name: 'swap-horizontal', color: Colors.textSecondary };
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} aria-label="Finanças">
                <View style={[styles.header, { borderBottomWidth: 0 }]}><Skeleton width={40} height={40} borderRadius={20} /><Skeleton width={120} height={20} /><View style={{ width: 40 }} /></View>
                <View style={{ padding: 24 }}><Skeleton width="100%" height={120} borderRadius={30} style={{ marginBottom: 24 }} /><View style={{ flexDirection: 'row', gap: 16 }}><Skeleton width="55%" height={160} borderRadius={30} /><Skeleton width="40%" height={160} borderRadius={30} /></View></View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} aria-label="Finanças">
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={Colors.text} /></TouchableOpacity>
                    <Text style={styles.headerTitle}>Financeiro</Text>
                    <View style={{ width: 44 }} />
                </View>
                <EmptyState
                    icon="alert-circle-outline"
                    title="Erro ao carregar dados"
                    subtitle="Não foi possível obter suas informações financeiras. Tente novamente em instantes."
                    actionLabel="Tentar Novamente"
                    onAction={fetchFinanceData}
                    isError={true}
                />
            </SafeAreaView>
        );
    }

    if (!company?.stripe_account_id) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={Colors.text} /></TouchableOpacity>
                    <Text style={styles.headerTitle}>Financeiro</Text>
                    <View style={{ width: 44 }} />
                </View>
                <FadeInView style={styles.emptyBox}>
                    <View style={styles.emptyIconCircle}><Ionicons name="wallet-outline" size={48} color={Colors.border} /></View>
                    <Text style={styles.emptyTitle}>Conta Stripe pendente</Text>
                    <Text style={styles.emptyText}>Para processar pagamentos e gerenciar seus ganhos, você precisa configurar sua conta no Stripe.</Text>
                    <TouchableOpacity style={styles.setupBtn} onPress={() => router.push('/company/stripe-onboarding')}>
                        <Text style={styles.setupBtnText}>Configurar Agora</Text>
                    </TouchableOpacity>
                </FadeInView>
            </SafeAreaView>
        );
    }

    const availableAmount = balance?.available[0]?.amount || 0;
    const pendingAmount = balance?.pending[0]?.amount || 0;
    const currency = balance?.available[0]?.currency || 'brl';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']} aria-label="Finanças">
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={Colors.text} /></TouchableOpacity>
                <Text style={styles.headerTitle}>Minhas Finanças</Text>
                <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}><Ionicons name="refresh" size={22} color={Colors.primary} /></TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
            >
                <FadeInView delay={100} translateY={10}>
                    <View style={styles.monthlyCard}>
                        <View style={styles.reportHeader}>
                            <Text style={styles.reportLabel}>FATURAMENTO MENSAL</Text>
                            <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>{monthlyMetrics.count} PEDIDOS</Text></View>
                        </View>
                        <Text style={styles.reportValue}>
                            {monthlyMetrics.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </Text>
                    </View>
                </FadeInView>

                <FadeInView delay={200} translateY={10}>
                    <View style={styles.balanceGrid}>
                        <View style={styles.blackCard}>
                            <Text style={styles.blackCardLabel}>SALDO DISPONÍVEL</Text>
                            <Text style={styles.blackCardValue}>{formatCurrency(availableAmount, currency)}</Text>
                            <View style={styles.statusPill}>
                                <Ionicons name={payoutsEnabled ? "checkmark-circle" : "time"} size={12} color={payoutsEnabled ? Colors.success : Colors.warning} />
                                <Text style={[styles.statusPillText, { color: payoutsEnabled ? Colors.success : Colors.warning }]}>
                                    {payoutsEnabled ? 'Apto para saque' : 'Verificação pendente'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.whiteCard}>
                            <Text style={styles.whiteCardLabel}>EM PROCESSAMENTO</Text>
                            <Text style={styles.whiteCardValue}>{formatCurrency(pendingAmount, currency)}</Text>
                            <Text style={styles.whiteCardHint}>Ganhos futuros</Text>
                        </View>
                    </View>
                </FadeInView>

                <FadeInView delay={300} translateY={20}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Histórico Recente</Text>
                    </View>
                    <View style={styles.txList}>
                        {transactions.length === 0 ? (
                            <Text style={styles.noTx}>Nenhuma movimentação para exibir.</Text>
                        ) : transactions.map((tx, idx) => {
                            const icon = getTransactionIcon(tx.type);
                            return (
                                <View key={tx.id} style={[styles.txItem, idx === transactions.length - 1 && { borderBottomWidth: 0 }]}>
                                    <View style={[styles.txIconBox, { backgroundColor: icon.color + '15' }]}>
                                        <Ionicons name={icon.name as any} size={20} color={icon.color} />
                                    </View>
                                    <View style={styles.txInfo}>
                                        <Text style={styles.txDesc} numberOfLines={1}>{tx.description || tx.type}</Text>
                                        <Text style={styles.txDate}>{formatDate(tx.created)}</Text>
                                    </View>
                                    <Text style={[styles.txAmount, { color: tx.amount > 0 ? Colors.success : Colors.text }]}>
                                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </FadeInView>

                <TouchableOpacity
                    style={styles.stripeBtn}
                    onPress={() => router.push('/company/stripe-onboarding')}
                >
                    <Ionicons name="settings-outline" size={16} color={Colors.textTertiary} />
                    <Text style={styles.stripeBtnText}>Configurar Conta Stripe</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, backgroundColor: Colors.white, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, ...Shadows.sm },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...Typography.h4, color: Colors.text, fontWeight: '900' },
    refreshBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

    scroll: { padding: 24, gap: 24, paddingBottom: 60 },
    monthlyCard: { backgroundColor: Colors.primary, borderRadius: 32, padding: 28, ...Shadows.lg },
    reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    reportLabel: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
    reportValue: { fontSize: 32, fontWeight: '900', color: Colors.white },
    activeBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    activeBadgeText: { fontSize: 10, fontWeight: '900', color: Colors.white },

    balanceGrid: { flexDirection: 'row', gap: 12 },
    blackCard: { flex: 1.3, backgroundColor: Colors.text, borderRadius: 32, padding: 24, ...Shadows.md },
    blackCardLabel: { fontSize: 10, fontWeight: '900', color: Colors.textTertiary, marginBottom: 8, letterSpacing: 1 },
    blackCardValue: { fontSize: 22, fontWeight: '900', color: Colors.white, marginBottom: 12 },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' },
    statusPillText: { fontSize: 10, fontWeight: '800' },

    whiteCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 32, padding: 24, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },
    whiteCardLabel: { fontSize: 10, fontWeight: '900', color: Colors.textTertiary, marginBottom: 8, letterSpacing: 0.5 },
    whiteCardValue: { fontSize: 18, fontWeight: '900', color: Colors.text, marginBottom: 4 },
    whiteCardHint: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary },

    sectionHeader: { marginBottom: 16, marginTop: 12 },
    sectionTitle: { ...Typography.h4, fontWeight: '900', color: Colors.text },
    txList: { backgroundColor: Colors.white, borderRadius: 32, padding: 24, paddingBottom: 8, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },
    txItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    txIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    txInfo: { flex: 1, marginLeft: 16 },
    txDesc: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 2 },
    txDate: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary },
    txAmount: { fontSize: 15, fontWeight: '900' },
    noTx: { padding: 20, textAlign: 'center', color: Colors.textTertiary, fontWeight: '600' },

    stripeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
    stripeBtnText: { fontSize: 13, fontWeight: '700', color: Colors.textTertiary },

    emptyBox: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
    emptyIconCircle: { width: 100, height: 100, borderRadius: 40, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', ...Shadows.md, marginBottom: 24 },
    emptyTitle: { ...Typography.h3, color: Colors.text, fontWeight: '900', marginBottom: 12 },
    emptyText: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    setupBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 18, borderRadius: 24, ...Shadows.md },
    setupBtnText: { color: Colors.white, fontWeight: '900', fontSize: 15 },
});
