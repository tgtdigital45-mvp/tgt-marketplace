import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Profile } from '../../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { supabase } from '../../../utils/supabase';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../../utils/theme';
import FadeInView from '../../../components/ui/FadeInView';
import { Skeleton } from '../../../components/ui/SkeletonLoader';

type ProviderDashboardProps = {
    profile: Profile;
    company: any;
};

type ScheduleItem = {
    id: string;
    scheduled_for: string;
    status: string;
    total_price: number | null;
    services: { title: string } | null;
    profiles: { first_name: string; last_name: string | null } | null;
};

const { width } = Dimensions.get('window');

export default function ProviderDashboard({ profile, company }: ProviderDashboardProps) {
    const router = useRouter();
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
    const [metrics, setMetrics] = useState({ totalEarnings: 0, totalServices: 0, activeOrders: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        if (!profile?.id) return;
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .eq('is_read', false);
        setUnreadNotifications(count || 0);
    }, [profile?.id]);

    const fetchPendingOrders = useCallback(async () => {
        if (!company?.id) return;
        const { data, error } = await supabase
            .from('service_orders')
            .select('*, profiles!service_orders_client_id_fkey(first_name, last_name), services(title, price_type)')
            .eq('company_id', company.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (!error && data) setPendingOrders(data);
    }, [company?.id]);

    const fetchTodaySchedule = useCallback(async () => {
        if (!company?.id) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data, error } = await supabase
            .from('service_orders')
            .select('id, scheduled_for, status, total_price, services(title), profiles!service_orders_client_id_fkey(first_name, last_name)')
            .eq('company_id', company.id)
            .in('status', ['accepted', 'in_progress'])
            .gte('scheduled_for', today.toISOString())
            .lt('scheduled_for', tomorrow.toISOString())
            .order('scheduled_for', { ascending: true });
        if (!error && data) setTodaySchedule(data as unknown as ScheduleItem[]);
    }, [company?.id]);

    const fetchMetrics = useCallback(async () => {
        if (!company?.id) return;
        const [{ data: completedOrders }, { count: activeCount }] = await Promise.all([
            supabase.from('service_orders').select('total_price').eq('company_id', company.id).eq('status', 'completed'),
            supabase.from('service_orders').select('*', { count: 'exact', head: true }).eq('company_id', company.id).in('status', ['accepted', 'in_progress'])
        ]);

        const totalEarnings = (completedOrders || []).reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
        setMetrics({ totalEarnings, totalServices: completedOrders?.length || 0, activeOrders: activeCount || 0 });
    }, [company?.id]);

    const loadAll = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        await Promise.all([fetchUnreadCount(), fetchPendingOrders(), fetchTodaySchedule(), fetchMetrics()]);
        setIsLoading(false);
    }, [fetchUnreadCount, fetchPendingOrders, fetchTodaySchedule, fetchMetrics]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await loadAll(true);
        setRefreshing(false);
    }, [loadAll]);

    const formatCurrency = (val: number) =>
        val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const navigateTo = (path: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(path as any);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} aria-label="Dashboard">
                <View style={styles.header}>
                    <View>
                        <Skeleton width={120} height={20} borderRadius={4} style={{ marginBottom: 6 }} />
                        <Skeleton width={180} height={28} borderRadius={4} />
                    </View>
                    <Skeleton width={44} height={44} borderRadius={22} />
                </View>
                <View style={{ padding: 24 }}>
                    <Skeleton width="100%" height={200} borderRadius={24} style={{ marginBottom: 24 }} />
                    <Skeleton width="100%" height={80} borderRadius={16} style={{ marginBottom: 12 }} />
                    <Skeleton width="100%" height={80} borderRadius={16} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']} aria-label="Dashboard">
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Bem-vindo de volta,</Text>
                    <Text style={styles.businessName} numberOfLines={1}>{company?.business_name || profile.first_name}</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => navigateTo('/notifications')}>
                        <Ionicons name="notifications-outline" size={24} color={Colors.text} />
                        {unreadNotifications > 0 && <View style={styles.badge} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.profileBtn} onPress={() => navigateTo('/(tabs)/profile')}>
                        {profile.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                        ) : (
                            <Text style={styles.avatarInitial}>{(profile.first_name || 'P')[0]}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                <FadeInView delay={100} translateY={20}>
                    <TouchableOpacity
                        style={styles.mainCard}
                        activeOpacity={0.9}
                        onPress={() => navigateTo('/company/finance')}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.labelGroup}>
                                <Ionicons name="wallet-outline" size={16} color="rgba(255,255,255,0.6)" />
                                <Text style={styles.cardLabel}>RECEITA TOTAL</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
                        </View>
                        <Text style={styles.cardValue}>{formatCurrency(metrics.totalEarnings)}</Text>
                        <View style={styles.cardMetrics}>
                            <View style={styles.metric}>
                                <Text style={styles.metricVal}>{metrics.totalServices}</Text>
                                <Text style={styles.metricLab}>Vendidos</Text>
                            </View>
                            <View style={styles.metricDivider} />
                            <View style={styles.metric}>
                                <Text style={styles.metricVal}>{metrics.activeOrders}</Text>
                                <Text style={styles.metricLab}>Agendados</Text>
                            </View>
                            <View style={styles.metricDivider} />
                            <View style={styles.metric}>
                                <Text style={styles.metricVal}>{pendingOrders.length}</Text>
                                <Text style={styles.metricLab}>Pedidos</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </FadeInView>

                {/* Grid de Ações */}
                <View style={styles.quickGrid}>
                    {[
                        { icon: 'construct-outline', label: 'Serviços', route: '/company/manage-services', color: '#0EA5E9' },
                        { icon: 'calendar-outline', label: 'Agenda', route: '/company/calendar', color: Colors.info },
                        { icon: 'receipt-outline', label: 'Pedidos', route: '/(tabs)/orders', color: Colors.warning },
                        { icon: 'storefront-outline', label: 'Vitrina', route: '/company/storefront', color: Colors.success },
                    ].map((item, i) => (
                        <FadeInView key={i} delay={200 + i * 50} style={{ width: '48%' }}>
                            <TouchableOpacity style={styles.gridItem} onPress={() => navigateTo(item.route)}>
                                <View style={[styles.gridIcon, { backgroundColor: item.color + '10' }]}>
                                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                                </View>
                                <Text style={styles.gridLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        </FadeInView>
                    ))}
                </View>

                {/* Seção de Compromissos */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Hoje na Agenda</Text>
                        <TouchableOpacity onPress={() => navigateTo('/company/calendar')}>
                            <Text style={styles.sectionLink}>Ver todos</Text>
                        </TouchableOpacity>
                    </View>

                    {todaySchedule.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <Ionicons name="calendar-clear-outline" size={32} color={Colors.border} />
                            <Text style={styles.emptyText}>Nenhum serviço para hoje.</Text>
                        </View>
                    ) : (
                        todaySchedule.map((item, idx) => (
                            <FadeInView key={item.id} delay={400 + idx * 100} translateY={10}>
                                <TouchableOpacity
                                    style={styles.scheduleRow}
                                    onPress={() => navigateTo(`/orders/${item.id}`)}
                                >
                                    <View style={styles.timeBox}>
                                        <Text style={styles.timeText}>
                                            {new Date(item.scheduled_for).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                        <View style={[styles.statusDot, { backgroundColor: item.status === 'in_progress' ? Colors.primary : Colors.success }]} />
                                    </View>
                                    <View style={styles.scheduleInfo}>
                                        <Text style={styles.serviceTitle} numberOfLines={1}>{item.services?.title}</Text>
                                        <Text style={styles.clientName}>{item.profiles?.first_name} {item.profiles?.last_name}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={Colors.border} />
                                </TouchableOpacity>
                            </FadeInView>
                        ))
                    )}
                </View>

                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.plansCard}
                        onPress={() => navigateTo('/company/plans')}
                    >
                        <View style={styles.plansContent}>
                            <Text style={styles.plansTitle}>Mude de Nível</Text>
                            <Text style={styles.plansSub}>Upgrade para taxas menores.</Text>
                        </View>
                        <View style={styles.plansIcon}>
                            <Ionicons name="diamond" size={20} color={Colors.white} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        backgroundColor: Colors.white,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        ...Shadows.sm
    },
    greeting: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '700' },
    businessName: { ...Typography.h3, color: Colors.text, fontWeight: '900' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    badge: { position: 'absolute', top: 12, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error, borderWidth: 2, borderColor: Colors.white },
    profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatar: { width: '100%', height: '100%' },
    avatarInitial: { ...Typography.label, color: Colors.text, fontWeight: '800' },

    mainCard: {
        backgroundColor: Colors.text,
        borderRadius: 32,
        padding: 28,
        marginTop: Spacing.md,
        ...Shadows.xl
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    labelGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardLabel: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
    cardValue: { ...Typography.h1, color: Colors.white, fontSize: 36, letterSpacing: -1, marginBottom: 24 },
    cardMetrics: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.08)', padding: 16, borderRadius: 20 },
    metric: { alignItems: 'center', flex: 1 },
    metricDivider: { width: 1, height: '60%', backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center' },
    metricVal: { fontSize: 18, fontWeight: '900', color: Colors.white, marginBottom: 2 },
    metricLab: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },

    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginTop: 28 },
    gridItem: {
        backgroundColor: Colors.white,
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.md
    },
    gridIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    gridLabel: { ...Typography.caption, fontWeight: '800', color: Colors.text },

    section: { marginTop: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { ...Typography.h4, color: Colors.text },
    sectionLink: { ...Typography.caption, color: Colors.primary, fontWeight: '800' },

    emptyBox: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderStyle: 'dashed'
    },
    emptyText: { ...Typography.caption, color: Colors.textTertiary, marginTop: 12, fontWeight: '600' },

    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.sm
    },
    timeBox: { alignItems: 'center', width: 60, borderRightWidth: 1, borderRightColor: Colors.borderLight, marginRight: 16 },
    timeText: { fontSize: 13, fontWeight: '900', color: Colors.text },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
    scheduleInfo: { flex: 1 },
    serviceTitle: { ...Typography.bodySmall, fontWeight: '800', color: Colors.text, marginBottom: 2 },
    clientName: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '600' },

    plansCard: {
        backgroundColor: '#0EA5E9',
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...Shadows.md
    },
    plansContent: { flex: 1 },
    plansTitle: { ...Typography.h4, color: Colors.white, marginBottom: 4 },
    plansSub: { ...Typography.caption, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
    plansIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }
});
