import { useState } from 'react';

interface BookingInput {
  serviceId: string;
  serviceTitle: string;
  servicePrice: number;
  companyName: string;
  durationMinutes: number;
}

interface BookingState extends BookingInput {
  selectedDate: string;
  selectedTime: string;
  isComplete: boolean;
  setSelectedDate: (date: string) => void;
  setSelectedTime: (time: string) => void;
  getBooking: () => (BookingInput & { selectedDate: string; selectedTime: string }) | null;
}

export function useBookingState(input: BookingInput): BookingState {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const isComplete = selectedDate !== '' && selectedTime !== '';

  const getBooking = () => {
    if (!isComplete) return null;
    return { ...input, selectedDate, selectedTime };
  };

  return {
    ...input,
    selectedDate,
    selectedTime,
    isComplete,
    setSelectedDate,
    setSelectedTime,
    getBooking,
  };
}
