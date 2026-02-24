import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import RescheduleModal from '@/components/booking/RescheduleModal';
import KanbanCard from '@/components/dashboard/KanbanCard';
interface Booking {
    id: string;
    client_id: string;
    service_title: string;
    service_price: number;
    booking_date: string;
    booking_time: string;
    notes: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'pending_client_approval';
    created_at: string;
    client_name?: string; // Fetched optionally
    client_email?: string;
}

const DashboardAgendamentosPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<Booking | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchBookings = async () => {
            setLoading(true);
            try {
                // 1. Get Company ID
                const { data: companyData, error: companyError } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('profile_id', user.id)
                    .single();

                if (companyError) throw companyError;

                // 2. Fetch Bookings
                // Ideally we join with profiles to get client name
                // Supabase join syntax: select('*, client:client_id(full_name, email)')
                const { data: bookingsData, error: bookingsError } = await supabase
                    .from('bookings')
                    .select('*')
                    .eq('company_id', companyData.id)
                    .order('created_at', { ascending: false });

                if (bookingsError) throw bookingsError;

                // 3. Fetch Client Profiles
                const clientIds = [...new Set(bookingsData?.map(b => b.client_id) || [])];

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const profilesMap: Record<string, any> = {};

                if (clientIds.length > 0) {
                    const { data: profiles, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, full_name, email')
                        .in('id', clientIds);

                    if (!profilesError && profiles) {
                        profiles.forEach(p => profilesMap[p.id] = p);
                    }
                }

                const enrichedBookings = bookingsData?.map((b) => {
                    const profile = profilesMap[b.client_id];
                    return {
                        ...b,
                        client_name: profile?.full_name || 'Cliente (s/ perfil)',
                        client_email: profile?.email || ''
                    };
                }) || [];

                setBookings(enrichedBookings);

            } catch (err) {
                console.error("Error fetching bookings:", err);
                addToast("Erro ao carregar agendamentos.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [user, addToast]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus as Booking['status'] } : b));

            // Show nicer toast messages based on action
            if (newStatus === 'confirmed') {
                addToast('Agendamento aceito com sucesso! Entre em contato com o cliente.', 'success');
            } else if (newStatus === 'cancelled') {
                addToast('Agendamento recusado.', 'info');
            } else if (newStatus === 'completed') {
                addToast('Serviço marcado como concluído!', 'success');
            }
        } catch (err) {
            console.error(err);
            addToast("Erro ao atualizar status.", "error");
        }
    };

    const handleProposeSchedule = async (date: string, time: string) => {
        if (!selectedBookingForReschedule) return;
        try {
            const proposalExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            const { error } = await supabase
                .from('bookings')
                .update({
                    status: 'pending_client_approval',
                    proposed_date: date,
                    proposed_time: time,
                    proposal_expires_at: proposalExpiresAt
                })
                .eq('id', selectedBookingForReschedule.id);

            if (error) throw error;

            setBookings(prev => prev.map(b => b.id === selectedBookingForReschedule.id ? { ...b, status: 'pending_client_approval' } : b));
            addToast('Proposta enviada ao cliente com sucesso!', 'success');
            setSelectedBookingForReschedule(null);
        } catch (err) {
            console.error(err);
            addToast("Erro ao enviar proposta.", "error");
        }
    };

    const filteredBookings = filter === 'all'
        ? bookings
        : bookings.filter(b => b.status === filter);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'pending_client_approval': return 'warning';
            case 'confirmed': return 'success';
            case 'cancelled': return 'danger';
            case 'completed': return 'info';
            default: return 'info';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendente';
            case 'pending_client_approval': return 'Aguardando Cliente';
            case 'confirmed': return 'Confirmado';
            case 'cancelled': return 'Cancelado';
            case 'completed': return 'Concluído';
            default: return status;
        }
    };

    const KANBAN_COLUMNS = [
        { key: 'pending', label: 'Pendente', color: 'bg-yellow-50 border-yellow-200' },
        { key: 'confirmed', label: 'Confirmado', color: 'bg-blue-50 border-blue-200' },
        { key: 'in_progress', label: 'Em Andamento', color: 'bg-purple-50 border-purple-200' },
        { key: 'completed', label: 'Concluído', color: 'bg-green-50 border-green-200' },
        { key: 'cancelled', label: 'Cancelado', color: 'bg-red-50 border-red-200' },
    ];

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Agendamentos</h2>
                    <p className="text-gray-500">Gerencie as solicitações de agendamento recebidas.</p>
                </div>
                {/* View toggle */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                        Lista
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'kanban' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                        Kanban
                    </button>
                </div>
            </div>

            {viewMode === 'list' && (
                <>
                    {/* Filters */}
                    <div className="flex space-x-2 border-b border-gray-200 pb-1">
                        <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-medium ${filter === 'all' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}>Todos</button>
                        <button onClick={() => setFilter('pending')} className={`px-4 py-2 text-sm font-medium ${filter === 'pending' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}>Pendentes</button>
                        <button onClick={() => setFilter('confirmed')} className={`px-4 py-2 text-sm font-medium ${filter === 'confirmed' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}>Confirmados</button>
                    </div>

                    {/* List */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {loading && (
                                <li className="px-6 py-4">
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <LoadingSkeleton className="h-4 w-1/3" />
                                            <LoadingSkeleton className="h-4 w-20" />
                                        </div>
                                        <LoadingSkeleton className="h-4 w-1/2" />
                                    </div>
                                </li>
                            )}
                            {!loading && filteredBookings.length === 0 && (
                                <li className="px-6 py-4 text-center text-gray-500">Nenhum agendamento encontrado.</li>
                            )}
                            {filteredBookings.map((booking) => (
                                <li key={booking.id}>
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <p className="text-sm font-medium text-brand-primary truncate">{booking.service_title}</p>
                                                <div className="ml-2"><Badge variant={getStatusColor(booking.status)}>{getStatusLabel(booking.status)}</Badge></div>
                                            </div>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {new Date(booking.booking_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500 mr-6">
                                                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                                    {booking.client_name}
                                                </p>
                                                <p className="flex items-center text-sm text-gray-500">
                                                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                                    {booking.booking_time === 'morning' ? 'Manhã' : booking.booking_time === 'afternoon' ? 'Tarde' : booking.booking_time === 'evening' ? 'Noite' : booking.booking_time}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 gap-2">
                                                {booking.status === 'pending' && (
                                                    <>
                                                        <Button size="sm" variant="primary" onClick={() => handleStatusUpdate(booking.id, 'confirmed')}>Aceitar</Button>
                                                        <Button size="sm" variant="secondary" onClick={() => setSelectedBookingForReschedule(booking)}>Re-agendar</Button>
                                                        <Button size="sm" variant="danger" onClick={() => handleStatusUpdate(booking.id, 'cancelled')}>Recusar</Button>
                                                    </>
                                                )}
                                                {booking.status === 'confirmed' && (
                                                    <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(booking.id, 'completed')}>Concluir</Button>
                                                )}
                                            </div>
                                        </div>
                                        {booking.notes && (
                                            <div className="mt-2 text-sm text-gray-500 italic bg-gray-50 p-2 rounded">"{booking.notes}"</div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}

            {viewMode === 'kanban' && (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {KANBAN_COLUMNS.map(col => {
                        const colBookings = bookings.filter(b => b.status === col.key);
                        return (
                            <div key={col.key} className={`flex-shrink-0 w-64 border rounded-xl p-3 ${col.color}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-gray-700">{col.label}</h4>
                                    <span className="text-xs font-medium bg-white/70 text-gray-600 px-2 py-0.5 rounded-full">{colBookings.length}</span>
                                </div>
                                {loading ? (
                                    <div className="space-y-3">
                                        <LoadingSkeleton className="h-28 w-full rounded-xl" />
                                        <LoadingSkeleton className="h-28 w-full rounded-xl" />
                                    </div>
                                ) : colBookings.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-6">Nenhum agendamento</p>
                                ) : (
                                    colBookings.map(booking => (
                                        <KanbanCard
                                            key={booking.id}
                                            appointment={{
                                                id: booking.id,
                                                clientName: booking.client_name || 'Cliente',
                                                clientAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.client_name || 'C')}&background=random`,
                                                service: booking.service_title,
                                                date: booking.booking_date,
                                                time: booking.booking_time === 'morning' ? 'Manhã' : booking.booking_time === 'afternoon' ? 'Tarde' : booking.booking_time === 'evening' ? 'Noite' : booking.booking_time,
                                                status: booking.status,
                                                price: booking.service_price || 0,
                                            }}
                                            onMove={(id, nextStatus) => handleStatusUpdate(id, nextStatus)}
                                            onCancel={(id) => handleStatusUpdate(id, 'cancelled')}
                                        />
                                    ))
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <RescheduleModal
                isOpen={!!selectedBookingForReschedule}
                onClose={() => setSelectedBookingForReschedule(null)}
                booking={selectedBookingForReschedule}
                onSubmit={handleProposeSchedule}
                loading={false}
            />
        </div>
    );
};

export default DashboardAgendamentosPage;
