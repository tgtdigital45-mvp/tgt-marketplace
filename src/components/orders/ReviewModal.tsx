import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import { useToast } from '../../contexts/ToastContext';

interface ReviewModalProps {
    orderId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ orderId, isOpen, onClose, onSuccess }) => {
    const { addToast } = useToast();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!rating) {
            addToast('Por favor, selecione uma nota de 1 a 5.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            // Call the secure RPC function
            const { error } = await supabase.rpc('process_order_completion', {
                p_order_id: orderId,
                p_rating: rating,
                p_comment: comment
            });

            if (error) throw error;

            addToast('Avaliação enviada e pedido concluído!', 'success');
            onSuccess();
            onClose();

        } catch (error: any) {
            console.error('Review error:', error);
            addToast('Erro ao enviar avaliação: ' + error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Aprovar Trabalho</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Ao aprovar, o pagamento será liberado para o vendedor.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Rating Stars */}
                    <div className="flex justify-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className={`text-4xl focus:outline-none transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                                ★
                            </button>
                        ))}
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Comentário (Opcional)</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary min-h-[100px]"
                            placeholder="Como foi sua experiência com este vendedor?"
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
                    <Button onClick={handleSubmit} isLoading={submitting} className="bg-green-600 hover:bg-green-700">
                        Confirmar e Avaliar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
