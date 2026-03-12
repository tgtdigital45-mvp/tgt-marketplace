import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../utils/theme';
import { LineChart } from 'react-native-chart-kit';
import FadeInView from '../../components/ui/FadeInView';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import { logger } from '../../utils/logger';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

type AnalyticsData = {
    totalRevenue: number;
    pendingRevenue: number;
    completedOrders: number;
    averageRating: number;
    dailyOrders: { labels: string[]; data: number[] };
    topServices: { name: string; count: number }[];
};

export default function AnalyticsScreen() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<AnalyticsData | null>(null);

    const fetchAnalytics = useCallback(async (silent = false) => {
        if (!user || profile?.user_type !== 'company') return;
        if (!silent) setLoading(true);

        try {
            // 1. Get Company ID
            const { data: company } = await supabase
                .from('companies')
                .select('id, rating')
                .eq('owner_id', user.id)
                .single();

            if (!company) {
                logger.log('Analytics: Company not found for user', user.id);
                setData(null);
                setLoading(false);
                return;
            }

            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // 2. Fetch Orders for metrics
            const { data: orders, error: ordersError } = await supabase
                .from('service_orders')
                .select('total_price, status, created_at, services(title)')
                .eq('company_id', company.id)
                .gte('created_at', thirtyDaysAgo.toISOString());

            if (ordersError) throw ordersError;

            // 3. Process Metrics
            const totalRevenue = (orders || [])
                .filter(o => o.status === 'completed')
                .reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);

            const pendingRevenue = (orders || [])
                .filter(o => ['pending', 'confirmed', 'in_progress'].includes(o.status))
                .reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);

            const completedOrdersCount = (orders || []).filter(o => o.status === 'completed').length;

            // 4. Daily Orders Chart Data (Last 7 days)
            const last7Days = [...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d.toISOString().split('T')[0];
            });

            const dailyData = last7Days.map(date => {
                return (orders || []).filter(o => o.created_at.startsWith(date)).length;
            });

            const labels = last7Days.map(date => {
                const [_, m, d] = date.split('-');
                return `${d}/${m}`;
            });

            // 5. Top Services
            const serviceCounts: Record<string, number> = {};
            (orders || []).forEach(o => {
                const title = (o.services as any)?.title || 'Serviço';
                serviceCounts[title] = (serviceCounts[title] || 0) + 1;
            });

            const topServices = Object.entries(serviceCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);

            setData({
                totalRevenue,
                pendingRevenue,
                completedOrders: completedOrdersCount,
                averageRating: company.rating || 0,
                dailyOrders: { labels, data: dailyData },
                topServices
            });

        } catch (e) {
            logger.error('Analytics Fetch Error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, profile]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const handleRefresh = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRefreshing(true);
        fetchAnalytics(true);
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Skeleton width={150} height={32} borderRadius={8} />
                </View>
                <View style={styles.content}>
                    <Skeleton width="100%" height={120} borderRadius={24} style={{ marginBottom: 16 }} />
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                        <Skeleton width="48%" height={100} borderRadius={24} />
                        <Skeleton width="48%" height={100} borderRadius={24} />
                    </View>
                    <Skeleton width="100%" height={220} borderRadius={24} />
                </View>
            </SafeAreaView>
        );
    }

    if (!data && !loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.title}>Painel de Analytics</Text>
                </View>
                <View style={[styles.content, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="stats-chart" size={80} color={Colors.border} />
                    </View>
                    <Text style={[styles.sectionTitle, { marginTop: 24, textAlign: 'center' }]}>Estatísticas Indisponíveis</Text>
                    <Text style={styles.emptyDescription}>
                        Você precisa completar o cadastro da sua empresa e receber seus primeiros pedidos para visualizar o faturamento e métricas.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Painel de Analytics</Text>
                <TouchableOpacity onPress={handleRefresh}>
                    <Ionicons name="refresh" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
            >
                <FadeInView delay={100} translateY={10}>
                    <View style={styles.mainCard}>
                        <Text style={styles.cardLabel}>FATURAMENTO TOTAL (30D)</Text>
                        <Text style={styles.cardValue}>
                            {data?.totalRevenue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                        </Text>
                        <View style={styles.subMetrics}>
                            <View style={styles.subMetric}>
                                <Text style={styles.subMetricLabel}>PENDENTE</Text>
                                <Text style={styles.subMetricValue}>
                                    {data?.pendingRevenue?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                                </Text>
                            </View>
                            <View style={[styles.subMetric, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)', paddingLeft: 16 }]}>
                                <Text style={styles.subMetricLabel}>CONCLUÍDOS</Text>
                                <Text style={styles.subMetricValue}>{data?.completedOrders || 0}</Text>
                            </View>
                        </View>
                    </View>
                </FadeInView>

                <FadeInView delay={200} translateY={10}>
                    <View style={styles.chartSection}>
                        <Text style={styles.sectionTitle}>Volume de Pedidos (7 dias)</Text>
                        <LineChart
                            data={{
                                labels: data?.dailyOrders?.labels || [],
                                datasets: [{ data: data?.dailyOrders?.data || [0] }]
                            }}
                            width={width - 48}
                            height={220}
                            chartConfig={{
                                backgroundColor: Colors.white,
                                backgroundGradientFrom: Colors.white,
                                backgroundGradientTo: Colors.white,
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(0, 102, 255, ${opacity})`,
                                labelColor: (opacity = 1) => Colors.textTertiary,
                                style: { borderRadius: 16 },
                                propsForDots: {
                                    r: "6",
                                    strokeWidth: "2",
                                    stroke: Colors.primary
                                }
                            }}
                            bezier
                            style={styles.chart}
                        />
                    </View>
                </FadeInView>

                <FadeInView delay={300} translateY={10}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Melhores Serviços</Text>
                        <View style={styles.topServicesList}>
                            {data?.topServices?.map((service, idx) => (
                                <View key={idx} style={styles.serviceItem}>
                                    <View style={styles.serviceRank}>
                                        <Text style={styles.rankText}>{idx + 1}</Text>
                                    </View>
                                    <View style={styles.serviceInfo}>
                                        <Text style={styles.serviceName}>{service.name}</Text>
                                        <Text style={styles.serviceCount}>{service.count} pedidos</Text>
                                    </View>
                                    <Ionicons name="trending-up" size={20} color={Colors.success} />
                                </View>
                            ))}
                            {(!data?.topServices || data.topServices.length === 0) && (
                                <Text style={styles.emptyText}>Dados insuficientes no momento.</Text>
                            )}
                        </View>
                    </View>
                </FadeInView>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: Colors.white,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        ...Shadows.sm
    },
    title: { ...Typography.h3, fontWeight: '900', color: Colors.text },
    content: { padding: 24 },
    scrollContent: { padding: 24, gap: 24 },
    mainCard: {
        backgroundColor: Colors.primary,
        borderRadius: 32,
        padding: 24,
        ...Shadows.lg
    },
    cardLabel: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 8 },
    cardValue: { fontSize: 32, fontWeight: '900', color: Colors.white, marginBottom: 20 },
    subMetrics: { flexDirection: 'row', gap: 16 },
    subMetric: { flex: 1 },
    subMetricLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
    subMetricValue: { fontSize: 16, fontWeight: '800', color: Colors.white },
    chartSection: {
        backgroundColor: Colors.white,
        borderRadius: 32,
        padding: 20,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: Colors.borderLight
    },
    sectionTitle: { ...Typography.label, fontWeight: '900', color: Colors.text, marginBottom: 16 },
    chart: { marginVertical: 8, borderRadius: 16 },
    section: { gap: 12 },
    topServicesList: {
        backgroundColor: Colors.white,
        borderRadius: 32,
        padding: 16,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: Colors.borderLight
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight
    },
    serviceRank: {
        width: 32,
        height: 32,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    rankText: { fontSize: 14, fontWeight: '900', color: Colors.text },
    serviceInfo: { flex: 1 },
    serviceName: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 2 },
    serviceCount: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary },
    emptyText: { textAlign: 'center', color: Colors.textTertiary, padding: 20, fontWeight: '600' },
    emptyDescription: { 
        textAlign: 'center', 
        color: Colors.textTertiary, 
        paddingHorizontal: 40, 
        marginTop: 8,
        lineHeight: 20,
        fontWeight: '500'
    },
    emptyIconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: Colors.borderLight
    },
});
