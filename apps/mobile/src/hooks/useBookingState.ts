import { useState, useCallback } from 'react';

export interface BookingSelection {
    serviceId: string;
    serviceTitle: string;
    servicePrice: number;
    companyName: string;
    durationMinutes: number;
    selectedDate: string; // YYYY-MM-DD
    selectedTime: string; // HH:mm
}

/**
 * Lightweight booking state hook.
 * Keeps the user's date/time selection in local state before checkout.
 */
export function useBookingState(initial: Omit<BookingSelection, 'selectedDate' | 'selectedTime'>) {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');

    const isComplete = selectedDate !== '' && selectedTime !== '';

    const getBooking = useCallback((): BookingSelection | null => {
        if (!isComplete) return null;
        return {
            ...initial,
            selectedDate,
            selectedTime,
        };
    }, [initial, selectedDate, selectedTime, isComplete]);

    const reset = useCallback(() => {
        setSelectedDate('');
        setSelectedTime('');
    }, []);

    return {
        selectedDate,
        selectedTime,
        setSelectedDate,
        setSelectedTime,
        isComplete,
        getBooking,
        reset,
    };
}
