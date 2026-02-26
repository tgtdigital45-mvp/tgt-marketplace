import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientOrders } from '@/hooks/useClientOrders';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
    CalendarIcon, ClockIcon, MapPinIcon,
    ChevronRight, AlertCircle, MessageSquare,
    Star, RefreshCw, XCircle, CheckCircle2,
    Navigation, Play
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@tgt/shared';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import Badge from '@/components/ui/Badge';

interface MyAppointmentsProps {
    isEmbedded?: boolean;
}

const MyAppointments: React.FC<MyAppointmentsProps> = ({ isEmbedded = false }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data, isLoading } = useClientOrders(user?.id);

    const { addToast } = useToast();
    const queryClient = useQueryClient();

    const bookings = data?.bookings || [];
    const activeBookings = bookings.filter(b => ['pending', 'confirmed', 'pending_client_approval', 'on_the_way', 'in_progress', 'pending_quote', 'answered_quote'].includes(b.status));
    const pastBookings = bookings.filter(b => ['completed', 'cancelled', 'rejected', 'rejected_quote', 'accepted_quote'].includes(b.status));

    const getStatusStep = (status: string) => {
        switch (status) {
            case 'pending': return 1;
            case 'confirmed': return 2;
            case 'on_the_way': return 3;
            case 'in_progress': return 4;
            case 'completed': return 5;
            default: return 1;
        }
    };

    const handleAcceptProposal = async (booking: any) => {
        try {
            const { error } = await supabase.from('bookings').update({
                status: 'confirmed',
                booking_date: booking.proposed_date,
                booking_time: booking.proposed_time,
                proposed_date: null,
                proposed_time: null,
                proposal_expires_at: null
            }).eq('id', booking.id);
            if (error) throw error;
            addToast('Horário aceito! Sua reserva está confirmada.', 'success');
            queryClient.invalidateQueries({ queryKey: ['client-orders', user?.id] });
        } catch (err) {
            console.error(err);
            addToast('Erro ao aceitar proposta.', 'error');
        }
    };

    const handleDeclineProposal = async (bookingId: string) => {
        if (!confirm('Tem certeza que deseja recusar? A reserva será cancelada.')) return;
        try {
            const { error } = await supabase.from('bookings').update({
                status: 'cancelled',
            }).eq('id', bookingId);
            if (error) throw error;
            addToast('Proposta recusada e reserva cancelada.', 'info');
            queryClient.invalidateQueries({ queryKey: ['client-orders', user?.id] });
        } catch (err) {
            console.error(err);
            addToast('Erro ao recusar proposta.', 'error');
        }
    };

    if (isLoading) return (
        <div className={`space-y-6 ${!isEmbedded ? 'container px-4 py-12 max-w-5xl mx-auto' : ''}`}>
            {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 animate-pulse">
                    <div className="flex gap-4 mb-8">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl"></div>
                        <div className="space-y-2 flex-grow">
                            <div className="h-6 w-1/3 bg-slate-100 rounded"></div>
                            <div className="h-4 w-1/4 bg-slate-50 rounded"></div>
                        </div>
                    </div>
                    <div className="h-24 bg-slate-50 rounded-2xl"></div>
                </div>
            ))}
        </div>
    );

    return (
        <div className={`space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 ${!isEmbedded ? 'container px-4 py-12 max-w-5xl mx-auto' : ''}`}>

            {/* ACTIVE BOOKINGS SECTION */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <div className="w-2 h-6 bg-brand-primary rounded-full"></div>
                        Agendamentos Ativos
                    </h2>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeBookings.length} em andamento</span>
                </div>

                {activeBookings.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {activeBookings.map(booking => {
                            const step = getStatusStep(booking.status);
                            return (
                                <div key={booking.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group">
                                    <div className="p-6 sm:p-8">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
                                            <div className="flex gap-4">
                                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-primary font-black text-2xl shadow-inner border border-slate-100 group-hover:scale-110 transition-transform">
                                                    {new Date(booking.date + 'T00:00:00').getDate()}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-slate-800 text-xl tracking-tight group-hover:text-brand-primary transition-colors">{booking.serviceName}</h3>
                                                    <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">{booking.companyName}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Badge variant={
                                                    booking.status === 'confirmed' || booking.status === 'accepted_quote' ? 'success' :
                                                        booking.status === 'pending_client_approval' || booking.status === 'answered_quote' ? 'warning' : 'info'
                                                }>
                                                    {booking.status === 'confirmed' ? 'Confirmado' :
                                                        booking.status === 'pending_client_approval' ? 'Aguardando sua Resposta' :
                                                            booking.status === 'pending' ? 'Aguardando Empresa' :
                                                                booking.status === 'pending_quote' ? 'Orçamento Pendente' :
                                                                    booking.status === 'answered_quote' ? 'Orçamento Respondido' : booking.status}
                                                </Badge>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID: #{booking.id.slice(0, 8)}</span>
                                            </div>
                                        </div>

                                        {/* Status Progress Visualization */}
                                        <div className="mb-10 px-4">
                                            <div className="relative flex justify-between">
                                                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full z-0"></div>
                                                <div
                                                    className="absolute top-1/2 left-0 h-1 bg-brand-primary -translate-y-1/2 rounded-full z-0 transition-all duration-1000"
                                                    style={{ width: `${((step - 1) / 4) * 100}%` }}
                                                ></div>

                                                {[
                                                    { icon: ClockIcon, label: 'Aguardando' },
                                                    { icon: CheckCircle2, label: 'Agendado' },
                                                    { icon: Navigation, label: 'A Caminho' },
                                                    { icon: Play, label: 'Execução' }
                                                ].map((s, idx) => (
                                                    <div key={idx} className="relative z-10 flex flex-col items-center">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${step > idx + 1 ? 'bg-brand-primary border-brand-primary text-white scale-110' :
                                                            step === idx + 1 ? 'bg-white border-brand-primary text-brand-primary scale-125 shadow-lg' :
                                                                'bg-white border-slate-100 text-slate-200'
                                                            }`}>
                                                            <s.icon size={14} strokeWidth={3} className={idx > 1 ? '' : 'w-4 h-4'} />
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase tracking-tighter mt-2 ${step === idx + 1 ? 'text-brand-primary' : 'text-slate-300'
                                                            }`}>
                                                            {s.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-y border-slate-50 mb-8 bg-slate-50/50 rounded-2xl px-6">
                                            <div className="flex items-center gap-3">
                                                <CalendarIcon className="w-5 h-5 text-brand-primary" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</span>
                                                    <span className="text-slate-800 font-bold leading-tight">
                                                        {new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <ClockIcon className="w-5 h-5 text-blue-500" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário</span>
                                                    <span className="text-slate-800 font-bold leading-tight">{booking.time}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <MapPinIcon className="w-5 h-5 text-red-500" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local</span>
                                                    <span className="text-slate-800 font-bold leading-tight">Endereço Principal</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap justify-between items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <button className="p-3 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all group/btn">
                                                    <MessageSquare size={20} className="group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                                <button className="flex items-center gap-2 px-4 py-3 text-xs font-black text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest">
                                                    <AlertCircle size={16} /> Emergência / Cancelar
                                                </button>
                                            </div>
                                            <div className="flex gap-3">
                                                {booking.status === 'pending_client_approval' ? (
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" className="rounded-xl border-red-100 text-red-500" onClick={() => handleDeclineProposal(booking.id)}>Recusar</Button>
                                                        <Button variant="primary" size="sm" className="rounded-xl shadow-lg shadow-brand-primary/20" onClick={() => handleAcceptProposal(booking)}>Aceitar Próposta</Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Button variant="outline" size="sm" className="rounded-xl border-slate-200">Reagendar</Button>
                                                        <Button variant="primary" size="sm" className="rounded-xl shadow-lg shadow-slate-200" onClick={() => navigate(`/orders/${booking.order_id || booking.id}`)}>
                                                            Gerenciar Detalhes
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] py-20 text-center">
                        <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">Sem agendamentos ativos</h3>
                        <p className="text-slate-500 font-medium mb-8">O que você está esperando para contratar um profissional?</p>
                        <Button variant="primary" className="rounded-2xl px-10" onClick={() => navigate('/empresas')}>Explorar Serviços</Button>
                    </div>
                )}
            </section>

            {/* HISTORY SECTION */}
            {pastBookings.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <div className="w-2 h-6 bg-slate-200 rounded-full"></div>
                            Histórico de Serviços
                        </h2>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                        {pastBookings.map(booking => (
                            <div key={booking.id} className="p-6 flex flex-col sm:flex-row items-center justify-between hover:bg-slate-50/50 transition-all gap-6">
                                <div className="flex items-center gap-6 flex-grow">
                                    <div className="text-center w-16">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                            {new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                                        </p>
                                        <p className="text-2xl font-black text-slate-300 leading-none">
                                            {new Date(booking.date + 'T00:00:00').getDate()}
                                        </p>
                                    </div>
                                    <div className="w-px h-10 bg-slate-100 hidden sm:block"></div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 leading-tight">{booking.serviceName}</h4>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{booking.companyName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <Badge variant={booking.status === 'completed' ? 'success' : 'danger'} className="text-[9px] px-2 py-0.5 opacity-60">
                                        {booking.status === 'completed' ? 'Concluído' : 'Cancelado'}
                                    </Badge>
                                    <div className="flex gap-2 ml-auto">
                                        <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl text-xs font-bold border-slate-200">Avaliar</Button>
                                        <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-xs font-bold text-brand-primary" onClick={() => navigate(`/empresas/${booking.company_id}`)}>
                                            <RefreshCw size={14} className="mr-2" /> Pedir Novamente
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default MyAppointments;
