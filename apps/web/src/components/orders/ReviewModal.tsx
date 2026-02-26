import React, { useState } from 'react';
import { supabase } from '@tgt/shared';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

interface ReviewModalProps {
    orderId: string;
    reviewerId: string;
    revieweeId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ orderId, reviewerId, revieweeId, isOpen, onClose, onSuccess }) => {
    const { addToast } = useToast();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    const handleSubmit = async () => {
        if (rating === 0) {
            addToast('Por favor, selecione uma nota de 1 a 5.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            // 1. Insert Review
            const { error: reviewError } = await supabase
                .from('reviews')
                .insert({
                    order_id: orderId,
                    reviewer_id: reviewerId,
                    reviewee_id: revieweeId,
                    rating: rating,
                    comment: comment
                });

            if (reviewError) throw reviewError;

            if (reviewError) throw reviewError;

            // 2. Safely capture Escrow payment via backend Edge Function
            const { data: fnData, error: fnError } = await supabase.functions.invoke('capture-payment', {
                body: { order_id: orderId }
            });

            if (fnError) {
                // If there's an error from the function, check if it's already caught in response
                throw new Error(fnError.message || 'Falha ao liberar pagamento Escrow no backend');
            }
            if (fnData?.error) throw new Error(fnData.error);

            addToast('Avaliação enviada e pedido finalizado!', 'success');
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
                <h2 className="text-xl font-bold text-gray-900 mb-2">Avaliar Trabalho</h2>
                <p className="text-sm text-gray-500 mb-6">Sua avaliação libera o pagamento ao vendedor.</p>

                {/* Star Rating */}
                <div className="flex items-center justify-center space-x-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            className="focus:outline-none transition-transform hover:scale-110"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        >
                            <svg
                                className={`w-10 h-10 ${star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </button>
                    ))}
                </div>

                {/* Comment */}
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary min-h-[100px] mb-6"
                    placeholder="Escreva um comentário sobre o serviço (opcional)..."
                />

                <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
                    <Button onClick={handleSubmit} isLoading={submitting}>Enviar e Finalizar</Button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
