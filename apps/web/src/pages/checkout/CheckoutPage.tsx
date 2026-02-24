import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@tgt/shared';
import { Service } from '@tgt/shared';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useCheckout } from '@/hooks/useCheckout';

const CheckoutPage = () => {
    const { serviceId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast } = useToast();
    const { redirectToCheckout, isLoading: isCheckoutLoading } = useCheckout();

    const tier = (searchParams.get('tier') || 'basic') as 'basic' | 'standard' | 'premium';
    const bookingDate = searchParams.get('date');
    const bookingTime = searchParams.get('time');
    const encodedResponses = searchParams.get('responses');

    // Decode hiring responses
    let hiringResponses = {};
    if (encodedResponses) {
        try {
            // Robust base64 decoding for UTF-8
            hiringResponses = JSON.parse(decodeURIComponent(escape(atob(encodedResponses))));
        } catch (e) {
            console.error('Failed to decode hiring responses', e);
        }
    }

    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [resumingOrderId, setResumingOrderId] = useState<string | null>(null);

    // Get orderId from search parameters for resumption
    const orderIdParam = searchParams.get('orderId');

    useEffect(() => {
        const fetchDetails = async () => {
            if (!serviceId) return;
            try {
                // 1. Fetch Service
                const { data: serviceData, error: serviceError } = await supabase
                    .from('services')
                    .select('*, company:companies(*)')
                    .eq('id', serviceId)
                    .single();

                if (serviceError) throw serviceError;
                setService(serviceData);

                // 2. If orderId is present, fetch order to resume
                if (orderIdParam) {
                    console.log("[Checkout] Resuming order:", orderIdParam);
                    const { data: orderData, error: orderError } = await supabase
                        .from('orders')
                        .select('*')
                        .eq('id', orderIdParam)
                        .maybeSingle();

                    if (orderError) throw orderError;

                    if (orderData) {
                        if (orderData.status !== 'pending_payment') {
                            addToast("Este pedido já foi processado.", "info");
                            navigate(`/orders/${orderData.id}`);
                            return;
                        }
                        setResumingOrderId(orderData.id);
                        // Optional: sync tier and responses if they differ from URL
                        // But usually the URL is the source of truth for navigation
                    }
                }
            } catch (error) {
                console.error("Error loading details", error);
                addToast("Erro ao carregar informações.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [serviceId, orderIdParam]);

    const handleConfirmPayment = async () => {
        if (!user || !service) return;

        setProcessing(true);
        try {
            let orderId = resumingOrderId;

            if (!orderId) {
                const selectedPackage = service.packages?.[tier];
                const price = selectedPackage?.price || service.price || 0;

                // 1. Create SAGA Order (Atomic RPC)
                console.log("Service Object for Payment:", service);
                const companyData = (service as any).company || (service as any).companies;
                const sellerId = companyData?.profile_id;
                console.log("Extracted Seller ID:", sellerId, "From company data:", companyData);

                if (!sellerId) throw new Error("ID do vendedor não encontrado. A empresa não possui um profile_id vinculado.");

                const { data: sagaResult, error: sagaError } = await supabase.rpc('create_order_saga', {
                    p_service_id: service.id,
                    p_package_tier: tier,
                    p_seller_id: sellerId,
                    p_booking_date: bookingDate,
                    p_booking_time: bookingTime,
                    p_hiring_responses: hiringResponses
                });

                if (sagaError) throw new Error(`Erro ao criar pedido SAGA: ${sagaError.message}`);

                console.log("SAGA Order Created:", sagaResult);
                orderId = (sagaResult as any).order_id;
            } else {
                console.log("[Checkout] Using existing order ID for payment:", orderId);
            }

            if (!orderId) throw new Error("ID do pedido não encontrado.");

            // 2. Redirect to Stripe Checkout using the Order ID
            await redirectToCheckout({ order_id: orderId });

        } catch (error: any) {
            console.error("Payment initiation error:", error);
            addToast(error.message || "Erro ao iniciar pagamento.", "error");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="h-[40px] w-64 bg-gray-200 rounded-lg mb-8 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[400px] animate-pulse"></div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[200px] animate-pulse"></div>
                    </div>
                    <div className="md:col-span-1">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[500px] animate-pulse"></div>
                    </div>
                </div>
            </div>
        </div>
    );
    if (!service) return <div className="h-screen flex items-center justify-center">Serviço não encontrado.</div>;

    const selectedPackage = service.packages?.[tier];

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout Seguro</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left: Payment Method (Mock) */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-xl font-semibold mb-4">Método de Pagamento</h2>

                            <div className="space-y-4">
                                <div className="border-2 p-4 rounded-lg flex items-center bg-brand-primary/5 border-brand-primary">
                                    <div className="w-5 h-5 rounded-full border-2 border-brand-primary mr-3 flex items-center justify-center bg-brand-primary">
                                        <div className="w-2 h-2 rounded-full bg-white"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900 text-lg">Pix & Cartão (Stripe)</span>
                                        <span className="text-sm text-gray-600">Pagamento instantâneo via Pix ou em até 12x no cartão</span>
                                    </div>
                                    <div className="ml-auto flex items-center space-x-2">
                                        <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 border border-green-200 rounded">
                                            <span className="text-[10px] font-bold text-green-700">PIX</span>
                                        </div>
                                        <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded">
                                            <span className="text-[10px] font-bold text-blue-700">CARTÃO</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Ao clicar em <strong>Pagar Agora</strong>, você será redirecionado para o ambiente seguro da <strong>Stripe</strong> para concluir sua transação.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="md:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24">
                            <h2 className="text-xl font-semibold mb-6">Resumo do Pedido</h2>

                            <div className="flex items-start mb-4 pb-4 border-b border-gray-100">
                                <img
                                    src={service.gallery?.[0] || 'https://via.placeholder.com/150'}
                                    alt={service.title}
                                    className="w-16 h-10 object-cover rounded mr-3"
                                />
                                <p className="text-sm font-medium text-gray-800 line-clamp-2">{service.title}</p>
                            </div>

                            <div className="space-y-3 text-sm text-gray-600 mb-6">
                                <div className="flex justify-between font-medium">
                                    <span>Pacote <span className="capitalize text-brand-primary">({tier})</span></span>
                                    <span>R$ {selectedPackage?.price}</span>
                                </div>
                                {bookingDate && (
                                    <div className="flex justify-between py-2 border-t border-gray-50 mt-2">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400">Agendamento</span>
                                            <span className="font-semibold text-gray-800">
                                                {new Date(bookingDate + 'T00:00:00').toLocaleDateString('pt-BR')} às {bookingTime}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {Object.keys(hiringResponses).length > 0 && (
                                    <div className="py-2 border-t border-gray-50 mt-2">
                                        <span className="text-xs text-gray-400 block mb-1">Informações Adicionais</span>
                                        <div className="bg-gray-50 p-2 rounded text-[10px] space-y-1">
                                            {Object.entries(hiringResponses).map(([key, value]) => (
                                                <div key={key} className="flex gap-1">
                                                    <span className="text-gray-400">•</span>
                                                    <span className="text-gray-600 whitespace-pre-wrap">{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Taxa de Serviço</span>
                                    <span>R$ 0,00</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-lg font-bold text-gray-900 pt-4 border-t border-gray-100 mb-6">
                                <span>Total</span>
                                <span>R$ {selectedPackage?.price}</span>
                            </div>

                            <Button
                                variant="primary"
                                className="w-full py-4 text-lg font-bold shadow-lg shadow-brand-primary/20"
                                onClick={handleConfirmPayment}
                                isLoading={processing || isCheckoutLoading}
                            >
                                {processing ? 'Preparando Checkout...' : 'Pagar Agora'}
                            </Button>

                            <p className="text-xs text-gray-400 mt-4 text-center">
                                Ao continuar, você concorda com nossos Termos de Serviço.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
