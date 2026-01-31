import React, { useState } from 'react';
import Button from './ui/Button';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => Promise<void>;
    isLoading?: boolean;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit, isLoading = false }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please enter a review and a rating between 1 and 5');
            return;
        }
        setError(null);
        await onSubmit(rating, comment);
        setRating(0);
        setComment('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-fadeIn">
                <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Avaliar Serviço</h3>
                    <p className="text-gray-500 text-center text-sm mb-6">Como foi sua experiência com este prestador?</p>

                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className="transition-transform hover:scale-110 focus:outline-none"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <svg
                                    className={`w-10 h-10 ${star <= (hoverRating || rating) ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Comentário (opcional)
                            </label>
                            {error && <p className="text-red-500 text-xs mb-2 transition-all">{error}</p>}
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none transition-all placeholder-gray-400 text-sm"
                                placeholder="Conte mais sobre o serviço..."
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button" // changed to button for safer debugging, wait submit logic is handled by form onSubmit
                                // wait, Button component type default is button. I should verify Button props.
                                // Let's set onClick to handleSubmit manually or type="submit"
                                // I'll use type="submit" and let form handle it.
                                variant="primary"
                                disabled={rating === 0 || isLoading}
                                onClick={(e) => handleSubmit(e)}
                            >
                                {isLoading ? 'Enviando...' : 'Enviar Avaliação'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
