import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Service, DbCompany } from '@tgt/shared';
import { supabase } from '@tgt/shared';

interface BookingCalendarProps {
    service: Service;
    company: DbCompany;
    onSelect: (date: string, time: string, endDate?: string) => void;
}

import { useAvailability } from '@/hooks/useAvailability';
import { MONTHS, isDayActive, DAYS } from '@/utils/availability';

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ service, company, onSelect }) => {
    const [viewDate, setViewDate] = useState(new Date());

    // Using shared hook
    const {
        selectedDate,
        setSelectedDate,
        availableSlots,
        bookedSlots,
        loading,
        availability
    } = useAvailability(company.id, service.duration_minutes || 30);

    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
    const [selectionStep, setSelectionStep] = useState<'start' | 'end'>('start');

    const isDaily = service.pricing_model === 'daily';

    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    const prevMonth = () => {
        const now = new Date();
        if (viewDate.getMonth() === now.getMonth() && viewDate.getFullYear() === now.getFullYear()) return;
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-12 w-12" />);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

            // Block days that are before 48 hours from now
            const isBefore48Hours = date.getTime() < new Date(fortyEightHoursFromNow).setHours(0, 0, 0, 0);
            const isDisabled = isBefore48Hours || (availability && !availability[DAYS[date.getDay()]]?.active);
            const isSelected = selectedDate === dateStr;
            const isSelectedEnd = selectedEndDate === dateStr;
            const isBetween = selectedDate && selectedEndDate && dateStr > selectedDate && dateStr < selectedEndDate;

            days.push(
                <button
                    key={d}
                    disabled={isDisabled || (isDaily && selectionStep === 'end' && selectedDate && dateStr < selectedDate)}
                    onClick={() => {
                        if (isDaily) {
                            if (selectionStep === 'start' || (selectedDate && dateStr < selectedDate)) {
                                setSelectedDate(dateStr);
                                setSelectedEndDate(null);
                                setSelectionStep('end');
                            } else {
                                setSelectedEndDate(dateStr);
                                setSelectionStep('start');
                            }
                        } else {
                            setSelectedDate(dateStr);
                            setSelectedTime(null);
                        }
                    }}
                    className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-medium transition-all
                        ${isSelected || isSelectedEnd ? 'bg-brand-primary text-white shadow-lg' :
                            isBetween ? 'bg-brand-primary/20 text-brand-primary' :
                                isDisabled ? 'text-gray-300 cursor-not-allowed' :
                                    'text-gray-700 hover:bg-brand-primary/10 hover:text-brand-primary'}`}
                >
                    {d}
                </button>
            );
        }

        return days;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Selecione uma data</h3>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-700">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                    <div className="flex gap-1">
                        <button onClick={prevMonth} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"><ChevronLeftIcon className="w-5 h-5" /></button>
                        <button onClick={nextMonth} className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500"><ChevronRightIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-7 mb-4">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
                        <div key={idx} className="text-center text-xs font-bold text-gray-400 uppercase">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-y-2">
                    {renderCalendar()}
                </div>
            </div>

            {/* Time selection for non-daily services */}
            {selectedDate && !isDaily && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 bg-gray-50 border-t border-gray-100"
                >
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-brand-primary" />
                        Horários disponíveis para {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </h4>

                    {loading ? (
                        <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div></div>
                    ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {availableSlots.map(time => {
                                const isBooked = bookedSlots.includes(time);

                                // Check 48h limit for the specific time
                                const [hour, minute] = time.split(':');
                                // Ensure standard ISO date parsing by providing the format explicitly
                                const [yearStr, monthStr, dayStr] = selectedDate.split('-');
                                const slotDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr), parseInt(hour), parseInt(minute), 0, 0);

                                const referenceNow = new Date();
                                const isSlotTooSoon = slotDate.getTime() <= (referenceNow.getTime() + 48 * 60 * 60 * 1000);
                                const isSlotDisabled = isBooked || isSlotTooSoon;

                                return (
                                    <button
                                        key={time}
                                        disabled={isSlotDisabled}
                                        onClick={() => setSelectedTime(time)}
                                        className={`py-2 px-1 rounded-lg text-xs font-bold transition-all border
                                            ${selectedTime === time
                                                ? 'bg-brand-primary text-white border-brand-primary shadow-md'
                                                : isSlotDisabled
                                                    ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed line-through'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-brand-primary hover:text-brand-primary'}`}
                                    >
                                        {time}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">Nenhum horário disponível para esta data.</p>
                    )}

                    {selectedTime && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6"
                        >
                            <button
                                onClick={() => onSelect(selectedDate, selectedTime)}
                                className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all transform hover:scale-[1.02]"
                            >
                                Confirmar Agendamento e Continuar
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* Confirmation for daily services */}
            {selectedDate && isDaily && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col items-center text-center gap-4"
                >
                    {!selectedEndDate ? (
                        <p className="text-brand-primary font-medium animate-pulse">
                            Agora selecione a data de término no calendário acima.
                        </p>
                    ) : (
                        <div className="w-full text-left">
                            <h4 className="text-sm font-bold text-gray-900 mb-2">Período Selecionado:</h4>
                            <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4 flex justify-between items-center text-sm font-semibold">
                                <span>{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                <span className="text-gray-400">até</span>
                                <span>{new Date(selectedEndDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                            </div>
                            <button
                                onClick={() => onSelect(selectedDate, '00:00', selectedEndDate)}
                                className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all transform hover:scale-[1.02]"
                            >
                                Confirmar Período e Continuar
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};
