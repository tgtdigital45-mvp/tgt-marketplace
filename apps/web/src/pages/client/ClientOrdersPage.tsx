import React, { useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { BookingWithCompany } from '@tgt/core';;
import ProposalList from '@/components/client/ProposalList';
import { useNavigate } from 'react-router-dom';
import { useClientOrders } from '@/hooks/useClientOrders';
import { useToast } from '@/contexts/ToastContext';
import OrderDeliveryReviewModal from '@/components/dashboard/OrderDeliveryReviewModal';
import { CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { Button } from '@tgt/ui-web';


const ClientOrdersPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data
    const { data: ordersData, isLoading: loading, refetch: fetchOrders } = useClientOrders(user?.id);
    const jobs = ordersData?.jobs || [];
    const bookings = ordersData?.bookings || [];
    const { addToast } = useToast();

    // State
    const [activeTab, setActiveTab] = useState<'requests' | 'active' | 'history'>('requests');
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
    const [reviewModal, setReviewModal] = useState<{
        isOpen: boolean;
        order: any | null;
    }>({ isOpen: false, order: null });

    const handleAcceptProposal = () => {
        // Refresh handled automatically by query invalidation or manual refetch if needed
        // For now, simpler to just let user know or navigate
        // Ideally we would invalidateQueries(['client-orders']) here via queryClient
        window.location.reload(); // Temporary simple refresh until mutation hook added
    };

    const activeBookings = bookings.filter(o => ['pending', 'confirmed', 'in_progress', 'awaiting_approval', 'disputed'].includes(o.status));
    const historyBookings = bookings.filter(o => ['completed', 'cancelled', 'rejected'].includes(o.status));

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
                <Button onClick={() => navigate('/cliente/novo-pedido')}>
                    + Novo Pedido
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-4 px-6 font-medium text-sm transition-colors whitespace-nowrap relative ${activeTab === 'requests' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Orçamentos Abertos ({jobs.filter(j => j.status === 'open').length})
                    {activeTab === 'requests' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary rounded-t-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-4 px-6 font-medium text-sm transition-colors whitespace-nowrap relative ${activeTab === 'active' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Agendados/Em Andamento
                    {activeTab === 'active' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary rounded-t-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-4 px-6 font-medium text-sm transition-colors whitespace-nowrap relative ${activeTab === 'history' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Histórico
                    {activeTab === 'history' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-primary rounded-t-full"></span>}
                </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
                                <div className="h-6 w-1/3 bg-gray-100 rounded mb-2"></div>
                                <div className="h-4 w-2/3 bg-gray-50 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* REQUESTS TAB (JOBS) */}
                        {activeTab === 'requests' && (
                            jobs.length === 0 ? (
                                <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <h3 className="text-lg font-medium text-gray-900">Você ainda não pediu nenhum orçamento.</h3>
                                    <p className="text-gray-500 mb-4">Publique sua primeira necessidade agora.</p>
                                    <Button onClick={() => navigate('/cliente/novo-pedido')}>Solicitar Orçamento</Button>
                                </div>
                            ) : (
                                jobs.map(job => (
                                    <div key={job.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="p-6 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                                                        <span className={`px-2 py-0.5 text-xs rounded-full ${job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {job.status === 'open' ? 'Aberto' : job.status}
                                                        </span>
                                                        {job.category && <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{job.category.name}</span>}
                                                    </div>
                                                    <p className="text-gray-600 text-sm line-clamp-1">{job.description}</p>
                                                    <div className="font-medium text-xs text-brand-primary mt-2">
                                                        {job.proposals.length} propostas recebidas
                                                    </div>
                                                </div>
                                                <div className="text-gray-400">
                                                    {expandedJobId === job.id ? '▲' : '▼'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Proposals Expansion */}
                                        {expandedJobId === job.id && (
                                            <div className="bg-gray-50 p-6 border-t border-gray-200">
                                                <ProposalList
                                                    jobId={job.id}
                                                    proposals={job.proposals}
                                                    onProposalAccepted={handleAcceptProposal}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )
                        )}

                        {/* ACTIVE TAB (BOOKINGS) */}
                        {activeTab === 'active' && (
                            activeBookings.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-500">Nenhum serviço agendado no momento.</div>
                            ) : (
                                activeBookings.map(order => (
                                    <BookingCard 
                                        key={order.id} 
                                        order={order} 
                                        onReview={() => setReviewModal({ isOpen: true, order })}
                                    />
                                ))
                            )
                        )}

                        {/* HISTORY TAB */}
                        {activeTab === 'history' && (
                            historyBookings.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-500">Histórico vazio.</div>
                            ) : (
                                historyBookings.map(order => <BookingCard key={order.id} order={order} />)
                            )
                        )}
                    </>
                )}
            </div>

            <OrderDeliveryReviewModal
                isOpen={reviewModal.isOpen}
                onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
                order={reviewModal.order}
                onSuccess={() => {
                    fetchOrders();
                    addToast('Avaliação enviada com sucesso!', 'success');
                }}
            />
        </div>
    );
};

// Helper Component for Booking Display
const BookingCard: React.FC<{ order: any, onReview?: () => void }> = ({ order, onReview }) => (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="font-bold text-lg text-gray-900 leading-tight">{order.companyName}</h3>
                <p className="text-gray-500 text-sm mt-0.5">{order.serviceName}</p>
            </div>
            <div className="text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    order.status === 'awaiting_approval' 
                    ? 'bg-amber-50 text-amber-600' 
                    : 'bg-gray-50 text-gray-500'
                }`}>
                    {order.status === 'confirmed' ? 'Agendado' : 
                     order.status === 'pending' ? 'Pendente' : 
                     order.status === 'awaiting_approval' ? 'Aguardando sua Aprovação' :
                     order.status === 'disputed' ? 'Em Disputa' :
                     order.status}
                </span>
                <p className="text-sm font-black text-primary-600 mt-2">R$ {order.price?.toFixed(2)}</p>
            </div>
        </div>
        <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">
            <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-300" />
                {new Date(order.date).toLocaleDateString()}
            </div>
            {order.time && (
                <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-300" />
                    {order.time}
                </div>
            )}
        </div>
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            {order.status === 'awaiting_approval' && (
                <Button variant="primary" size="sm" className="rounded-xl px-4 py-2 flex items-center gap-2" onClick={onReview}>
                    <CheckCircle size={16} /> Revisar Entrega
                </Button>
            )}
            <Button variant="secondary" size="sm" className="rounded-xl px-6 py-2">Ver Detalhes</Button>
        </div>
    </div>
);

export default ClientOrdersPage;
