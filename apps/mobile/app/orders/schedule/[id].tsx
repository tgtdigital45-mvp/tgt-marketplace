import React, { useEffect, useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '../../../utils/supabase';
import { createPaymentIntent } from '../../../utils/stripe';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Shadows } from '../../../utils/theme';
import { logger } from '../../../utils/logger';

type Order = {
    id: string;
    total_price: number | null;
    services: {
        title: string;
        location_type: string;
        estimated_duration: number | null;
        duration_unit: string | null;
        price_type: 'fixed' | 'budget';
    } | null;
    companies: {
        business_name: string;
        opening_hours: any;
        has_lunch_break: boolean;
        lunch_start: string;
        lunch_end: string;
        works_on_holidays: boolean;
    } | null;
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function buildNextDays(count = 14) {
    const days: { date: Date; day: string; month: string; num: number }[] = [];
    const now = new Date();
    for (let i = 1; i <= count; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        d.setHours(0, 0, 0, 0);
        days.push({ date: d, day: WEEKDAYS[d.getDay()], month: MONTHS[d.getMonth()], num: d.getDate() });
    }
    return days;
}

export default function ScheduleScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);

    const days = useMemo(() => buildNextDays(10), []);

    useEffect(() => {
        if (!id) return;
        supabase
            .from('service_orders')
            .select(`
                id,
                total_price,
                services(title, location_type, estimated_duration, duration_unit, price_type),
                companies!service_orders_company_id_fkey(
                    business_name,
                    opening_hours,
                    has_lunch_break,
                    lunch_start,
                    lunch_end,
                    works_on_holidays
                )
            `)
            .eq('id', id)
            .single()
            .then(({ data, error }) => {
                if (error) logger.error('Schedule fetch error:', error);
                else setOrder(data as unknown as Order);
                setLoading(false);
            });
    }, [id]);

    const canConfirm = selectedDay !== null && selectedTime !== null && !confirming;

    const handleConfirm = async () => {
        if (!canConfirm || !order) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setConfirming(true);

        try {
            const clientSecret = await createPaymentIntent(order.id);

            const { error: initError } = await initPaymentSheet({
                paymentIntentClientSecret: clientSecret,
                merchantDisplayName: 'CONTRATTO',
                defaultBillingDetails: {},
                style: 'alwaysLight',
                googlePay: { merchantCountryCode: 'BR', currencyCode: 'BRL', testEnv: false },
            });

            if (initError) throw new Error(initError.message);

            const { error: presentError } = await presentPaymentSheet();

            if (presentError) {
                if (presentError.code === 'Canceled') {
                    setConfirming(false);
                    return;
                }
                throw new Error(presentError.message);
            }

            const chosenDay = days[selectedDay!];
            const [hours, minutes] = selectedTime!.split(':').map(Number);
            const scheduledFor = new Date(chosenDay.date);
            scheduledFor.setHours(hours, minutes, 0, 0);

            const { error: updateError } = await supabase
                .from('service_orders')
                .update({
                    status: 'accepted',
                    scheduled_for: scheduledFor.toISOString(),
                })
                .eq('id', order.id);

            if (updateError) throw updateError;
            
            // Se for do tipo 'budget', buscar a proposta relacionada e atualizar status
            if (order.services?.price_type === 'budget') {
                await supabase
                    .from('order_proposals')
                    .update({ status: 'accepted' })
                    .eq('order_id', order.id)
                    .eq('status', 'pending');
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                '✅ Pagamento Confirmado!',
                `Serviço agendado para ${chosenDay.day}, ${chosenDay.num}/${chosenDay.month} às ${selectedTime}.`,
                [{ text: 'Ver meus pedidos', onPress: () => router.replace('/(tabs)/orders') }]
            );
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Erro desconhecido';
            logger.error('Checkout error:', msg);
            Alert.alert('Erro no Pagamento', msg);
            setConfirming(false);
        }
    };

    const dynamicTimeSlots = useMemo(() => {
        if (!order || selectedDay === null || !order.companies?.opening_hours) return [];

        const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const chosenDay = days[selectedDay];
        const dayKey = dayMap[chosenDay.date.getDay()];
        const config = order.companies.opening_hours[dayKey];

        if (!config || !config.active) return [];

        const slots: string[] = [];
        const [startH, startM] = config.open.split(':').map(Number);
        const [endH, endM] = config.close.split(':').map(Number);

        const durationMin = order.services?.duration_unit === 'hours'
            ? (order.services.estimated_duration || 1) * 60
            : order.services?.duration_unit === 'days'
                ? 1440
                : (order.services?.estimated_duration || 60);

        let current = new Date(chosenDay.date);
        current.setHours(startH, startM, 0, 0);

        const limit = new Date(chosenDay.date);
        limit.setHours(endH, endM, 0, 0);

        while (current < limit) {
            const timeStr = current.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            let isLunch = false;
            if (order.companies.has_lunch_break) {
                const [lStartH, lStartM] = order.companies.lunch_start.split(':').map(Number);
                const [lEndH, lEndM] = order.companies.lunch_end.split(':').map(Number);
                const lunchS = new Date(chosenDay.date).setHours(lStartH, lStartM, 0, 0);
                const lunchE = new Date(chosenDay.date).setHours(lEndH, lEndM, 0, 0);
                if (current.getTime() >= lunchS && current.getTime() < lunchE) isLunch = true;
            }

            if (!isLunch) slots.push(timeStr);

            const step = order.services?.duration_unit === 'days' ? 1440 : Math.max(30, durationMin);
            current.setMinutes(current.getMinutes() + step);
        }

        return slots;
    }, [order, selectedDay, days]);

    if (loading || !order) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    const priceDisplay = order.total_price != null
        ? `R$ ${Number(order.total_price).toFixed(2)}`
        : 'A definir';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']} aria-label="Agendamento">
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={22} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Agendamento e Pagamento</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.summaryCard}>
                    <View style={styles.summaryIconBox}>
                        <Ionicons name="calendar" size={24} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.serviceTitle} numberOfLines={2}>
                            {order.services?.title ?? 'Serviço'}
                        </Text>
                        <Text style={styles.companyName}>
                            com {order.companies?.business_name ?? 'Profissional'}
                        </Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Escolha o dia</Text>
                <Text style={styles.sectionSubtitle}>Próximos 10 dias disponíveis</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScrollContent}>
                    {days.map((day, idx) => {
                        const isSelected = selectedDay === idx;
                        return (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.dateBox, isSelected && styles.dateBoxSelected]}
                                onPress={() => { Haptics.selectionAsync(); setSelectedDay(idx); setSelectedTime(null); }}
                                activeOpacity={0.75}
                            >
                                <Text style={[styles.dateDayLabel, isSelected && styles.textWhite]}>{day.day}</Text>
                                <Text style={[styles.dateNum, isSelected && styles.textWhite]}>{day.num}</Text>
                                <Text style={[styles.dateMonth, isSelected && styles.textWhiteMuted]}>{day.month}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {selectedDay !== null && (
                    <>
                        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Escolha o horário</Text>
                        <Text style={styles.sectionSubtitle}>
                            {days[selectedDay].day}, {days[selectedDay].num} de {days[selectedDay].month}
                        </Text>
                        <View style={styles.timeGrid}>
                            {dynamicTimeSlots.length > 0 ? (
                                dynamicTimeSlots.map((slot) => {
                                    const isSelected = selectedTime === slot;
                                    return (
                                        <TouchableOpacity
                                            key={slot}
                                            style={[styles.timeBox, isSelected && styles.timeBoxSelected]}
                                            onPress={() => { Haptics.selectionAsync(); setSelectedTime(slot); }}
                                            activeOpacity={0.75}
                                        >
                                            <Ionicons name="time-outline" size={15} color={isSelected ? Colors.white : Colors.textSecondary} />
                                            <Text style={[styles.timeText, isSelected && styles.textWhite]}>{slot}</Text>
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <Text style={styles.noSlotsText}>Nenhum horário disponível para este dia.</Text>
                            )}
                        </View>
                    </>
                )}

                {selectedDay !== null && selectedTime !== null && (
                    <View style={styles.choiceCard}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                        <Text style={styles.choiceText}>
                            {days[selectedDay].day}, {days[selectedDay].num}/{days[selectedDay].month} às {selectedTime}
                        </Text>
                    </View>
                )}

                {order.services?.location_type === 'at_home' && (
                    <View style={styles.infoBox}>
                        <Ionicons name="home-outline" size={20} color={Colors.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoTitle}>Serviço em Domicílio</Text>
                            <Text style={styles.infoDesc}>O profissional irá até onde você estiver.</Text>
                        </View>
                    </View>
                )}

                <View style={[styles.infoBox, { backgroundColor: Colors.surface, borderColor: Colors.borderLight }]}>
                    <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.infoTitle, { color: Colors.text }]}>Pagamento Seguro via Stripe</Text>
                        <Text style={[styles.infoDesc, { color: Colors.primary }]}>
                            Seus dados são protegidos. Nunca armazenamos informações do cartão.
                        </Text>
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.bottomBar}>
                <View style={styles.bottomInfo}>
                    <Text style={styles.bottomLabel}>Valor total</Text>
                    <Text style={styles.bottomValue}>{priceDisplay}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.confirmBtn, !canConfirm && { opacity: 0.45 }]}
                    disabled={!canConfirm}
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                >
                    {confirming
                        ? <ActivityIndicator color={Colors.white} size="small" />
                        : (
                            <>
                                <Ionicons name="card" size={18} color={Colors.white} />
                                <Text style={styles.confirmBtnText}>Pagar e Confirmar</Text>
                            </>
                        )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
    container: { flex: 1, backgroundColor: Colors.surface },

    navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },

    scrollContent: { paddingHorizontal: 24, paddingTop: 8 },

    summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.white, padding: 18, borderRadius: 20, marginBottom: 28, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },
    summaryIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    serviceTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 4, letterSpacing: -0.2 },
    companyName: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

    sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, letterSpacing: -0.4, marginBottom: 4 },
    sectionSubtitle: { fontSize: 13, color: Colors.textTertiary, fontWeight: '500', marginBottom: 16 },

    dateScrollContent: { paddingBottom: 4, gap: 10 },
    dateBox: { width: 68, height: 88, borderRadius: 18, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', gap: 2 },
    dateBoxSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5 },
    dateDayLabel: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary },
    dateNum: { fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
    dateMonth: { fontSize: 11, fontWeight: '600', color: Colors.textTertiary },
    textWhite: { color: Colors.white },
    textWhiteMuted: { color: 'rgba(255,255,255,0.7)' },

    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    timeBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, minWidth: '22%' },
    timeBoxSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary, shadowColor: Colors.primary, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
    timeText: { fontSize: 14, fontWeight: '700', color: Colors.text },

    choiceCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ECFDF5', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#D1FAE5' },
    choiceText: { fontSize: 14, fontWeight: '700', color: '#065F46' },

    infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.primaryLight, padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#DBEAFE' },
    infoTitle: { fontSize: 14, fontWeight: '700', color: '#1D4ED8', marginBottom: 3 },
    infoDesc: { fontSize: 12, color: '#3B82F6', lineHeight: 18, fontWeight: '500' },

    bottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 24, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.borderLight, ...Shadows.md },
    bottomInfo: { flex: 1 },
    bottomLabel: { fontSize: 12, color: Colors.textTertiary, fontWeight: '600', marginBottom: 2 },
    bottomValue: { fontSize: 22, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
    confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 16, shadowColor: Colors.primary, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4 },
    confirmBtnText: { color: Colors.white, fontSize: 15, fontWeight: '800' },
    noSlotsText: { fontSize: 14, color: Colors.textTertiary, fontWeight: '500', marginTop: 10, fontStyle: 'italic' },
});
