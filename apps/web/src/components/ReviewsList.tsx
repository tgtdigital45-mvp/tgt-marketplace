import React from 'react';
import { Review } from '@tgt/shared';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface ReviewsListProps {
    reviews: Review[];
    overallRating: number;
    reviewCount: number;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ reviews, overallRating, reviewCount }) => {
    return (
        <section id="avaliacoes" className="bg-white rounded-[var(--radius-box)] border border-gray-100 shadow-sm p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Avaliações de Clientes</h2>
                    <p className="text-gray-500 text-sm">O que as pessoas estão dizendo sobre este profissional</p>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-lg">
                    <div className="flex flex-col items-center">
                        <span className="text-3xl font-bold text-gray-900 leading-none">{overallRating.toFixed(1)}</span>
                        <div className="flex text-yellow-400 text-xs mt-1">
                            {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-3.5 h-3.5 ${i < Math.round(overallRating) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                    </div>
                    <div className="h-8 w-px bg-gray-200"></div>
                    <span className="text-sm font-medium text-gray-600">{reviewCount} reviews</span>
                </div>
            </div>

            {reviews.length > 0 ? (
                <div className="space-y-8">
                    {reviews.map((review) => (
                        <div key={review.id} className="flex gap-4">
                            <OptimizedImage
                                src={review.avatar || ''}
                                alt={review.author}
                                className="w-12 h-12 rounded-full object-cover border border-gray-100 flex-shrink-0"
                                fallbackSrc={`https://ui-avatars.com/api/?name=${review.author}&background=random`}
                            />
                            <div className="flex-1 space-y-2 border-b border-gray-50 pb-8 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">{review.author}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex text-yellow-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-400">|</span>
                                            <span className="text-xs text-gray-500">{review.date}</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-gray-700 text-sm leading-relaxed">
                                    {review.comment}
                                </p>

                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                        </svg>
                                        Útil
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 className="text-gray-900 font-medium mb-1">Ainda não há avaliações</h3>
                    <p className="text-gray-500 text-sm">Este serviço ainda não recebeu reviews. Seja o primeiro!</p>
                </div>
            )}
        </section>
    );
};

export default ReviewsList;
