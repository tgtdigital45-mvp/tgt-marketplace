import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
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
import { Calendar, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  monthNamesShort: ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt-br';

type CalendarOrder = {
    id: string;
    scheduled_for: string;
    status: string;
    price: number | null;
    profiles: { full_name: string } | null;
    services: { title: string; duration_minutes?: number; duration?: string } | null;
};

export default function CalendarTabScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<CalendarOrder[]>([]);
    const [error, setError] = useState(false);
    
    // YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);

    const fetchOrders = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(false);

        // Fetch all upcoming/current active orders to mark on calendar
        const today = new Date();
        today.setMonth(today.getMonth() - 1); // Get from last month to next few months
        const startRange = today.toISOString();

        try {
            const { data, error: fetchError } = await supabase
                .from('orders')
                .select('id, scheduled_for, status, price, profiles!orders_buyer_id_fkey(full_name), services(title, duration_minutes, duration)')
                .eq('seller_id', user.id)
                .in('status', ['accepted', 'in_progress'])
                .gte('scheduled_for', startRange)
                .order('scheduled_for', { ascending: true });

            if (fetchError) throw fetchError;
            setOrders(data as unknown as CalendarOrder[]);
        } catch (err) {
            logger.error('Error fetching calendar orders:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const markedDates = useMemo(() => {
        const marks: any = {};
        orders.forEach(o => {
            if (o.scheduled_for) {
                const dateStr = o.scheduled_for.split('T')[0];
                marks[dateStr] = { marked: true, dotColor: Colors.primary };
            }
        });
        marks[selectedDate] = { 
            ...marks[selectedDate], 
            selected: true, 
            selectedColor: Colors.primary,
            disableTouchEvent: true 
        };
        return marks;
    }, [orders, selectedDate]);

    const dailyOrders = useMemo(() => {
        return orders.filter(o => o.scheduled_for?.startsWith(selectedDate));
    }, [orders, selectedDate]);

    const onDayPress = (day: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedDate(day.dateString);
    };

    if (loading && orders.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} aria-label="Agenda">
                <View style={[styles.header, { justifyContent: 'center' }]}>
                    <Text style={styles.headerTitle}>Agendas</Text>
                </View>
                <View style={styles.list}>
                    <Skeleton width="100%" height={320} borderRadius={20} style={{ marginBottom: 30 }} />
                    {[1, 2].map((i) => (
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

    if (error && orders.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} aria-label="Agenda">
                <View style={[styles.header, { justifyContent: 'center' }]}>
                    <Text style={styles.headerTitle}>Agendas</Text>
                </View>
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

    const [year, month, day] = selectedDate.split('-');
    const displayDate = `${day}/${month}/${year}`;

    return (
        <SafeAreaView style={styles.container} edges={['top']} aria-label="Agenda">
            <View style={[styles.header, { justifyContent: 'center' }]}>
                <Text style={styles.headerTitle}>Agendas</Text>
            </View>

            <FlatList
                data={dailyOrders}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <FadeInView delay={100} style={{ marginBottom: Spacing.xl }}>
                        <View style={styles.calendarWrapper}>
                            <Calendar
                                current={selectedDate}
                                onDayPress={onDayPress}
                                markedDates={markedDates}
                                theme={{
                                    backgroundColor: 'transparent',
                                    calendarBackground: 'transparent',
                                    textSectionTitleColor: Colors.textTertiary,
                                    selectedDayBackgroundColor: Colors.primary,
                                    selectedDayTextColor: Colors.white,
                                    todayTextColor: Colors.primary,
                                    dayTextColor: Colors.text,
                                    textDisabledColor: Colors.border,
                                    dotColor: Colors.primary,
                                    selectedDotColor: Colors.white,
                                    arrowColor: Colors.primary,
                                    monthTextColor: Colors.text,
                                    textDayFontWeight: '600',
                                    textMonthFontWeight: '900',
                                    textDayHeaderFontWeight: '700',
                                    textDayFontSize: 15,
                                    textMonthFontSize: 18,
                                }}
                            />
                        </View>
                        
                        <View style={styles.dayHeader}>
                            <Text style={styles.dayHeaderText}>Serviços do dia {displayDate}</Text>
                        </View>
                    </FadeInView>
                }
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
                    const dateObj = new Date(item.scheduled_for);
                    const time = dateObj.toLocaleTimeString('pt-BR', {
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
                                        // Redireciona para o chat relacionado a esta ordem, conforme pedido
                                        router.push(`/orders/chat?orderId=${item.id}`);
                                    }}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.serviceTitle}>{item.services?.title}</Text>
                                        <Ionicons name="chatbubbles-outline" size={18} color={Colors.primary} />
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
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.white,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...Shadows.sm,
        zIndex: 10
    },
    headerTitle: { ...Typography.h3, color: Colors.text, fontWeight: '900' },
    
    calendarWrapper: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 10,
        ...Shadows.md,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    
    dayHeader: {
        marginTop: Spacing.xl,
        marginBottom: Spacing.md,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        paddingBottom: 10
    },
    dayHeaderText: {
        ...Typography.h4,
        color: Colors.text,
        fontWeight: '900',
    },

    list: { padding: Spacing.lg, paddingBottom: 100 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40, paddingBottom: 60 },

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
    serviceTitle: { ...Typography.h4, color: Colors.text, flex: 1 },

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
