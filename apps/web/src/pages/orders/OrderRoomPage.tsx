import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@tgt/shared';
import { DbOrder, Service, User } from '@tgt/shared';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import OrderChat from '@/components/orders/OrderChat';

// Lazy load modals (only load when user opens them)
const DeliveryModal = lazy(() => import('../../components/orders/DeliveryModal'));
const ReviewModal = lazy(() => import('../../components/orders/ReviewModal'));

// Simple Countdown Component
const Countdown = ({ deadline }: { deadline: string }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(deadline).getTime();
            const distance = end - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft("EXPIRADO");
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        }, 1000);

        return () => clearInterval(interval);
    }, [deadline]);

    return <span className="font-mono text-xl font-bold text-gray-800">{timeLeft}</span>;
};

const OrderRoomPage = () => {
    const { orderId } = useParams();
    const { user } = useAuth();
    const { addToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [order, setOrder] = useState<DbOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [service, setService] = useState<Service | null>(null);

    // Mock user roles for current order
    const isBuyer = user?.id === order?.buyer_id;
    const isSeller = user?.id === order?.seller_id; // In real app, check owner_id of company linked to seller_id or logic used in table

    const fetchOrder = async () => {
        if (!orderId) return;
        try {
            // Fetch Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (orderError) throw orderError;
            setOrder(orderData);

            // Fetch Service details
            if (orderData.service_id) {
                const { data: serviceData } = await supabase
                    .from('services')
                    .select('*')
                    .eq('id', orderData.service_id)
                    .single();
                setService(serviceData);
            }

        } catch (error) {
            console.error("Error loading order", error);
            addToast("Erro ao carregar pedido.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    // Handle Payment Success & Polling
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const isSuccess = queryParams.get('success') === 'true';

        if (isSuccess && orderId) {
            addToast("Pagamento realizado com sucesso! Atualizando pedido...", "success");

            // Remove the query param to prevent re-toast on refresh
            navigate(location.pathname, { replace: true });

            // Start polling for status update (webhook latency)
            const pollInterval = setInterval(async () => {
                const { data: updatedOrder } = await supabase
                    .from('orders')
                    .select('status')
                    .eq('id', orderId)
                    .single();

                if (updatedOrder && (updatedOrder.status === 'paid' || updatedOrder.status === 'in_progress' || updatedOrder.status === 'active')) {
                    // Status updated! Stop polling and refresh full data
                    clearInterval(pollInterval);
                    fetchOrder();
                    addToast("Status do pedido atualizado!", "success");
                }
            }, 3000); // Check every 3 seconds

            // Stop polling after 30 seconds to avoid infinite loop
            setTimeout(() => {
                clearInterval(pollInterval);
            }, 30000);

            return () => clearInterval(pollInterval);
        }
    }, [location.search, orderId, addToast, navigate]);

    const updateStatus = async (newStatus: string) => {
        if (!order) return;
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', order.id);

            if (error) throw error;

            // System Message for Revision
            if (newStatus === 'in_progress' && order.status === 'delivered') {
                await supabase.from('messages').insert({
                    order_id: order.id,
                    sender_id: user?.id, // Sent by Buyer (current user)
                    content: "SYSTEM: O comprador solicitou alterações. Por favor, revise o trabalho.",
                    // Mark as system message if we had a type, but content convention works for now
                });
            }

            fetchOrder();
            addToast(`Pedido atualizado para: ${newStatus}`, "success");
        } catch (error) {
            console.error("Error updating status", error);
            addToast("Erro ao atualizar status.", "error");
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    if (!order) return <div className="h-screen flex items-center justify-center">Pedido não encontrado.</div>;

    // Determine current step index for progress bar
    const steps = ['active', 'delivered', 'completed'];
    const currentStepIndex = steps.indexOf(order.status) === -1 ? 0 : steps.indexOf(order.status);
    const isCancelled = order.status === 'cancelled';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header / Status Bar */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Pedido #{order.id.slice(0, 8)}</h1>
                    {order.status === 'active' && <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>Entrega em:</span>
                        <Countdown deadline={order.delivery_deadline} />
                    </div>}
                </div>

                {/* Progress Bar */}
                {!isCancelled && (
                    <div className="max-w-4xl mx-auto mt-6 mb-2">
                        <div className="flex items-center justify-between relative">
                            <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-0"></div>
                            {steps.map((s, i) => (
                                <div key={s} className="relative z-10 flex flex-col items-center bg-white px-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 
                                        ${i <= currentStepIndex ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 text-gray-400'}`}>
                                        {i + 1}
                                    </div>
                                    <span className="text-xs font-medium uppercase mt-1 text-gray-500">{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <main className="flex-1 max-w-6xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">

                {/* Center: Chat / Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    <OrderChat orderId={order.id} />
                </div>

                {/* Right: Sidebar Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Detalhes do Pedido</h3>
                        <div className="flex items-center mb-4">
                            {service?.gallery?.[0] && <img src={service.gallery[0]} className="w-16 h-10 object-cover rounded mr-3" alt="Service" />}
                            <div>
                                <h4 className="font-medium text-sm text-gray-800 line-clamp-2">{order.service_title || 'Serviço Personalizado'}</h4>
                                <p className="text-xs text-brand-primary font-bold uppercase">{order.package_tier}</p>
                            </div>
                        </div>

                        {/* STATUS BAR - IMPROVED COLORS */}
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                                    ${order.status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                    ${order.status === 'delivered' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                                    ${order.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                    ${order.status === 'in_progress' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                                    ${order.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                `}>
                                {order.status === 'in_progress' ? 'Em Revisão' : order.status}
                            </span>
                        </div>
                    </div>

                    {/* Delivery Display Card */}
                    {(order.status === 'delivered' || order.status === 'completed') && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 mb-6">
                            <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Entrega Disponível
                            </h3>
                            <p className="text-sm text-blue-700 mb-4">
                                O vendedor enviou os arquivos finais. Baixe para conferir.
                            </p>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                                onClick={async () => {
                                    // Generate Signed URL dynamically
                                    try {
                                        // Get path from snapshot if available, or fallback to trying to list/guess
                                        // Accessing 'package_snapshot' as any to avoid strict TS issues if types not updated
                                        const snapshot = order.package_snapshot as any;
                                        const filePath = snapshot?.latest_delivery;

                                        if (!filePath) {
                                            addToast("Arquivo não encontrado no registro.", "error");
                                            return;
                                        }

                                        const { data, error } = await supabase.storage
                                            .from('order-deliverables')
                                            .createSignedUrl(filePath, 60); // 60 seconds validity

                                        if (error) throw error;
                                        if (data?.signedUrl) {
                                            window.open(data.signedUrl, '_blank');
                                        }
                                    } catch (e: any) {
                                        addToast("Erro ao gerar link de download: " + e.message, "error");
                                    }
                                }}
                            >
                                Baixar Arquivos
                            </Button>
                        </div>
                    )}


                    <div className="border-t border-gray-100 pt-6 space-y-3">
                        {/* Contextual Actions */}

                        {/* SELLER ACTIONS */}
                        {isSeller && (order.status === 'active' || order.status === 'in_progress') && (
                            <Button className="w-full" onClick={() => setIsDeliveryModalOpen(true)}>
                                {order.status === 'in_progress' ? 'Enviar Nova Versão' : 'Entregar Trabalho'}
                            </Button>
                        )}

                        {/* BUYER ACTIONS */}
                        {(isBuyer || !isSeller) && (
                            <div className="space-y-3">
                                {order.status === 'delivered' && (
                                    <>
                                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => setIsReviewModalOpen(true)}>
                                            Aprovar e Finalizar
                                        </Button>
                                        <Button variant="secondary" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateStatus('in_progress')}>
                                            Solicitar Revisão
                                        </Button>
                                        <p className="text-xs text-center text-gray-500">
                                            Verifique os arquivos anexados no chat antes de aprovar.
                                        </p>
                                    </>
                                )}
                                {(order.status === 'active' || order.status === 'in_progress') && isBuyer && (
                                    <p className="text-xs text-center text-gray-500">
                                        {order.status === 'in_progress' ? 'Aguardando nova versão do vendedor.' : 'Aguardando entrega do vendedor.'}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Fallback for viewing */}
                        {order.status === 'completed' && (
                            <div className="text-center text-green-600 font-medium py-2 bg-green-50 rounded">
                                Obrigado pela compra!
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Lazy load modals with Suspense */}
            {isDeliveryModalOpen && (
                <Suspense fallback={
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <LoadingSpinner />
                    </div>
                }>
                    <DeliveryModal
                        orderId={order.id}
                        isOpen={isDeliveryModalOpen}
                        onClose={() => setIsDeliveryModalOpen(false)}
                        onSuccess={fetchOrder}
                    />
                </Suspense>
            )}

            {isReviewModalOpen && (
                <Suspense fallback={
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <LoadingSpinner />
                    </div>
                }>
                    <ReviewModal
                        orderId={order.id}
                        reviewerId={order.buyer_id}
                        revieweeId={order.seller_id}
                        isOpen={isReviewModalOpen}
                        onClose={() => setIsReviewModalOpen(false)}
                        onSuccess={fetchOrder}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default OrderRoomPage;
