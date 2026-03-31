import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@tgt/core';
import { CompanyAvailability, getAvailableSlotsForDate } from '@/utils/availability';

// Tipagem explícita do retorno do Supabase para evitar @ts-ignore
interface BookedOrder {
    scheduled_for: string | null;
    services: { duration_minutes: number | null } | null;
}

export const useAvailability = (companyId?: string, serviceDurationMinutes: number = 30, travelBufferMinutes: number = 0) => {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // 1. Fetch da disponibilidade da empresa (com cache React Query)
    const availabilityQuery = useQuery({
        queryKey: ['company-availability', companyId],
        queryFn: async (): Promise<CompanyAvailability | null> => {
            const { data, error } = await supabase
                .from('companies')
                .select('availability')
                .eq('id', companyId!)
                .single();

            if (error) throw new Error(`Erro ao carregar disponibilidade: ${error.message}`);
            return (data?.availability as CompanyAvailability) ?? null;
        },
        enabled: !!companyId,
        staleTime: 1000 * 60 * 10, // 10 minutos — disponibilidade raramente muda
    });

    // 2. Fetch dos slots já agendados para a data selecionada
    const bookingsQuery = useQuery({
        queryKey: ['company-bookings', companyId, selectedDate],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('scheduled_for, service_id')
                .eq('seller_id', companyId!)
                .gte('scheduled_for', `${selectedDate}T00:00:00`)
                .lte('scheduled_for', `${selectedDate}T23:59:59`)
                .not('status', 'in', '(canceled,rejected)');

            if (error) throw new Error(`Erro ao buscar agendamentos: ${error.message}`);

            const orders = (data ?? []) as any[];
            
            // Get unique service IDs to fetch their durations
            const serviceIds = [...new Set(orders.map(o => o.service_id).filter(Boolean))];
            
            let servicesDurationMap: Record<string, number> = {};
            if (serviceIds.length > 0) {
                const { data: servicesData } = await supabase
                    .from('services')
                    .select('id, duration_minutes')
                    .in('id', serviceIds);
                    
                if (servicesData) {
                    servicesData.forEach(s => {
                        servicesDurationMap[s.id] = s.duration_minutes || 30;
                    });
                }
            }

            return orders.map(b => ({
                time: b.scheduled_for
                    ? b.scheduled_for.split('T')[1].substring(0, 5)
                    : '00:00',
                durationMinutes: servicesDurationMap[b.service_id] || 30,
            }));
        },
        enabled: !!companyId && !!selectedDate,
        staleTime: 1000 * 60 * 2, // 2 minutos — slots reservados mudam com frequência
    });

    const availability = availabilityQuery.data ?? null;
    const bookedBlocks = bookingsQuery.data ?? [];
    const bookedSlots = bookedBlocks.map(b => b.time);

    // 3. Calcula os slots disponíveis a partir dos dados já buscados
    const availableSlots =
        selectedDate && availability
            ? getAvailableSlotsForDate(selectedDate, availability, serviceDurationMinutes, bookedBlocks, travelBufferMinutes)
            : [];

    return {
        availability,
        loading: availabilityQuery.isLoading,
        error: availabilityQuery.error instanceof Error
            ? availabilityQuery.error.message
            : null,
        selectedDate,
        setSelectedDate,
        availableSlots,
        bookedSlots,
        isSlotBooked: (time: string) => bookedSlots.includes(time),
    };
};
