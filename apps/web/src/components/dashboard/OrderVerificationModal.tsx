import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { QrCode, X, CheckCircle2, ShieldCheck, Keyboard } from 'lucide-react';
import Button from '../ui/Button';

interface OrderVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    onVerify: (orderId: string, status: 'in_progress' | 'completed') => Promise<void>;
    targetStatus: 'in_progress' | 'completed';
}

const OrderVerificationModal = ({ isOpen, onClose, order, onVerify, targetStatus }: OrderVerificationModalProps) => {
    const [manualCode, setManualCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        // The code is the order ID or the last 6 chars of it for "manual" ease if we wanted, 
        // but let's stick to the Order ID as per mobile.
        if (manualCode.trim() === order.id || manualCode.trim() === order.id.split('-')[0].toUpperCase()) {
            setLoading(true);
            try {
                await onVerify(order.id, targetStatus);
                onClose();
            } catch (err) {
                setError('Erro ao validar código.');
            } finally {
                setLoading(false);
            }
        } else {
            setError('Código de verificação inválido.');
        }
    };

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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[32px] bg-white p-8 text-left align-middle shadow-2xl transition-all border border-gray-100">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-primary-50 p-3 rounded-2xl">
                                        <ShieldCheck className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                                <Dialog.Title as="h3" className="text-2xl font-black text-gray-900 leading-tight">
                                    Validar {targetStatus === 'in_progress' ? 'Início' : 'Conclusão'} do Serviço
                                </Dialog.Title>
                                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                                    Para sua segurança e do cliente, é necessário validar o código de 
                                    {targetStatus === 'in_progress' ? ' check-in' : ' check-out'}.
                                </p>

                                <div className="mt-8 space-y-6">
                                    {/* Scan Option (Placeholder) */}
                                    <div className="p-6 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-primary-300 hover:bg-primary-50/30 transition-all cursor-pointer group">
                                        <QrCode className="w-12 h-12 text-gray-400 group-hover:text-primary-500 transition-colors" />
                                        <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-primary-600">Usar Câmera (Scan)</span>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                            <div className="w-full border-t border-gray-100"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
                                            <span className="bg-white px-2 text-gray-300">ou insira manualmente</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                            <input
                                                type="text"
                                                value={manualCode}
                                                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                                placeholder="CÓDIGO DO CLIENTE"
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl text-sm font-black tracking-widest outline-none transition-all"
                                            />
                                        </div>
                                        {error && <p className="text-xs font-bold text-red-500 ml-1">{error}</p>}
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-3">
                                    <Button variant="secondary" className="flex-1 rounded-2xl py-4" onClick={onClose}>
                                        Cancelar
                                    </Button>
                                    <Button 
                                        variant="primary" 
                                        className="flex-1 rounded-2xl py-4" 
                                        onClick={handleSubmit}
                                        isLoading={loading}
                                        disabled={!manualCode}
                                    >
                                        Validar
                                    </Button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default OrderVerificationModal;
