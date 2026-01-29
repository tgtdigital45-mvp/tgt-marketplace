import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Review } from '../../types';
import Button from '../../components/ui/Button';
import { useToast } from '../../contexts/ToastContext';

interface ReviewWithReply extends Review {
    reply?: string;
    clientId?: string;
}

const DashboardAvaliacoesPage: React.FC = () => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<ReviewWithReply[]>([]);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchReviews = async () => {
            setLoading(true);
            try {
                // 1. Get Company ID
                const { data: companyData } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('profile_id', user.id)
                    .single();

                if (!companyData) return;

                // 2. Fetch Reviews
                const { data, error } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('company_id', companyData.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Transform to UI format (mocking author name/avatar for now)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const formattedReviews: ReviewWithReply[] = data.map((r: any) => ({
                    id: r.id,
                    author: r.client_name || 'Cliente', // Ideally fetch from profiles
                    avatar: `https://ui-avatars.com/api/?name=${r.client_id}&background=random`,
                    rating: r.rating,
                    comment: r.comment,
                    date: new Date(r.created_at).toLocaleDateString(),
                    reply: r.reply,
                    clientId: r.client_id
                }));

                setReviews(formattedReviews);
            } catch (err) {
                console.error("Error fetching reviews:", err);
                addToast("Erro ao carregar avaliações", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [user, addToast]);

    const startReply = (reviewId: string) => {
        setReplyingTo(reviewId);
        const review = reviews.find(r => r.id === reviewId);
        setReplyText(review?.reply || '');
    };

    const cancelReply = () => {
        setReplyingTo(null);
        setReplyText('');
    };

    const submitReply = async (reviewId: string) => {
        try {
            const { error } = await supabase
                .from('reviews')
                .update({ reply: replyText })
                .eq('id', reviewId);

            if (error) throw error;

            setReviews(prevReviews =>
                prevReviews.map(review =>
                    review.id === reviewId ? { ...review, reply: replyText } : review
                )
            );
            addToast('Resposta enviada com sucesso!', 'success');
            cancelReply();
        } catch (err) {
            console.error(err);
            addToast("Erro ao enviar resposta", "error");
        }
    };


    return (
        <div className="space-y-6 p-6">
            <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Avaliações de Clientes</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Veja o que os clientes estão dizendo e responda ao feedback.
                </p>
            </div>
            <div className="space-y-8">
                {loading && <p className="text-center text-gray-500">Carregando...</p>}
                {!loading && reviews.length === 0 && <p className="text-center text-gray-500">Nenhuma avaliação recebida ainda.</p>}

                {reviews.map(review => (
                    <div key={review.id} className="p-4 border rounded-md bg-gray-50">
                        <div className="flex space-x-4">
                            <img className="h-12 w-12 rounded-full" src={review.avatar} alt={review.author} />
                            <div>
                                <div className="flex items-center">
                                    <h4 className="text-sm font-bold text-gray-900">{review.author}</h4>
                                    <div className="ml-4 flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        ))}
                                    </div>
                                </div>
                                <p className="mt-1 text-gray-600">{review.comment}</p>
                                <p className="mt-1 text-xs text-gray-400">{review.date}</p>
                            </div>
                        </div>

                        {review.reply && replyingTo !== review.id && (
                            <div className="mt-4 ml-16 p-3 bg-primary-50 border-l-4 border-primary-400 rounded-r-md">
                                <p className="text-sm font-semibold text-primary-800">Sua Resposta</p>
                                <p className="mt-1 text-sm text-gray-700">{review.reply}</p>
                                <button onClick={() => startReply(review.id)} className="text-xs text-primary-600 hover:underline mt-2">Editar resposta</button>
                            </div>
                        )}

                        {replyingTo === review.id ? (
                            <div className="mt-4 ml-16">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    rows={3}
                                    className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Digite sua resposta..."
                                />
                                <div className="mt-2 flex justify-end space-x-2">
                                    <Button type="button" variant="secondary" onClick={cancelReply}>Cancelar</Button>
                                    <Button type="button" onClick={() => submitReply(review.id)}>Enviar Resposta</Button>
                                </div>
                            </div>
                        ) : !review.reply && (
                            <div className="mt-2 ml-16">
                                <Button type="button" variant="secondary" size="sm" onClick={() => startReply(review.id)}>Responder</Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardAvaliacoesPage;
