import React, { useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
    StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { ArrowLeft, Clock, CalendarDays, CheckCircle } from 'lucide-react-native';
import { useBookingState } from '../../hooks/useBookingState';

function generateTimeSlots(durationMin: number): string[] {
    const slots: string[] = [];
    const startHour = 8;
    const endHour = 18;
    const step = durationMin >= 60 ? 60 : 30;

    for (let h = startHour; h < endHour; h++) {
        for (let m = 0; m < 60; m += step) {
            const endMinutes = h * 60 + m + durationMin;
            if (endMinutes <= endHour * 60) {
                slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            }
        }
    }
    return slots;
}

export default function SelectDateScreen() {
    const params = useLocalSearchParams<{
        serviceId: string;
        serviceTitle: string;
        servicePrice: string;
        companyName: string;
        durationMinutes: string;
    }>();

    const router = useRouter();
    const duration = parseInt(params.durationMinutes || '60', 10);

    const booking = useBookingState({
        serviceId: params.serviceId ?? '',
        serviceTitle: params.serviceTitle ?? '',
        servicePrice: parseFloat(params.servicePrice || '0'),
        companyName: params.companyName ?? '',
        durationMinutes: duration,
    });

    const timeSlots = useMemo(() => generateTimeSlots(duration), [duration]);
    const today = new Date().toISOString().split('T')[0];

    const markedDates: Record<string, any> = {};
    if (booking.selectedDate) {
        markedDates[booking.selectedDate] = {
            selected: true,
            selectedColor: '#2563eb',
            selectedTextColor: '#ffffff',
        };
    }

    const handleConfirm = () => {
        const data = booking.getBooking();
        if (!data) {
            Alert.alert('Atenção', 'Selecione uma data e horário.');
            return;
        }

        router.push({
            pathname: '/checkout',
            params: {
                serviceId: data.serviceId,
                serviceTitle: data.serviceTitle,
                servicePrice: String(data.servicePrice),
                companyName: data.companyName,
                durationMinutes: String(data.durationMinutes),
                selectedDate: data.selectedDate,
                selectedTime: data.selectedTime,
                packageTier: 'basic',
            },
        });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={22} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>Escolher Data</Text>
                </View>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                    {params.serviceTitle} • {params.companyName}
                </Text>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Calendar */}
                <View style={styles.calendarCard}>
                    <Calendar
                        minDate={today}
                        onDayPress={(day: DateData) => {
                            booking.setSelectedDate(day.dateString);
                            booking.setSelectedTime('');
                        }}
                        markedDates={markedDates}
                        theme={{
                            backgroundColor: '#ffffff',
                            calendarBackground: '#ffffff',
                            textSectionTitleColor: '#64748b',
                            selectedDayBackgroundColor: '#2563eb',
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: '#2563eb',
                            dayTextColor: '#0f172a',
                            textDisabledColor: '#cbd5e1',
                            arrowColor: '#2563eb',
                            monthTextColor: '#0f172a',
                            textMonthFontWeight: 'bold',
                            textDayFontSize: 15,
                            textMonthFontSize: 16,
                            textDayHeaderFontSize: 13,
                        }}
                    />
                </View>

                {/* Time Slots */}
                {booking.selectedDate !== '' && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Clock size={18} color="#0f172a" />
                            <Text style={styles.sectionTitle}>Horários disponíveis</Text>
                        </View>
                        <View style={styles.slotsGrid}>
                            {timeSlots.map((slot) => {
                                const isSelected = booking.selectedTime === slot;
                                return (
                                    <TouchableOpacity
                                        key={slot}
                                        onPress={() => booking.setSelectedTime(slot)}
                                        style={[styles.slot, isSelected ? styles.slotSelected : styles.slotDefault]}
                                    >
                                        <Text style={[styles.slotText, isSelected ? styles.slotTextSelected : styles.slotTextDefault]}>
                                            {slot}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Selection Summary */}
                {booking.isComplete && (
                    <View style={styles.summaryCard}>
                        <CheckCircle size={20} color="#10b981" />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={styles.summaryTitle}>Seleção confirmada</Text>
                            <Text style={styles.summarySubtitle}>
                                {booking.selectedDate} às {booking.selectedTime}
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Fixed Bottom CTA */}
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={!booking.isComplete}
                    style={[styles.confirmButton, booking.isComplete ? styles.confirmActive : styles.confirmDisabled]}
                >
                    <CalendarDays size={20} color="#ffffff" />
                    <Text style={styles.confirmText}>
                        {booking.isComplete ? 'Confirmar Agendamento' : 'Selecione data e horário'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const COLORS = {
    primary: '#0f172a',
    secondary: '#475569',
    accent: '#2563eb',
    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    success: '#10b981',
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    backButton: { marginRight: 12 },
    headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', flex: 1 },
    headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
    scroll: { flex: 1 },
    calendarCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: COLORS.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
    section: { marginHorizontal: 16, marginTop: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    slot: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
    slotDefault: { backgroundColor: COLORS.surface, borderColor: '#e2e8f0' },
    slotSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    slotText: { fontWeight: '600', fontSize: 14 },
    slotTextDefault: { color: COLORS.primary },
    slotTextSelected: { color: '#ffffff' },
    summaryCard: { marginHorizontal: 16, marginTop: 24, backgroundColor: '#f0fdf4', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
    summaryTitle: { color: COLORS.primary, fontWeight: 'bold' },
    summarySubtitle: { color: COLORS.secondary, fontSize: 14 },
    footer: { backgroundColor: COLORS.surface, borderTopWidth: 1, borderColor: COLORS.border, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
    confirmButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 16, gap: 8 },
    confirmActive: { backgroundColor: COLORS.accent },
    confirmDisabled: { backgroundColor: '#cbd5e1' },
    confirmText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});
