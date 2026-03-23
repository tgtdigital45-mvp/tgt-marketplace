import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../utils/theme';
import * as Haptics from 'expo-haptics';
import FadeInView from '../../components/ui/FadeInView';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { logger } from '../../utils/logger';

type CalendarOrder = {
    id: string;
    scheduled_for: string;
    status: string;
    price: number | null;
    profiles: { full_name: string } | null;
    services: { title: string; duration_minutes?: number; duration?: string } | null;
};

export default function CalendarScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<CalendarOrder[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [error, setError] = useState(false);

    const fetchOrders = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(false);

        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        try {
            const { data, error: fetchError } = await supabase
                .from('orders')
                .select('id, scheduled_for, status, price, profiles!orders_buyer_id_fkey(full_name), services(title, duration_minutes, duration)')
                .eq('seller_id', user.id)
                .eq('status', 'accepted')
                .gte('scheduled_for', startOfDay.toISOString())
                .lte('scheduled_for', endOfDay.toISOString())
                .order('scheduled_for', { ascending: true });

            if (fetchError) throw fetchError;
            setOrders(data as unknown as CalendarOrder[]);
        } catch (err) {
            logger.error('Error fetching calendar orders:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [user, selectedDate]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const changeDate = (days: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const next = new Date(selectedDate);
        next.setDate(selectedDate.getDate() + days);
        setSelectedDate(next);
    };

    const renderHeader = () => {
        const dateStr = selectedDate.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        return (
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.dateSelector}>
                    <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navBtn}>
                        <Ionicons name="chevron-back" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.dateLabelBox}>
                        <Text style={styles.dateLabel}>{dateStr}</Text>
                    </View>
                    <TouchableOpacity onPress={() => changeDate(1)} style={styles.navBtn}>
                        <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
                <View style={{ width: 40 }} />
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} aria-label="Agenda">
                {renderHeader()}
                <View style={styles.list}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={{ flexDirection: 'row', marginBottom: 20 }}>
                            <Skeleton width={50} height={20} borderRadius={4} />
                            <View style={{ marginLeft: 15, flex: 1 }}>
                                <Skeleton width="100%" height={100} borderRadius={20} />
                            </View>
                        </View>
                    ))}
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} aria-label="Agenda">
                {renderHeader()}
                <FadeInView delay={100} style={styles.emptyContainer}>
                    <EmptyState
                        icon="alert-circle-outline"
                        title="Opa, algo deu errado"
                        subtitle="Não conseguimos carregar sua agenda. Verifique sua conexão e tente novamente."
                        actionLabel="Tentar Novamente"
                        onAction={fetchOrders}
                        isError={true}
                    />
                </FadeInView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']} aria-label="Agenda">
            {renderHeader()}

            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <FadeInView delay={300} style={styles.emptyContainer}>
                        <EmptyState
                            icon="calendar-outline"
                            title="Dia livre!"
                            subtitle="Você não tem nenhum compromisso agendado para esta data."
                        />
                    </FadeInView>
                }
                renderItem={({ item, index }) => {
                    const date = new Date(item.scheduled_for);
                    const time = date.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    return (
                        <FadeInView delay={index * 50} translateY={10}>
                            <View style={styles.orderCard}>
                                <View style={styles.timeColumn}>
                                    <View style={styles.timeBadge}>
                                        <Text style={styles.timeText}>{time}</Text>
                                    </View>
                                    <View style={styles.line} />
                                </View>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    style={styles.contentCard}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        router.push(`/orders/${item.id}`);
                                    }}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.serviceTitle}>{item.services?.title}</Text>
                                        <Ionicons name="chevron-forward" size={16} color={Colors.border} />
                                    </View>

                                    <View style={styles.clientInfo}>
                                        <Ionicons name="person-outline" size={14} color={Colors.textTertiary} />
                                        <Text style={styles.clientName}>
                                            {item.profiles?.full_name}
                                        </Text>
                                    </View>

                                    <View style={styles.cardFooter}>
                                        <View style={styles.durationBadge}>
                                            <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
                                            <Text style={styles.durationText}>
                                                {item.services?.duration_minutes 
                                                    ? (item.services.duration_minutes >= 60 && item.services.duration_minutes % 60 === 0 
                                                        ? `${item.services.duration_minutes / 60}h` 
                                                        : `${item.services.duration_minutes} min`) 
                                                    : (item.services?.duration || '--')}
                                            </Text>
                                        </View>
                                        <Text style={styles.priceText}>
                                            {item.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'A definir'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.white,
        ...Shadows.sm
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 4, paddingVertical: 4 },
    navBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
    dateLabelBox: { paddingHorizontal: 12 },
    dateLabel: { ...Typography.caption, fontWeight: '800', color: Colors.text, textTransform: 'capitalize' },

    list: { padding: Spacing.lg },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },

    orderCard: { flexDirection: 'row', marginBottom: Spacing.md, gap: 15 },
    timeColumn: { alignItems: 'center', width: 60, paddingTop: 4 },
    timeBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    timeText: { fontSize: 13, fontWeight: '900', color: Colors.primary },
    line: { flex: 1, width: 2, backgroundColor: Colors.borderLight, borderRadius: 1, marginTop: 10 },

    contentCard: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 20,
        ...Shadows.md,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    serviceTitle: { ...Typography.h4, color: Colors.text },

    clientInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    clientName: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: Colors.surface,
        paddingTop: 12,
    },
    durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    durationText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
    priceText: { ...Typography.bodySmall, color: Colors.successDark, fontWeight: '900' }
});
