import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface Booking {
    id: string;
    client_id: string;
    service_title: string;
    service_price: number;
    booking_date: string;
    booking_time: string;
    notes: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
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

                // Placeholder for client names until we have profiles join fully working
                const enrichedBookings = bookingsData?.map((b) => ({
                    ...b,
                    client_name: 'Cliente ' + b.client_id.slice(0, 4), // Fallback
                    client_email: ''
                })) || [];

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
            addToast(`Agendamento ${newStatus === 'confirmed' ? 'confirmado' : 'atualizado'}!`, 'success');
        } catch (err) {
            console.error(err);
            addToast("Erro ao atualizar status.", "error");
        }
    };

    const filteredBookings = filter === 'all'
        ? bookings
        : bookings.filter(b => b.status === filter);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'confirmed': return 'success';
            case 'cancelled': return 'danger';
            case 'completed': return 'info';
            default: return 'info';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendente';
            case 'confirmed': return 'Confirmado';
            case 'cancelled': return 'Cancelado';
            case 'completed': return 'Concluído';
            default: return status;
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Agendamentos</h2>
                    <p className="text-gray-500">Gerencie as solicitações de orçamento recebidas.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-2 border-b border-gray-200 pb-1">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 text-sm font-medium ${filter === 'all' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Todos
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 text-sm font-medium ${filter === 'pending' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pendentes
                </button>
                <button
                    onClick={() => setFilter('confirmed')}
                    className={`px-4 py-2 text-sm font-medium ${filter === 'confirmed' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Confirmados
                </button>
            </div>

            {/* List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {loading && <li className="px-6 py-4 text-center text-gray-500">Carregando...</li>}
                    {!loading && filteredBookings.length === 0 && (
                        <li className="px-6 py-4 text-center text-gray-500">Nenhum agendamento encontrado.</li>
                    )}
                    {filteredBookings.map((booking) => (
                        <li key={booking.id}>
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <p className="text-sm font-medium text-brand-primary truncate">
                                            {booking.service_title}
                                        </p>
                                        <div className="ml-2">
                                            <Badge variant={getStatusColor(booking.status)}>{getStatusLabel(booking.status)}</Badge>
                                        </div>
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
                                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                            {booking.client_name}
                                        </p>
                                        <p className="flex items-center text-sm text-gray-500">
                                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            {booking.booking_time === 'morning' ? 'Manhã' :
                                                booking.booking_time === 'afternoon' ? 'Tarde' :
                                                    booking.booking_time === 'evening' ? 'Noite' : booking.booking_time}
                                        </p>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 gap-2">
                                        {booking.status === 'pending' && (
                                            <>
                                                <Button size="sm" variant="success" onClick={() => handleStatusUpdate(booking.id, 'confirmed')}>Aceitar</Button>
                                                <Button size="sm" variant="danger" onClick={() => handleStatusUpdate(booking.id, 'cancelled')}>Recusar</Button>
                                            </>
                                        )}
                                        {booking.status === 'confirmed' && (
                                            <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(booking.id, 'completed')}>Concluir</Button>
                                        )}
                                    </div>
                                </div>
                                {booking.notes && (
                                    <div className="mt-2 text-sm text-gray-500 italic bg-gray-50 p-2 rounded">
                                        "{booking.notes}"
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DashboardAgendamentosPage;
