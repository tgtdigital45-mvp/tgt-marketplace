import React, { useState } from 'react';
import { supabase } from '@tgt/shared';
import Button from '../ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

interface DisputeModalProps {
    orderId: string;
    buyerId: string;
    sellerId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const DisputeModal: React.FC<DisputeModalProps> = ({ orderId, buyerId, sellerId, isOpen, onClose, onSuccess }) => {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reason.trim() || reason.length < 10) {
            addToast("O motivo deve ter pelo menos 10 caracteres.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Insert into disputes table
            const { error: disputeError } = await supabase.from('disputes').insert({
                order_id: orderId,
                buyer_id: buyerId,
                seller_id: sellerId,
                reason,
                status: 'open'
            });

            if (disputeError) throw disputeError;

            // 2. Update order status to "in_dispute" (we would ideally add this state to the DB enum, 
            // but for MVP if it's not in the Enum, we just use a system message in the chat is enough 
            // or rely on a dispute flag, but since we didn't alter `orders` status enum, we just send a chat message)
            await supabase.from('messages').insert({
                order_id: orderId,
                sender_id: buyerId,
                content: "SYSTEM_DISPUTE: Uma disputa foi aberta para este pedido e a administração da plataforma foi acionada. Retenção de valores ativada."
            });

            addToast("Disputa aberta com sucesso. Nossa equipe analisará em breve.", "success");
            onSuccess();
            onClose();

        } catch (error: any) {
            console.error("Dispute error:", error);
            addToast("Erro ao abrir disputa: " + error.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Abrir Disputa
                            </h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="bg-red-50 text-red-800 text-sm p-3 rounded-lg border border-red-100 mb-6 font-medium">
                            Atenção: A abertura de uma disputa bloqueará temporariamente o pagamento ao vendedor até que nossa equipe de mediação analise o caso.
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo detalhado da disputa</label>
                                <textarea
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all resize-none"
                                    rows={4}
                                    placeholder="Explique o que aconteceu (o serviço não foi entregue, baixa qualidade, atraso excessivo, etc.)"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    maxLength={1000}
                                    required
                                />
                                <div className="text-right text-xs text-gray-400 mt-1">{reason.length}/1000</div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="danger" disabled={isSubmitting || reason.length < 10}>
                                    {isSubmitting ? 'Acionando Mediação...' : 'Confirmar Disputa'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DisputeModal;
