import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/core';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';



import RescheduleModal from '@/components/booking/RescheduleModal';
import KanbanCard from '@/components/dashboard/KanbanCard';
import OrderVerificationModal from '@/components/dashboard/OrderVerificationModal';
import OrderDeliveryModal from '@/components/dashboard/OrderDeliveryModal';
import { Play, CheckCircle2, Calendar, User, Clock, MoreHorizontal, LayoutGrid, List } from 'lucide-react';
import { Badge, Button, LoadingSkeleton } from '@tgt/ui-web';
import { formatOrderStatus, ORDER_STATUS_COLOR } from '@/utils/statusMapper';


interface Order {
    id: string;
    buyer_id: string;
    service_title: string;
    price: number;
    scheduled_for: string;
    notes?: string;
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'canceled' | 'pending_client_approval' | 'awaiting_approval' | 'disputed';
    created_at: string;
    buyer_name?: string;
    buyer_email?: string;
}

const DashboardAgendamentosPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'in_progress' | 'completed' | 'awaiting_approval'>('all');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    
    // Modals State
    const [selectedOrderForReschedule, setSelectedOrderForReschedule] = useState<Order | null>(null);
    const [verificationModal, setVerificationModal] = useState<{
        isOpen: boolean;
        order: Order | null;
        targetStatus: 'in_progress' | 'completed';
    }>({ isOpen: false, order: null, targetStatus: 'in_progress' });
    
    const [deliveryModal, setDeliveryModal] = useState<{
        isOpen: boolean;
        order: Order | null;
    }>({ isOpen: false, order: null });

    const fetchOrders = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .eq('seller_id', user.id)
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            const buyerIds = [...new Set(ordersData?.map(o => o.buyer_id) || [])];
            const profilesMap: Record<string, any> = {};

            if (buyerIds.length > 0) {
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .in('id', buyerIds);

                if (!profilesError && profiles) {
                    profiles.forEach(p => profilesMap[p.id] = p);
                }
            }

            const enrichedOrders = ordersData?.map((o) => {
                const profile = profilesMap[o.buyer_id];
                return {
                    ...o,
                    buyer_name: profile?.full_name || 'Cliente (s/ perfil)',
                    buyer_email: profile?.email || ''
                };
            }) || [];

            setOrders(enrichedOrders);
        } catch (err) {
            console.error("Error fetching bookings:", err);
            addToast("Erro ao carregar agendamentos.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [user]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as Order['status'] } : o));
            
            const messages: Record<string, string> = {
                accepted: 'Agendamento aceito com sucesso!',
                cancelled: 'Agendamento cancelado.',
                completed: 'Serviço concluído com sucesso!',
                in_progress: 'Serviço iniciado!'
            };

            addToast(messages[newStatus] || 'Status atualizado!', 'success');
        } catch (err) {
            console.error(err);
            addToast("Erro ao atualizar status.", "error");
        }
    };

    const handleProposeSchedule = async (date: string, time: string) => {
        if (!selectedOrderForReschedule) return;
        try {
            const scheduledFor = new Date(`${date}T${time}`).toISOString();
            const proposalExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            const { error } = await supabase
                .from('orders')
                .update({
                    status: 'pending_client_approval',
                    scheduled_for: scheduledFor,
                    proposal_expires_at: proposalExpiresAt
                })
                .eq('id', selectedOrderForReschedule.id);

            if (error) throw error;

            setOrders(prev => prev.map(o => o.id === selectedOrderForReschedule.id ? { ...o, status: 'pending_client_approval', scheduled_for: scheduledFor } : o));
            addToast('Proposta enviada ao cliente!', 'success');
            setSelectedOrderForReschedule(null);
        } catch (err) {
            console.error(err);
            addToast("Erro ao enviar proposta.", "error");
        }
    };

    const handleVerify = async (orderId: string, status: 'in_progress' | 'completed') => {
        await handleStatusUpdate(orderId, status);
    };

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter(o => o.status === filter);

    const getStatusVariant = (status: string) => ORDER_STATUS_COLOR[status] || 'info';

    const getStatusLabel = (status: string) => formatOrderStatus(status);

    const KANBAN_COLUMNS = [
        { key: 'pending', label: 'Pendentes', color: 'bg-amber-50/50 border-amber-100' },
        { key: 'accepted', label: 'Confirmados', color: 'bg-blue-50/50 border-blue-100' },
        { key: 'in_progress', label: 'Em Andamento', color: 'bg-primary-50/30 border-primary-100' },
        { key: 'completed', label: 'Concluídos', color: 'bg-emerald-50/50 border-emerald-100' },
    ];

    return (
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">Meus Agendamentos</h2>
                    <p className="text-gray-500 mt-1 font-medium italic">Gerencie o fluxo de entrega dos seus serviços.</p>
                </div>
                
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-[24px] border border-gray-100 shadow-sm">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <List className="w-4 h-4" />
                        Lista
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${viewMode === 'kanban' ? 'bg-white shadow-md text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Kanban
                    </button>
                </div>
            </div>

            {/* List View Container */}
            {viewMode === 'list' && (
                <div className="space-y-6">
                    {/* Filter Tabs */}
                    <div className="flex space-x-2 bg-gray-50/50 p-1 rounded-2xl w-fit">
                        {['all', 'pending', 'accepted', 'in_progress', 'completed'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab as any)}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                    filter === tab 
                                    ? 'bg-white shadow-sm text-primary-600 border border-gray-100' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {tab === 'all' ? 'Todos' : tab === 'in_progress' ? 'Em Andamento' : getStatusLabel(tab)}
                            </button>
                        ))}
                    </div>

                    {/* Orders Table/List */}
                    <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Serviço & Cliente</th>
                                        <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Agendamento</th>
                                        <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        [...Array(3)].map((_, i) => (
                                            <tr key={i}><td colSpan={4} className="px-8 py-6"><LoadingSkeleton className="h-12 w-full rounded-2xl" /></td></tr>
                                        ))
                                    ) : filteredOrders.length === 0 ? (
                                        <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-medium font-italic">Nenhum agendamento encontrado nesta categoria.</td></tr>
                                    ) : (
                                        filteredOrders.map((order) => {
                                            const date = order.scheduled_for ? new Date(order.scheduled_for) : null;
                                            return (
                                                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 font-black text-lg">
                                                                {order.buyer_name?.charAt(0) || 'C'}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors">{order.service_title}</h4>
                                                                <p className="text-sm text-gray-400 font-bold mt-0.5">{order.buyer_name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2 text-sm font-black text-gray-700">
                                                                <Calendar className="w-4 h-4 text-primary-400" />
                                                                {date ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'A combinar'}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-1">
                                                                <Clock className="w-4 h-4" />
                                                                {date ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <Badge variant={getStatusVariant(order.status)} className="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
                                                            {getStatusLabel(order.status)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {order.status === 'pending' && (
                                                                <>
                                                                    <Button size="sm" variant="primary" onClick={() => handleStatusUpdate(order.id, 'accepted')} className="rounded-xl font-black">Aceitar</Button>
                                                                    <Button size="sm" variant="secondary" onClick={() => setSelectedOrderForReschedule(order)} className="rounded-xl">Re-agendar</Button>
                                                                </>
                                                            )}
                                                            {order.status === 'accepted' && (
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="primary" 
                                                                    className="rounded-xl font-black bg-emerald-600 hover:bg-emerald-700" 
                                                                    onClick={() => setVerificationModal({ isOpen: true, order, targetStatus: 'in_progress' })}
                                                                >
                                                                    <Play className="w-4 h-4 mr-2" /> Iniciar Serviço
                                                                </Button>
                                                            )}
                                                            {order.status === 'in_progress' && (
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="primary" 
                                                                    className="rounded-xl font-black bg-blue-600 hover:bg-blue-700" 
                                                                    onClick={() => setDeliveryModal({ isOpen: true, order })}
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Finalizar Serviço
                                                                </Button>
                                                            )}
                                                            {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'canceled' && (
                                                                <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                                                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Kanban View Container */}
            {viewMode === 'kanban' && (
                <div className="flex gap-6 overflow-x-auto pb-8 snap-x scroll-smooth">
                    {KANBAN_COLUMNS.map(col => {
                        const colOrders = orders.filter(o => o.status === col.key);
                        return (
                            <div key={col.key} className={`flex-shrink-0 w-80 rounded-[40px] border border-gray-100 p-6 ${col.color} snap-start shadow-xl`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{col.label}</h4>
                                    <span className="text-xs font-black bg-white/80 text-primary-600 px-3 py-1 rounded-full shadow-sm">{colOrders.length}</span>
                                </div>
                                
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {loading ? (
                                        <LoadingSkeleton className="h-32 w-full rounded-3xl" />
                                    ) : colOrders.length === 0 ? (
                                        <div className="text-center py-12 px-4 italic text-gray-400 text-xs font-medium">Nenhum agendamento</div>
                                    ) : (
                                        colOrders.map(order => (
                                            <KanbanCard
                                                key={order.id}
                                                appointment={{
                                                    id: order.id,
                                                    clientName: order.buyer_name || 'Cliente',
                                                    clientAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(order.buyer_name || 'C')}&background=random&color=6366f1&bold=true`,
                                                    service: order.service_title,
                                                    date: order.scheduled_for ? new Date(order.scheduled_for).toLocaleDateString() : 'A definir',
                                                    time: order.scheduled_for ? new Date(order.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
                                                    status: order.status,
                                                    price: order.price || 0,
                                                }}
                                                onMove={(id, nextStatus) => {
                                                    if (nextStatus === 'in_progress') {
                                                        const order = orders.find(o => o.id === id);
                                                        setVerificationModal({
                                                            isOpen: true,
                                                            order: order || null,
                                                            targetStatus: nextStatus as 'in_progress'
                                                        });
                                                    } else if (nextStatus === 'completed') {
                                                        const order = orders.find(o => o.id === id);
                                                        setDeliveryModal({
                                                            isOpen: true,
                                                            order: order || null
                                                        });
                                                    } else {
                                                        handleStatusUpdate(id, nextStatus);
                                                    }
                                                }}
                                                onCancel={(id) => handleStatusUpdate(id, 'cancelled')}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <RescheduleModal
                isOpen={!!selectedOrderForReschedule}
                onClose={() => setSelectedOrderForReschedule(null)}
                booking={selectedOrderForReschedule as any}
                onSubmit={handleProposeSchedule}
                loading={false}
            />

            <OrderVerificationModal
                isOpen={verificationModal.isOpen}
                onClose={() => setVerificationModal({ ...verificationModal, isOpen: false })}
                order={verificationModal.order}
                onVerify={handleVerify}
                targetStatus={verificationModal.targetStatus}
            />

            <OrderDeliveryModal
                isOpen={deliveryModal.isOpen}
                onClose={() => setDeliveryModal({ ...deliveryModal, isOpen: false })}
                order={deliveryModal.order}
                onSuccess={() => {
                    fetchOrders();
                    addToast('Entrega realizada com sucesso!', 'success');
                }}
            />
        </div>
    );
};

export default DashboardAgendamentosPage;
