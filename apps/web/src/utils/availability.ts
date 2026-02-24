/**
 * Shared Availability Utilities
 * Centralizes logic for working hours, breaks, and slot generation.
 */

export interface BookedBlock {
    time: string;
    durationMinutes: number;
}

export const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export type DayOfWeek = typeof DAYS[number];

export const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const;

export const DAY_LABELS: Record<DayOfWeek, string> = {
    sunday: 'Domingo',
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado'
};

export interface DaySchedule {
    start: string;
    end: string;
    active: boolean;
    hasBreak: boolean;
    breakStart?: string;
    breakEnd?: string;
}

export type CompanyAvailability = Record<string, DaySchedule> & {
    worksOnHolidays?: boolean;
};

/**
 * Generates time slots between start and end times.
 */
export const generateTimeSlots = (
    start: string,
    end: string,
    durationMinutes: number,
    intervalMinutes: number = 30
): string[] => {
    const slots: string[] = [];
    let [h, m] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const endTimeInMinutes = endH * 60 + endM;

    while (true) {
        const currentInMinutes = h * 60 + m;
        const endOfSlotInMinutes = currentInMinutes + durationMinutes;

        // If this slot fits before or exactly at the end time
        if (endOfSlotInMinutes <= endTimeInMinutes) {
            slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        } else {
            break;
        }

        // Advance by interval
        m += intervalMinutes;
        if (m >= 60) {
            h += Math.floor(m / 60);
            m = m % 60;
        }

        if (h > 23) break;
    }

    return slots;
};

/**
 * Gets available slots for a specific date given company availability and service duration.
 */
export const getAvailableSlotsForDate = (
    dateString: string,
    availability: CompanyAvailability | null,
    durationMinutes: number = 30,
    bookedBlocks: BookedBlock[] = []
): string[] => {
    if (!availability) return [];

    const date = new Date(dateString + 'T00:00:00');
    const dayName = DAYS[date.getDay()];
    const dayConfig = availability[dayName];

    if (!dayConfig || !dayConfig.active) {
        return [];
    }

    // Handle Holidays logic if needed in future (requires holiday list)
    // if (!availability.worksOnHolidays && isHoliday(date)) return [];

    let slots: string[] = [];

    // Interval for slot starting positions (usually 30 mins)
    const interval = 30;

    if (dayConfig.hasBreak && dayConfig.breakStart && dayConfig.breakEnd) {
        // Period 1: Start to BreakStart
        slots = [...slots, ...generateTimeSlots(dayConfig.start, dayConfig.breakStart, durationMinutes, interval)];
        // Period 2: BreakEnd to End
        slots = [...slots, ...generateTimeSlots(dayConfig.breakEnd, dayConfig.end, durationMinutes, interval)];
    } else {
        // Full day
        slots = generateTimeSlots(dayConfig.start, dayConfig.end, durationMinutes, interval);
    }

    const uniqueSortedSlots = [...new Set(slots)].sort();

    // Filter out slots that overlap with any booked block
    return uniqueSortedSlots.filter(slot => {
        const [slotH, slotM] = slot.split(':').map(Number);
        const slotStartMin = slotH * 60 + slotM;
        const slotEndMin = slotStartMin + durationMinutes;

        for (const block of bookedBlocks) {
            const [blockH, blockM] = block.time.split(':').map(Number);
            const blockStartMin = blockH * 60 + blockM;
            const blockEndMin = blockStartMin + (block.durationMinutes || 30); // Default 30 if null

            // Overlap condition: start1 < end2 AND start2 < end1
            if (slotStartMin < blockEndMin && blockStartMin < slotEndMin) {
                return false; // Slot overlaps with a booked block, remove it
            }
        }
        return true; // No overlap
    });
};

/**
 * Checks if a specific date is "active" based on company configuration.
 */
export const isDayActive = (date: Date | string, availability: CompanyAvailability | null): boolean => {
    if (!availability) return true;

    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const dayName = DAYS[dateObj.getDay()];

    return !!availability[dayName]?.active;
};
