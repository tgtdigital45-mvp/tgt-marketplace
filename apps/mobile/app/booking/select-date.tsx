import React, { useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { ArrowLeft, Clock, CalendarDays, CheckCircle } from 'lucide-react-native';
import { useBookingState } from '@/hooks/useBookingState';

// Generate time slots from 08:00 to 18:00 in 30-min intervals
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

    // Today as YYYY-MM-DD
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

        // For now, show confirmation — will navigate to checkout in next sprint
        Alert.alert(
            'Agendamento',
            `Serviço: ${data.serviceTitle}\nData: ${data.selectedDate}\nHorário: ${data.selectedTime}\nPreço: R$ ${data.servicePrice.toFixed(2).replace('.', ',')}`,
            [
                { text: 'Alterar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: () => {
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
                                packageTier: 'basic', // Default for now
                            },
                        });
                    },
                },
            ]
        );
    };

    return (
        <View className="flex-1 bg-brand-background">
            {/* Header */}
            <View className="bg-brand-primary px-6 pt-14 pb-5">
                <View className="flex-row items-center mb-3">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <ArrowLeft size={22} color="#ffffff" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold flex-1" numberOfLines={1}>
                        Escolher Data
                    </Text>
                </View>
                <Text className="text-white/70 text-sm" numberOfLines={1}>
                    {params.serviceTitle} • {params.companyName}
                </Text>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Calendar */}
                <View className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                    <Calendar
                        minDate={today}
                        onDayPress={(day: DateData) => {
                            booking.setSelectedDate(day.dateString);
                            booking.setSelectedTime(''); // Reset time on date change
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
                    <View className="mx-4 mt-6">
                        <View className="flex-row items-center mb-4">
                            <Clock size={18} color="#0f172a" />
                            <Text className="text-brand-primary text-lg font-bold ml-2">
                                Horários disponíveis
                            </Text>
                        </View>

                        <View className="flex-row flex-wrap gap-3">
                            {timeSlots.map((slot) => {
                                const isSelected = booking.selectedTime === slot;
                                return (
                                    <TouchableOpacity
                                        key={slot}
                                        onPress={() => booking.setSelectedTime(slot)}
                                        className={`px-5 py-3 rounded-xl border ${isSelected
                                            ? 'bg-brand-accent border-brand-accent'
                                            : 'bg-white border-slate-200'
                                            }`}
                                    >
                                        <Text
                                            className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-brand-primary'
                                                }`}
                                        >
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
                    <View className="mx-4 mt-6 bg-brand-success/10 rounded-2xl p-4 flex-row items-center border border-brand-success/20">
                        <CheckCircle size={20} color="#10b981" />
                        <View className="ml-3 flex-1">
                            <Text className="text-brand-primary font-bold">Seleção confirmada</Text>
                            <Text className="text-brand-secondary text-sm">
                                {booking.selectedDate} às {booking.selectedTime}
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Fixed Bottom CTA */}
            <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 pb-8">
                <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={!booking.isComplete}
                    className={`rounded-xl py-4 items-center shadow-md ${booking.isComplete ? 'bg-brand-accent' : 'bg-slate-300'
                        }`}
                >
                    <View className="flex-row items-center">
                        <CalendarDays size={20} color="#ffffff" />
                        <Text className="text-white font-bold text-base ml-2">
                            {booking.isComplete ? 'Confirmar Agendamento' : 'Selecione data e horário'}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}
