import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../utils/theme';
import { Skeleton, SkeletonOrderCard } from '../../components/ui/SkeletonLoader';
import FadeInView from '../../components/ui/FadeInView';
import EmptyState from '../../components/ui/EmptyState';
import * as Haptics from 'expo-haptics';
import { logger } from '../../utils/logger';

type ServiceOrder = {
    id: string;
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'canceled';
    scheduled_for: string | null;
    price: number | null;
    created_at: string;
    services: { 
        title: string;
        companies: { company_name: string } | null;
    } | null;
};

const STATUS_MAP: Record<ServiceOrder['status'], { label: string; color: string }> = {
    pending: { label: 'Aguardando', color: Colors.warning },
    accepted: { label: 'Confirmado', color: Colors.primary },
    in_progress: { label: 'Em andamento', color: '#0EA5E9' },
    completed: { label: 'Finalizado', color: Colors.success },
    canceled: { label: 'Cancelado', color: Colors.error },
};

function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Data a definir';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
        weekday: 'short', day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function OrdersScreen() {
    const router = useRouter();
    const { user, profile } = useAuth();

    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(false);

    // Pagination state
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const PAGE_SIZE = 15;
    const pageRef = useRef(0);

    const fetchOrders = useCallback(async (silent = false, isLoadMore = false) => {
        if (!user) return;
        if (!silent && !isLoadMore) setIsLoading(true);
        if (isLoadMore) setIsLoadingMore(true);
        setError(false);

        try {
            const currentPage = isLoadMore ? pageRef.current : 0;
            const from = currentPage * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = supabase
                .from('orders')
                .select('id, status, scheduled_for, price, created_at, services(title, companies(company_name))')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (profile?.user_type === 'client') {
                query = query.eq('buyer_id', user.id);
            } else {
                // Para prestadores, filtramos pelo seller_id (que é o user id do perfil pro)
                query = query.eq('seller_id', user.id);
            }

            const { data, error } = await query;
            if (error) throw error;

            const fetchedOrders = (data as unknown as ServiceOrder[]) ?? [];

            if (isLoadMore) {
                setOrders(prev => {
                    const existingIds = new Set(prev.map(o => o.id));
                    const newOrders = fetchedOrders.filter(o => !existingIds.has(o.id));
                    return [...prev, ...newOrders];
                });
            } else {
                setOrders(fetchedOrders);
            }

            setHasMore(fetchedOrders.length === PAGE_SIZE);
            pageRef.current = currentPage + 1;
            setPage(pageRef.current);

        } catch (e) {
            logger.error('Error fetching orders:', e);
            setError(true);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            setIsLoadingMore(false);
        }
    }, [user, profile]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel('orders_list_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' },
                () => fetchOrders(true))
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user, fetchOrders]);

    const handleRefresh = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsRefreshing(true);
        fetchOrders(true);
    };

    const handleOrderPress = (orderId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/orders/${orderId}`);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Skeleton width={180} height={34} borderRadius={8} />
                    <Skeleton width={32} height={32} borderRadius={16} />
                </View>
                <View style={styles.list}>
                    {[1, 2, 3, 4].map((i) => (
                        <SkeletonOrderCard key={i} />
                    ))}
                </View>
            </SafeAreaView>
        );
    }
    const getStatusLabel = (status: string) => {
        const normalized = status === 'cancelled' ? 'canceled' : status;
        const map: Record<string, string> = {
            pending: 'Pendente',
            accepted: 'Agendado',
            in_progress: 'Em execução',
            completed: 'Concluído',
            canceled: 'Cancelado',
            rejected: 'Recusado',
        };
        return map[normalized] || normalized;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']} aria-label="Pedidos">
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {profile?.user_type === 'company' ? 'Solicitações' : 'Meus Pedidos'}
                </Text>
                <TouchableOpacity onPress={handleRefresh} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="refresh" size={22} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.list, orders.length === 0 && styles.emptyList]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={Colors.primary}
                    />
                }
                onEndReached={() => {
                    if (hasMore && !isLoadingMore && !isLoading) {
                        fetchOrders(true, true);
                    }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    isLoadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} /> : null
                }
                ListEmptyComponent={
                    <FadeInView delay={300} style={styles.emptyContainer}>
                        {error ? (
                            <EmptyState
                                icon="cloud-offline-outline"
                                title="Erro de Conexão"
                                subtitle="Não foi possível carregar seus pedidos. Verifique sua rede."
                                actionLabel="Tentar Novamente"
                                onAction={() => fetchOrders()}
                            />
                        ) : (
                            <EmptyState
                                icon="receipt-outline"
                                title="Ninguém por aqui..."
                                subtitle={
                                    profile?.user_type === 'company'
                                        ? 'Novos pedidos e orçamentos aparecerão nesta lista.'
                                        : 'Ainda não encontramos pedidos em seu histórico.'
                                }
                            />
                        )}
                    </FadeInView>
                }
                renderItem={({ item, index }) => {
                    const { label, color } = STATUS_MAP[item.status] ?? { label: item.status, color: Colors.textSecondary };
                    return (
                        <FadeInView delay={index * 50} translateY={10}>
                            <TouchableOpacity
                                style={styles.orderCard}
                                activeOpacity={0.7}
                                onPress={() => handleOrderPress(item.id)}
                            >
                                <View style={styles.orderHeader}>
                                    <View style={styles.companyInfo}>
                                        <Ionicons name="business-outline" size={12} color={Colors.textTertiary} style={{ marginRight: 4 }} />
                                        <Text style={styles.companyName} numberOfLines={1}>
                                            {item.services?.companies?.company_name ?? 'Empresa'}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: color + '15' }]}>
                                        <View style={[styles.statusDot, { backgroundColor: color }]} />
                                        <Text style={[styles.statusText, { color }]}>{label}</Text>
                                    </View>
                                </View>

                                <Text style={styles.serviceName} numberOfLines={2}>
                                    {item.services?.title ?? 'Serviço'}
                                </Text>

                                <View style={styles.orderFooter}>
                                    <View style={styles.metaRow}>
                                        <View style={styles.iconInfo}>
                                            <Ionicons name="calendar" size={14} color={Colors.textTertiary} />
                                            <Text style={styles.dateText}>{formatDate(item.scheduled_for)}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.row}>
                                        {item.price != null && (
                                            <Text style={styles.priceText}>
                                                {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </Text>
                                        )}
                                        <View style={styles.arrowIcon}>
                                            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </FadeInView>
                    );
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.white,
        ...Shadows.sm,
    },
    headerTitle: {
        ...Typography.h1,
        color: Colors.text,
    },
    list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 120 },
    emptyList: { flex: 1, justifyContent: 'center' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },

    orderCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 20,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.md,
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    companyInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: Spacing.sm },
    companyName: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },

    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },

    serviceName: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.lg },

    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: Colors.borderLight,
        paddingTop: Spacing.md,
        marginTop: Spacing.sm,
    },
    metaRow: { flex: 1 },
    iconInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dateText: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '700' },

    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    priceText: { ...Typography.body, color: Colors.text, fontWeight: '900' },
    arrowIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
});
