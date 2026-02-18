
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@tgt/shared';
import { useToast } from '@/contexts/ToastContext';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

interface InquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    companyId: string;
    companyName: string;
    companyCategory: string; // We'll use this to find the category_id
    companyOwnerId: string; // The user_id of the company owner to send the proposal/message to
}

const InquiryModal: React.FC<InquiryModalProps> = ({
    isOpen,
    onClose,
    companyId,
    companyName,
    companyCategory,
    companyOwnerId
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [categoryId, setCategoryId] = useState<string | null>(null);

    // Fetch category_id based on the category name
    useEffect(() => {
        const fetchCategoryId = async () => {
            if (!companyCategory) return;
            try {
                // Try to find exact match first
                const { data, error } = await supabase
                    .from('categories')
                    .select('id')
                    .ilike('name', companyCategory)
                    .single();

                if (data) {
                    setCategoryId(data.id);
                } else {
                    // Fallback to "Outros" or first available if not found (or handle error)
                    console.warn(`Category ${companyCategory} not found. Using general.`);
                    const { data: other } = await supabase
                        .from('categories')
                        .select('id')
                        .limit(1)
                        .single();
                    if (other) setCategoryId(other.id);
                }
            } catch (err) {
                console.error("Error fetching category:", err);
            }
        };

        if (isOpen) fetchCategoryId();
    }, [isOpen, companyCategory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!categoryId) {
            addToast("Erro ao identificar categoria. Tente novamente.", "error");
            return;
        }
        if (!message.trim()) {
            addToast("Por favor, escreva uma mensagem.", "warning");
            return;
        }

        setLoading(true);

        try {
            // 1. Create a "Private" Job (Inquiry)
            const { data: job, error: jobError } = await supabase
                .from('jobs')
                .insert({
                    user_id: user.id,
                    title: `Consulta para ${companyName}`,
                    description: `Interesse em serviços de ${companyCategory}. Mensagem inicial: ${message}`,
                    category_id: categoryId,
                    status: 'open', // Or 'draft' or specific status if available
                    // location defaults?
                })
                .select()
                .single();

            if (jobError) throw jobError;

            // 2. Create a Proposal linking the company to this job (Invite)
            // Note: Proposals tables usually link 'user_id' (provider) and 'job_id'.
            // Verify 'user_id' in proposals refers to the PROVIDER (company owner).
            const { error: proposalError } = await supabase
                .from('proposals')
                .insert({
                    job_id: job.id,
                    user_id: companyOwnerId,
                    price: 0, // Initial placeholder
                    status: 'pending',
                    message: 'Consulta iniciada via perfil da empresa.'
                });

            if (proposalError) throw proposalError;

            // 3. Create the first Message
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    job_id: job.id,
                    sender_id: user.id,
                    receiver_id: companyOwnerId,
                    content: message,
                    // created_at is auto
                });

            if (msgError) throw msgError;

            addToast("Consulta iniciada com sucesso!", "success");
            onClose();

            // Redirect to messages
            navigate('/minhas-mensagens', {
                state: {
                    activeJobId: job.id
                }
            });

        } catch (err) {
            console.error("Inquiry error:", err);
            addToast("Erro ao iniciar consulta.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
                        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden z-10"
                    >
                        <div className="bg-brand-primary p-4 text-white flex justify-between items-center">
                            <h3 className="font-bold text-lg">Nova Mensagem</h3>
                            <button onClick={onClose} className="text-white/80 hover:text-white">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                Iniciando conversa com <strong>{companyName}</strong>.
                                Uma solicitação de serviço será criada automaticamente para organizar o atendimento.
                            </p>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sua mensagem
                                    </label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-brand-primary outline-none resize-none"
                                        placeholder="Olá, gostaria de saber mais sobre seus serviços..."
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" isLoading={loading} disabled={!categoryId}>
                                        Enviar Mensagem
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default InquiryModal;
