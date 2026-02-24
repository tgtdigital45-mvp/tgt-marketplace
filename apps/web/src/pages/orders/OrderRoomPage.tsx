import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@tgt/shared';
import { DbOrder, Service, User } from '@tgt/shared';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import OrderChat from '@/components/orders/OrderChat';

// Lazy load modals (only load when user opens them)
const DeliveryModal = lazy(() => import('../../components/orders/DeliveryModal'));
const ReviewModal = lazy(() => import('../../components/orders/ReviewModal'));
const DisputeModal = lazy(() => import('../../components/orders/DisputeModal'));

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
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [order, setOrder] = useState<DbOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [service, setService] = useState<Service | null>(null);

    // Mock user roles for current order
    const isBuyer = user?.id === order?.buyer_id;
    const isSeller = user?.id === order?.seller_id; // In real app, check owner_id of company linked to seller_id or logic used in table

    const fetchOrder = async () => {
        if (!orderId) return;
        setLoading(true);
        console.log(`[OrderRoom] Fetching order: ${orderId}`);
        try {
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .maybeSingle();

            if (orderError) {
                console.error("[OrderRoom] DB Error fetching order:", orderError);
                throw orderError;
            }

            console.log("[OrderRoom] Order data received:", orderData);
            setOrder(orderData);

            if (orderData && orderData.service_id) {
                console.log(`[OrderRoom] Fetching service: ${orderData.service_id}`);
                const { data: serviceData, error: serviceError } = await supabase
                    .from('services')
                    .select('*')
                    .eq('id', orderData.service_id)
                    .maybeSingle();

                if (serviceError) console.error("[OrderRoom] Error fetching service:", serviceError);
                setService(serviceData);
            }

        } catch (error: any) {
            console.error("[OrderRoom] Root error in fetchOrder:", error);
            addToast("Erro ao carregar detalhes do pedido.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    // Handle Payment Success, Cancellation & Polling
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const isSuccess = queryParams.get('success') === 'true';
        const isCanceled = queryParams.get('canceled') === 'true';

        if (isCanceled) {
            addToast("O pagamento foi cancelado. Você pode tentar novamente no checkout.", "info");
            if (order && isBuyer && order.service_id) {
                navigate(`/checkout/${order.service_id}?orderId=${order.id}`, { replace: true });
            } else if (isBuyer) {
                console.warn("[OrderRoom] Cancelled payment but service_id missing for order:", order?.id);
                navigate('/', { replace: true });
            }
            return;
        }

        // Redirect UNPAID buyers back to checkout
        if (order && isBuyer && (order.status as string) === 'pending_payment') {
            if (order.service_id) {
                console.log("[OrderRoom] Unpaid order detected for buyer. Redirecting to checkout.");
                navigate(`/checkout/${order.service_id}?orderId=${order.id}`, { replace: true });
            } else {
                console.warn("[OrderRoom] Unpaid order but service_id missing. Redirecting to home.");
                navigate('/', { replace: true });
            }
            return;
        }

        if (isSuccess && orderId) {
            addToast("Pagamento realizado com sucesso! Atualizando pedido...", "success");

            // Remove the query param to prevent re-toast on refresh
            navigate(location.pathname, { replace: true });

            // Start polling for status update (webhook latency)
            const pollInterval = setInterval(async () => {
                try {
                    const { data: updatedOrder } = await supabase
                        .from('orders')
                        .select('status')
                        .eq('id', orderId)
                        .maybeSingle();

                    if (updatedOrder && (updatedOrder.status === 'paid' || updatedOrder.status === 'in_progress' || updatedOrder.status === 'active')) {
                        clearInterval(pollInterval);
                        fetchOrder();
                        addToast("Status do pedido atualizado!", "success");
                    }
                } catch (e) {
                    console.error("[OrderRoom] Error in polling interval:", e);
                }
            }, 3000);

            // Stop polling after 30 seconds to avoid infinite loop
            setTimeout(() => {
                clearInterval(pollInterval);
            }, 30000);

            return () => clearInterval(pollInterval);
        }
    }, [location.search, orderId, order, isBuyer, addToast, navigate]);

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
                    receiver_id: isBuyer ? order.seller_id : order.buyer_id,
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

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <LoadingSkeleton className="h-8 w-48 rounded-lg" />
                    <LoadingSkeleton className="h-6 w-32 rounded-lg" />
                </div>
            </div>
            <main className="flex-1 max-w-6xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                <div className="lg:col-span-2 space-y-6">
                    <LoadingSkeleton className="h-[500px] w-full rounded-2xl" />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <LoadingSkeleton className="h-64 w-full rounded-2xl" />
                    <LoadingSkeleton className="h-48 w-full rounded-2xl" />
                </div>
            </main>
        </div>
    );
    if (!order) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido não encontrado</h2>
                <p className="text-gray-600 mb-6">
                    Não conseguimos localizar o pedido solicitado. Ele pode ter sido removido ou o ID está incorreto.
                </p>
                <Link to="/">
                    <Button className="w-full">
                        Voltar para o Início
                    </Button>
                </Link>
            </div>
        </div>
    );

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
                    {order && order.status === 'cancelled' && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 text-center font-medium">
                            Este pedido foi cancelado e os valores foram estornados.
                        </div>
                    )}
                    <OrderChat
                        orderId={order.id}
                        receiverId={isBuyer ? order.seller_id : order.buyer_id}
                    />
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
                            {order.status === 'active' && <Badge variant="info" className="bg-blue-100 text-blue-700 border-blue-200 shadow-sm px-4 py-1.5 text-xs">Em Aberto</Badge>}
                            {order.status === 'delivered' && <Badge variant="warning" className="bg-amber-100 text-amber-700 border-amber-200 shadow-sm px-4 py-1.5 text-xs">Entregue / Em Análise</Badge>}
                            {order.status === 'completed' && <Badge variant="success" className="bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm px-4 py-1.5 text-xs">Concluído</Badge>}
                            {order.status === 'in_progress' && <Badge variant="warning" className="bg-orange-100 text-orange-700 border-orange-200 shadow-sm px-4 py-1.5 text-xs">Em Revisão</Badge>}
                            {order.status === 'cancelled' && <Badge variant="danger" className="bg-rose-100 text-rose-700 border-rose-200 shadow-sm px-4 py-1.5 text-xs">Cancelado</Badge>}
                        </div>

                        {order.hiring_responses && Object.keys(order.hiring_responses).length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Respostas do Cliente</h4>
                                <div className="space-y-3">
                                    {Object.entries(order.hiring_responses).map(([key, value]) => (
                                        <div key={key} className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                            <p className="text-[10px] text-gray-400 font-medium truncate mb-0.5">{key}</p>
                                            <p className="text-xs text-gray-700 leading-relaxed">{String(value)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                            <div className="space-y-3">
                                <Button className="w-full" onClick={() => setIsDeliveryModalOpen(true)}>
                                    {order.status === 'in_progress' ? 'Enviar Nova Versão' : 'Entregar Trabalho'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full text-red-500 hover:bg-red-50 border-red-200"
                                    onClick={async () => {
                                        if (confirm("Tem certeza? Esta ação cancelará o pedido e estornará o valor integralmente para o comprador. O dinheiro sairá de sua carteira pendente.")) {
                                            try {
                                                const { data, error } = await supabase.functions.invoke('process-refund', {
                                                    body: { order_id: order.id, reason: 'requested_by_customer' }
                                                });
                                                if (error) throw error;
                                                if (data?.error) throw new Error(data.error);
                                                addToast("Pedido estornado com sucesso.", "success");
                                                fetchOrder();
                                            } catch (err: any) {
                                                addToast("Erro ao estornar: " + err.message, "error");
                                            }
                                        }
                                    }}
                                >
                                    Cancelar e Estornar Cliente
                                </Button>
                            </div>
                        )}

                        {/* BUYER ACTIONS */}
                        {(isBuyer || !isSeller) && (
                            <div className="space-y-3">
                                {order.status === 'delivered' && (
                                    <>
                                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => setIsReviewModalOpen(true)}>
                                            Aprovar e Finalizar
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="w-full text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={async () => {
                                                if (order.revision_count >= 3) {
                                                    addToast("Limite de revisões atingido. Por favor, abra uma disputa se ainda houver problemas.", "warning");
                                                    return;
                                                }
                                                // Increment revision_count and set back to in_progress
                                                try {
                                                    const { error } = await supabase
                                                        .from('orders')
                                                        .update({
                                                            status: 'in_progress',
                                                            revision_count: (order.revision_count || 0) + 1
                                                        })
                                                        .eq('id', order.id);

                                                    if (error) throw error;

                                                    await supabase.from('messages').insert({
                                                        order_id: order.id,
                                                        sender_id: user?.id,
                                                        content: `SYSTEM: O comprador solicitou a revisão #${(order.revision_count || 0) + 1}.`,
                                                    });

                                                    fetchOrder();
                                                    addToast("Revisão solicitada com sucesso.", "success");
                                                } catch (err: any) {
                                                    addToast("Erro ao solicitar revisão: " + err.message, "error");
                                                }
                                            }}
                                        >
                                            Solicitar Revisão ({order.revision_count || 0}/3)
                                        </Button>
                                        <Button variant="outline" className="w-full text-gray-500 hover:bg-gray-100" onClick={() => setIsDisputeModalOpen(true)}>
                                            Tive um problema (Abrir Disputa)
                                        </Button>
                                        <p className="text-xs text-center text-gray-500">
                                            Verifique os arquivos anexados no chat antes de aprovar.
                                        </p>
                                    </>
                                )}
                                {(order.status === 'active' || order.status === 'in_progress') && isBuyer && (
                                    <>
                                        <Button variant="outline" className="w-full text-red-500 hover:bg-red-50 border-red-200" onClick={() => setIsDisputeModalOpen(true)}>
                                            Tive um problema (Abrir Disputa)
                                        </Button>
                                        <p className="text-xs text-center text-gray-500">
                                            {order.status === 'in_progress' ? 'Aguardando nova versão do vendedor.' : 'Aguardando entrega do vendedor.'}
                                        </p>
                                    </>
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

            {isDisputeModalOpen && (
                <Suspense fallback={
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <LoadingSpinner />
                    </div>
                }>
                    <DisputeModal
                        orderId={order.id}
                        buyerId={order.buyer_id!}
                        sellerId={order.seller_id!}
                        isOpen={isDisputeModalOpen}
                        onClose={() => setIsDisputeModalOpen(false)}
                        onSuccess={fetchOrder}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default OrderRoomPage;
