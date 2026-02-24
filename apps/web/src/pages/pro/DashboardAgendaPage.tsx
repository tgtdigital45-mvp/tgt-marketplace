import React, { useState, useEffect, useMemo } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@tgt/shared';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { BookingWithCompany } from '@tgt/shared';
import { Calendar as CalendarIcon, List, Check, X, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DAYS, DAY_LABELS, DaySchedule, CompanyAvailability } from '@/utils/availability';

// UI Order for display: Monday to Sunday
const UI_DAYS_ORDER: (keyof typeof DAY_LABELS)[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const DashboardAgendaPage = () => {
    const { company, updateCompany, refreshCompany } = useCompany();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState<BookingWithCompany[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Availability State
    const [availability, setAvailability] = useState<Record<string, DaySchedule>>({});
    const [worksOnHolidays, setWorksOnHolidays] = useState(false);

    useEffect(() => {
        if (company?.availability) {
            // Parse existing or set default
            const initial: any = {};
            DAYS.forEach(day => {
                const dayData = (company.availability as any)?.[day] || {};
                initial[day] = {
                    start: dayData.start || '09:00',
                    end: dayData.end || '18:00',
                    active: dayData.active ?? (day === 'saturday' || day === 'sunday' ? false : true),
                    hasBreak: dayData.hasBreak || false,
                    breakStart: dayData.breakStart || '12:00',
                    breakEnd: dayData.breakEnd || '13:00'
                };
            });
            setAvailability(initial);
            setWorksOnHolidays((company.availability as any).worksOnHolidays ?? false);
        } else {
            const initial: any = {};
            DAYS.forEach(day => {
                initial[day] = {
                    start: '09:00',
                    end: '18:00',
                    active: !['saturday', 'sunday'].includes(day),
                    hasBreak: false,
                    breakStart: '12:00',
                    breakEnd: '13:00'
                };
            });
            setAvailability(initial);
            setWorksOnHolidays(false);
        }

        fetchBookings();
    }, [company]);

    const fetchBookings = async () => {
        if (!company) return;
        const { data, error } = await supabase
            .from('bookings')
            .select('*, companies:company_id(company_name)')
            .eq('company_id', company.id)
            .order('booking_date', { ascending: true });

        if (data) setBookings(data as any);
    };

    const handleUpdateBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'cancelled' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: newStatus })
                .eq('id', bookingId);

            if (error) throw error;

            addToast(`Agendamento ${newStatus === 'confirmed' ? 'confirmado' : 'rejeitado'}!`, 'success');
            fetchBookings();
        } catch (err) {
            console.error(err);
            addToast('Erro ao atualizar agendamento.', 'error');
        }
    };

    const handleSaveAvailability = async () => {
        if (!company) return;
        setLoading(true);
        try {
            // Save worksOnHolidays inside the JSON for now, or use a separate column if strictly typed.
            // Using JSONB allows flexibility.
            const payload = {
                ...availability,
                worksOnHolidays
            };

            const { error } = await supabase
                .from('companies')
                .update({ availability: payload })
                .eq('id', company.id);

            if (error) throw error;

            await refreshCompany(); // Refresh context
            addToast('Disponibilidade atualizada!', 'success');
        } catch (error) {
            console.error(error);
            addToast('Erro ao atualizar.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (day: string) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], active: !prev[day].active }
        }));
    };

    const toggleBreak = (day: string) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], hasBreak: !prev[day].hasBreak }
        }));
    };

    const handleTimeChange = (day: string, field: keyof DaySchedule, value: string) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
    };

    // Calendar logic
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];

        // Padding days for previous month (Monday based)
        let firstDayOfWeek = firstDay.getDay(); // 0 is Sunday
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // 0 is Monday

        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    }, [currentMonth]);

    const bookingsByDay = useMemo(() => {
        const map: Record<string, BookingWithCompany[]> = {};
        bookings.forEach(b => {
            if (!map[b.booking_date]) map[b.booking_date] = [];
            map[b.booking_date].push(b);
        });
        return map;
    }, [bookings]);

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    const previousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Agenda & Disponibilidade</h1>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <List size={18} />
                        Lista
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <CalendarIcon size={18} />
                        Calendário
                    </button>
                </div>
            </div>
            {/* 1. Availability Settings */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold">Horários de Atendimento</h2>

                    <div className="flex items-center gap-2">
                        <label htmlFor="holidays" className="text-sm font-medium text-gray-700">
                            Trabalha em Feriados?
                        </label>
                        <button
                            id="holidays"
                            onClick={() => setWorksOnHolidays(!worksOnHolidays)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${worksOnHolidays ? 'bg-brand-primary' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`${worksOnHolidays ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </button>
                    </div>
                </div>

                <p className="text-sm text-gray-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <strong>Onde está o calendário?</strong> A lista de "Próximos Agendamentos" ao lado serve como seu calendário de compromissos confirmados.
                </p>

                <div className="space-y-4">
                    {UI_DAYS_ORDER.map(day => (
                        <div key={day} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={availability[day]?.active ?? false}
                                        onChange={() => toggleDay(day)}
                                        className="w-5 h-5 rounded text-brand-primary focus:ring-brand-primary"
                                    />
                                    <span className="font-medium text-gray-700 w-28">{DAY_LABELS[day]}</span>
                                </div>

                                {availability[day]?.active && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`break-${day}`}
                                            checked={availability[day]?.hasBreak ?? false}
                                            onChange={() => toggleBreak(day)}
                                            className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
                                        />
                                        <label htmlFor={`break-${day}`} className="text-xs text-gray-500 cursor-pointer select-none">
                                            Com Intervalo?
                                        </label>
                                    </div>
                                )}
                            </div>

                            {availability[day]?.active ? (
                                <div className="pl-8">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500 w-8">Início</span>
                                            <input
                                                type="time"
                                                value={availability[day]?.start}
                                                onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                                                className="px-2 py-1 border rounded text-sm w-24"
                                            />
                                        </div>

                                        {availability[day]?.hasBreak && (
                                            <>
                                                <span className="text-gray-400">-</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">Pausa</span>
                                                    <input
                                                        type="time"
                                                        value={availability[day]?.breakStart}
                                                        onChange={(e) => handleTimeChange(day, 'breakStart', e.target.value)}
                                                        className="px-2 py-1 border rounded text-sm w-24"
                                                    />
                                                </div>
                                                <span className="text-gray-400">até</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">Volta</span>
                                                    <input
                                                        type="time"
                                                        value={availability[day]?.breakEnd}
                                                        onChange={(e) => handleTimeChange(day, 'breakEnd', e.target.value)}
                                                        className="px-2 py-1 border rounded text-sm w-24"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <span className="text-gray-400">-</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500 w-8">Fim</span>
                                            <input
                                                type="time"
                                                value={availability[day]?.end}
                                                onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                                                className="px-2 py-1 border rounded text-sm w-24"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="pl-8 text-sm text-gray-400 italic">Fechado</div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-6">
                    <Button onClick={handleSaveAvailability} isLoading={loading}>Salvar Horários</Button>
                </div>
            </div>

            {/* 2. Bookings View */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold">
                        {viewMode === 'list' ? 'Próximos Agendamentos' : currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>

                    {viewMode === 'calendar' && (
                        <div className="flex items-center gap-2">
                            <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <ChevronLeft size={20} className="text-gray-600" />
                            </button>
                            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <ChevronRight size={20} className="text-gray-600" />
                            </button>
                        </div>
                    )}
                </div>

                {viewMode === 'list' ? (
                    <div className="space-y-3">
                        {bookings.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Nenhum agendamento encontrado.</p>
                        ) : (
                            bookings.map(booking => (
                                <div key={booking.id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{booking.service_title}</h3>
                                            <p className="text-sm text-gray-600">Cliente ID: {booking.client_id.slice(0, 8)}...</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                                    ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {booking.status}
                                            </span>

                                            {booking.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                                        className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                                                        title="Confirmar"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateBookingStatus(booking.id, 'rejected')}
                                                        className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                                                        title="Recusar"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate('/pro/dashboard/mensagens')}
                                                        className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                                                        title="Mensagens"
                                                    >
                                                        <MessageCircle size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <CalendarIcon className="w-4 h-4" />
                                            {new Date(booking.booking_date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            {booking.booking_time}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <div key={day} className="bg-gray-50 py-2 text-center text-xs font-bold text-gray-500 uppercase">
                                {day}
                            </div>
                        ))}
                        {calendarDays.map((date, i) => {
                            if (!date) return <div key={`empty-${i}-${currentMonth.getTime()}`} className="bg-white min-h-[100px]" />;

                            const dateStr = date.toISOString().split('T')[0];
                            const dayBookings = bookingsByDay[dateStr] || [];
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;

                            return (
                                <div key={dateStr} className={`bg-white min-h-[100px] p-2 hover:bg-gray-50 transition-colors group relative ${isToday ? 'ring-2 ring-brand-primary ring-inset' : ''}`}>
                                    <span className={`text-sm font-medium ${isToday ? 'text-brand-primary' : 'text-gray-700'}`}>
                                        {date.getDate()}
                                    </span>

                                    <div className="mt-1 space-y-1">
                                        {dayBookings.slice(0, 3).map(b => (
                                            <div
                                                key={b.id}
                                                className={`text-[10px] truncate px-1 py-0.5 rounded ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                    b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {b.booking_time} {b.service_title}
                                            </div>
                                        ))}
                                        {dayBookings.length > 3 && (
                                            <div className="text-[10px] text-gray-400 font-medium pl-1">
                                                + {dayBookings.length - 3} mais
                                            </div>
                                        )}
                                    </div>

                                    {dayBookings.length > 0 && (
                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardAgendaPage;
