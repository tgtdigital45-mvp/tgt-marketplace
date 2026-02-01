import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { DbOrder, Service, User } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import OrderChat from '../../components/orders/OrderChat';

import DeliveryModal from '../../components/orders/DeliveryModal';
import ReviewModal from '../../components/orders/ReviewModal';

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
                        <div className="text-2xl font-bold text-gray-900 mb-6">R$ {order.price}</div>

                        <div className="border-t border-gray-100 pt-6 space-y-3">
                            {/* Contextual Actions */}

                            {/* SELLER ACTIONS */}
                            {isSeller && order.status === 'active' && (
                                <Button className="w-full" onClick={() => setIsDeliveryModalOpen(true)}>
                                    Entregar Trabalho
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
                                            <Button variant="secondary" className="w-full" onClick={() => updateStatus('in_progress')}>
                                                Solicitar Revisão
                                            </Button>
                                            <p className="text-xs text-center text-gray-500">
                                                Verifique os arquivos anexados no chat antes de aprovar.
                                            </p>
                                        </>
                                    )}
                                    {order.status === 'active' && isBuyer && (
                                        <p className="text-xs text-center text-gray-500">Aguardando entrega do vendedor.</p>
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
                </div>

            </main>
            <DeliveryModal
                orderId={order.id}
                isOpen={isDeliveryModalOpen}
                onClose={() => setIsDeliveryModalOpen(false)}
                onSuccess={fetchOrder}
            />
            <ReviewModal
                orderId={order.id}
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                onSuccess={fetchOrder}
            />
        </div>
    );
};

export default OrderRoomPage;
