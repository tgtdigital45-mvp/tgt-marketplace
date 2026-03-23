import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, FileText, ExternalLink, ThumbsUp, AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react';
import { supabase } from '@tgt/core';
import Button from '../ui/Button';

interface OrderDeliveryReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    onSuccess: () => void;
}

const OrderDeliveryReviewModal = ({ isOpen, onClose, order, onSuccess }: OrderDeliveryReviewModalProps) => {
    const [delivery, setDelivery] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && order) {
            fetchDelivery();
        }
    }, [isOpen, order]);

    const fetchDelivery = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error: dbError } = await supabase
                .from('order_deliveries')
                .select('*')
                .eq('order_id', order.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (dbError) throw dbError;
            setDelivery(data);
        } catch (err: any) {
            console.error('Error fetching delivery:', err);
            setError('Não foi possível carregar os detalhes da entrega.');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (approved: boolean) => {
        setActionLoading(true);
        setError('');
        try {
            // 1. Update delivery status
            const { error: deliveryError } = await supabase
                .from('order_deliveries')
                .update({ status: approved ? 'approved' : 'disputed' })
                .eq('id', delivery.id);

            if (deliveryError) throw deliveryError;

            // 2. Update order status
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: approved ? 'completed' : 'disputed' })
                .eq('id', order.id);

            if (orderError) throw orderError;

            // TODO: In a real system, the 'completed' status update would trigger
            // the escrow release via a database trigger or edge function.

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error processing delivery review:', err);
            setError('Erro ao processar sua resposta. Tente novamente.');
        } finally {
            setActionLoading(false);
        }
    };

    if (!order) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-[32px] bg-white p-8 text-left align-middle shadow-2xl transition-all border border-gray-100">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-primary-50 p-3 rounded-2xl">
                                        <CheckCircle2 className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                                <Dialog.Title as="h3" className="text-2xl font-black text-gray-900 leading-tight">
                                    Revisar Entrega
                                </Dialog.Title>
                                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                                    Analise os arquivos e mensagens enviados pelo prestador antes de aprovar a conclusão do serviço.
                                </p>

                                {loading ? (
                                    <div className="mt-12 mb-8 flex flex-col items-center justify-center py-12">
                                        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4" />
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Carregando evidências...</p>
                                    </div>
                                ) : delivery ? (
                                    <div className="mt-8 space-y-8">
                                        {/* Message */}
                                        {delivery.message && (
                                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                                <div className="flex items-center gap-2 mb-3 text-primary-600">
                                                    <MessageSquare size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Nota do Prestador</span>
                                                </div>
                                                <p className="text-gray-700 text-sm leading-relaxed">{delivery.message}</p>
                                            </div>
                                        )}

                                        {/* Files Grid */}
                                        <div>
                                            <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 block">
                                                Arquivos Enviados ({delivery.files?.length || 0})
                                            </label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {delivery.files?.map((file: any, idx: number) => (
                                                    <a 
                                                        key={idx} 
                                                        href={file.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="group relative bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:border-primary-200 hover:shadow-md transition-all active:scale-[0.98]"
                                                    >
                                                        <div className="w-12 h-12 bg-gray-50 group-hover:bg-primary-50 rounded-xl flex items-center justify-center transition-colors overflow-hidden">
                                                            {file.type?.startsWith('image/') ? (
                                                                <img src={file.url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <FileText className="w-6 h-6 text-gray-300 group-hover:text-primary-500 transition-colors" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                                                            <p className="text-[10px] text-gray-400 uppercase font-bold">{(file.size / 1024).toFixed(0)} KB</p>
                                                        </div>
                                                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-primary-500" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="flex items-start gap-2 p-4 bg-red-50 rounded-2xl border border-red-100">
                                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs font-bold text-red-600 leading-tight">{error}</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100">
                                            <Button 
                                                variant="secondary" 
                                                className="rounded-2xl py-4 flex items-center justify-center gap-2 border-2 border-red-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-500"
                                                onClick={() => handleAction(false)}
                                                isLoading={actionLoading}
                                            >
                                                <AlertTriangle size={18} /> Contestar
                                            </Button>
                                            <Button 
                                                variant="primary" 
                                                className="rounded-2xl py-4 flex items-center justify-center gap-2"
                                                onClick={() => handleAction(true)}
                                                isLoading={actionLoading}
                                            >
                                                <ThumbsUp size={18} /> Aprovar e Liberar Pgto
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <p className="text-gray-400">Nenhuma entrega encontrada para este pedido.</p>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default OrderDeliveryReviewModal;
