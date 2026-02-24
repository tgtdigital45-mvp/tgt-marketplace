import { useState, useEffect } from 'react';
import { supabase } from '@tgt/shared';
import { CompanyAvailability, getAvailableSlotsForDate } from '@/utils/availability';

export const useAvailability = (companyId?: string, serviceDurationMinutes: number = 30) => {
    const [availability, setAvailability] = useState<CompanyAvailability | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);

    // 1. Fetch Company Availability
    useEffect(() => {
        if (!companyId) return;

        const fetchCompanyAvailability = async () => {
            setLoading(true);
            try {
                const { data, error: companyError } = await supabase
                    .from('companies')
                    .select('availability')
                    .eq('id', companyId)
                    .single();

                if (companyError) throw companyError;
                setAvailability(data?.availability as CompanyAvailability || null);
            } catch (err) {
                console.error("Error fetching availability:", err);
                setError(err instanceof Error ? err.message : "Erro ao carregar disponibilidade.");
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyAvailability();
    }, [companyId]);

    // 2. Fetch Booked Slots when Date changes
    useEffect(() => {
        if (!companyId || !selectedDate) {
            setAvailableSlots([]);
            setBookedSlots([]);
            return;
        }

        const fetchBookings = async () => {
            try {
                const { data, error: bookingError } = await supabase
                    .from('bookings')
                    .select('booking_time, service_duration_minutes')
                    .eq('company_id', companyId)
                    .eq('booking_date', selectedDate)
                    .neq('status', 'cancelled');

                if (bookingError) throw bookingError;

                const bookedBlocks = data?.map(b => ({
                    time: b.booking_time,
                    durationMinutes: b.service_duration_minutes || 30 // fallback
                })) || [];

                const booked = bookedBlocks.map(b => b.time);
                setBookedSlots(booked);

                // 3. Calculate Available Slots
                const slots = getAvailableSlotsForDate(selectedDate, availability, serviceDurationMinutes, bookedBlocks);
                setAvailableSlots(slots);

            } catch (err) {
                console.error("Error fetching bookings:", err);
            }
        };

        fetchBookings();
    }, [selectedDate, companyId, availability, serviceDurationMinutes]);

    return {
        availability,
        loading,
        error,
        selectedDate,
        setSelectedDate,
        availableSlots,
        bookedSlots,
        isSlotBooked: (time: string) => bookedSlots.includes(time)
    };
};
