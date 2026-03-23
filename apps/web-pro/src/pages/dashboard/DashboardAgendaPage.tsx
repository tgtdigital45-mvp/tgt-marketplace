import React, { useState, useEffect, useMemo } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@tgt/core';

import { useToast } from '@/contexts/ToastContext';
import { Calendar as CalendarIcon, List, Check, X, ChevronLeft, ChevronRight as ChevronRightIcon, MessageCircle, Sparkles, Loader2, Settings2, Filter, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { gemini } from '@/utils/gemini';
import { motion, AnimatePresence } from 'framer-motion';

import { DAYS, DAY_LABELS, DaySchedule } from '@/utils/availability';
import AvailabilityModal from '@/components/modals/AvailabilityModal';
import { Button } from '@tgt/ui-web';


interface Order {
    id: string;
    buyer_id: string;
    service_title: string;
    price: number;
    scheduled_for: string;
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'canceled' | 'pending_client_approval';
    created_at: string;
}

const DashboardAgendaPage = () => {
    const { company, refreshCompany } = useCompany();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState<Order[]>([]);
    
    // UI State
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
    const [viewFilter, setViewFilter] = useState<'day' | 'week' | 'month'>('month');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const [generatingEmailId, setGeneratingEmailId] = useState<string | null>(null);

    useEffect(() => {
        fetchBookings();
    }, [company]);

    const fetchBookings = async () => {
        if (!company) return;
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('seller_id', company.profile_id)
            .order('scheduled_for', { ascending: true });

        if (data) setBookings(data as any);
    };

    const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', bookingId);

            if (error) throw error;

            addToast(`Agendamento ${newStatus === 'accepted' ? 'confirmado' : 'rejeitado'}!`, 'success');
            fetchBookings();
        } catch (err) {
            console.error(err);
            addToast('Erro ao atualizar agendamento.', 'error');
        }
    };

    const handleSaveAvailability = async (payload: any) => {
        if (!company) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({ availability: payload })
                .eq('id', company.id);

            if (error) throw error;

            await refreshCompany();
            addToast('Disponibilidade atualizada!', 'success');
        } catch (error) {
            console.error(error);
            addToast('Erro ao atualizar.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Calendar logic
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        let firstDayOfWeek = firstDay.getDay(); 
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [currentMonth]);

    const bookingsByDay = useMemo(() => {
        const map: Record<string, Order[]> = {};
        bookings.forEach(b => {
            const dateStr = b.scheduled_for ? b.scheduled_for.split('T')[0] : null;
            if (dateStr) {
                if (!map[dateStr]) map[dateStr] = [];
                map[dateStr].push(b);
            }
        });
        return map;
    }, [bookings]);

    const filteredBookings = useMemo(() => {
        if (viewFilter === 'day') {
            return bookingsByDay[selectedDate] || [];
        }
        if (viewFilter === 'week') {
            // Simple week filter: 7 days starting from selectedDate or current week
            const start = new Date(selectedDate);
            const end = new Date(start);
            end.setDate(start.getDate() + 7);
            return bookings.filter(b => {
                const date = new Date(b.scheduled_for);
                return date >= start && date < end;
            });
        }
        return bookings; // Month/All
    }, [bookings, selectedDate, viewFilter, bookingsByDay]);

    const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    const previousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* ─── Page Header ─────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                        <span>Dashboard</span><ChevronRightIcon size={12} />
                        <span className="text-gray-600 font-medium">Agenda</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Agenda & Disponibilidade</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Gerencie seus horários e próximos compromissos</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsAvailabilityModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Settings2 size={16} className="text-primary-500" />
                        Configurar Horários
                    </button>
                    <div className="h-8 w-px bg-gray-200 mx-2" />
                    <div className="flex bg-gray-100 p-1 rounded-2xl">
                        {(['day', 'week', 'month'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setViewFilter(f)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${viewFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {f === 'day' ? 'Dia' : f === 'week' ? 'Semana' : 'Mês'}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* ─── Main Content (Split View) ────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Lateral Esquerda: Calendário (7 colunas) */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-gray-900 capitalize">
                                {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex bg-gray-50 p-1 rounded-xl">
                                <button onClick={previousMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500">
                                    <ChevronLeft size={18} />
                                </button>
                                <button onClick={nextMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500">
                                    <ChevronRightIcon size={18} />
                                </button>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            className="text-xs font-bold h-9 rounded-xl"
                            onClick={() => {
                                setCurrentMonth(new Date());
                                setSelectedDate(new Date().toISOString().split('T')[0]);
                            }}
                        >
                            Hoje
                        </Button>
                    </div>

                    <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-2xl overflow-hidden shadow-inner">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <div key={day} className="bg-gray-50 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                        {calendarDays.map((date, i) => {
                            if (!date) return <div key={`empty-${i}`} className="bg-white min-h-[100px]" />;

                            const dateStr = date.toISOString().split('T')[0];
                            const dayBookings = bookingsByDay[dateStr] || [];
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;
                            const isSelected = selectedDate === dateStr;

                            return (
                                <div 
                                    key={dateStr} 
                                    onClick={() => {
                                        setSelectedDate(dateStr);
                                        if (viewFilter === 'month') setViewFilter('day');
                                    }}
                                    className={`bg-white min-h-[110px] p-2 hover:bg-primary-50/30 transition-all cursor-pointer group relative border-t border-l border-gray-50
                                        ${isSelected ? 'bg-primary-50/50' : ''}`}
                                >
                                    <span className={`inline-flex items-center justify-center w-7 h-7 text-sm font-bold rounded-full transition-colors
                                        ${isToday ? 'bg-primary-500 text-white shadow-md shadow-primary-200' : isSelected ? 'bg-primary-100 text-primary-700' : 'text-gray-600'}`}>
                                        {date.getDate()}
                                    </span>

                                    <div className="mt-2 space-y-1">
                                        {dayBookings.slice(0, 2).map(b => (
                                            <div
                                                key={b.id}
                                                className={`text-[9px] truncate px-1.5 py-0.5 rounded-md font-medium border
                                                    ${b.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-100' :
                                                      b.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                                                      'bg-gray-50 text-gray-600 border-gray-100'}`}
                                            >
                                                {new Date(b.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        ))}
                                        {dayBookings.length > 2 && (
                                            <div className="text-[9px] text-gray-400 font-bold pl-1">
                                                + {dayBookings.length - 2} mais
                                            </div>
                                        )}
                                    </div>
                                    
                                    {dayBookings.length > 0 && !isToday && !isSelected && (
                                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary-400 shadow-sm" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Lateral Direita: Lista de Agendamentos (4 colunas) */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-4 space-y-4"
                >
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Filter size={14} className="text-primary-500" />
                            {viewFilter === 'day' ? `Agendamentos de ${new Date(selectedDate).toLocaleDateString('pt-BR')}` : 
                             viewFilter === 'week' ? 'Próximos 7 dias' : 'Todos Agendamentos'}
                        </h3>
                        <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-full">
                            {filteredBookings.length}
                        </span>
                    </div>

                    <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                        {filteredBookings.length === 0 ? (
                            <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-12 text-center">
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                                    <CalendarIcon size={24} />
                                </div>
                                <p className="text-sm text-gray-500 font-medium">Nenhum compromisso para este período.</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {filteredBookings.map((booking, idx) => (
                                    <motion.div
                                        key={booking.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate pr-2">{booking.service_title}</h3>
                                                <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5 tracking-wider">
                                                    ID: {booking.id.slice(0, 8)}
                                                </p>
                                            </div>
                                            <span className={`shrink-0 px-2 py-1 rounded-xl text-[10px] font-bold uppercase tracking-tight
                                                ${booking.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {booking.status === 'accepted' ? 'Confirmado' : booking.status === 'pending' ? 'Pendente' : booking.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 py-3 border-t border-b border-gray-50 mb-3">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                <CalendarIcon size={14} className="text-primary-500" />
                                                <span className="font-medium">{new Date(booking.scheduled_for).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <div className="w-px h-3 bg-gray-200" />
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                <Clock size={14} className="text-primary-500" />
                                                <span className="font-medium">{new Date(booking.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex -space-x-2">
                                                <div className="w-7 h-7 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary-600">
                                                    {booking.buyer_id.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-1.5">
                                                {booking.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateBookingStatus(booking.id, 'accepted')}
                                                            className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors shadow-sm"
                                                            title="Confirmar"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateBookingStatus(booking.id, 'canceled')}
                                                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                                                            title="Recusar"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => navigate('/pro/dashboard/mensagens')}
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
                                                    title="Conversar"
                                                >
                                                    <MessageCircle size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Availability Modal */}
            <AvailabilityModal 
                isOpen={isAvailabilityModalOpen}
                onClose={() => setIsAvailabilityModalOpen(false)}
                currentAvailability={company?.availability || {}}
                onSave={handleSaveAvailability}
                isLoading={loading}
            />
        </div>
    );
};

export default DashboardAgendaPage;
