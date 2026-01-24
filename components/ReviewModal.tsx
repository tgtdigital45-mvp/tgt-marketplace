import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string;
    companyName: string;
    onSubmitMock?: (review: { rating: number; comment: string }) => void; // Optional now
}

const ReviewModal: React.FC<ReviewModalProps> = ({
    isOpen,
    onClose,
    companyId,
    companyName,
}) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [showSuccess, setShowSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            addToast("Você precisa estar logado para avaliar.", "info");
            navigate('/auth/login');
            return;
        }

        if (user.type !== 'client') {
            addToast("Apenas clientes podem enviar avaliações.", "warning");
            return;
        }

        if (rating === 0) return;

        setLoading(true);
        try {
            const { error } = await supabase.from('reviews').insert({
                company_id: companyId,
                client_id: user.id,
                rating: rating,
                comment: comment
            });

            if (error) throw error;

            setShowSuccess(true);

            // Close modal after showing success message
            setTimeout(() => {
                setShowSuccess(false);
                onClose();
                setRating(0);
                setComment('');
            }, 1500);

        } catch (err) {
            console.error("Error submitting review:", err);
            addToast("Erro ao enviar avaliação.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
                    >
                        {showSuccess ? (
                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
                                >
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </motion.div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Avaliação Enviada!</h3>
                                <p className="text-gray-500">Obrigado por compartilhar sua experiência.</p>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="bg-white p-6 pb-0 text-center">
                                    <h2 className="text-xl font-bold text-gray-900">Avaliar Experiência</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Como foi seu serviço com <span className="font-semibold text-brand-primary">{companyName}</span>?
                                    </p>
                                </div>

                                {/* Body */}
                                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                    {/* Star Rating */}
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setRating(star)}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <svg
                                                    className={`w-10 h-10 ${star <= (hoverRating || rating)
                                                        ? 'text-yellow-400 fill-current'
                                                        : 'text-gray-300'
                                                        }`}
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={star <= (hoverRating || rating) ? 0 : 2}
                                                    fill="none"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                                    />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="text-center text-sm font-medium text-gray-600 h-5">
                                        {hoverRating === 1 && 'Muito Ruim'}
                                        {hoverRating === 2 && 'Ruim'}
                                        {hoverRating === 3 && 'Razoável'}
                                        {hoverRating === 4 && 'Muito Bom'}
                                        {hoverRating === 5 && 'Excelente!'}
                                        {!hoverRating && rating > 0 && (
                                            rating === 1 ? 'Muito Ruim' : rating === 2 ? 'Ruim' : rating === 3 ? 'Razoável' : rating === 4 ? 'Muito Bom' : 'Excelente!'
                                        )}
                                    </div>

                                    {/* Comment */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Deixe um comentário (opcional)
                                        </label>
                                        <textarea
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all resize-none"
                                            rows={4}
                                            placeholder="Conte-nos detalhes sobre o atendimento, qualidade do serviço, etc..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="flex-1"
                                            onClick={onClose}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            className="flex-1"
                                            disabled={rating === 0}
                                            isLoading={loading}
                                        >
                                            Enviar Avaliação
                                        </Button>
                                    </div>
                                </form>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReviewModal;
