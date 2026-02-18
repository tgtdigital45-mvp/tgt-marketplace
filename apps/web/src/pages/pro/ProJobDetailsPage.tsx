import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import { ArrowLeft } from 'lucide-react';
import { Job } from '@/components/pro/JobCard';


const ProJobDetailsPage: React.FC = () => {
    const { id, slug } = useParams<{ id: string; slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);

    // Proposal Form
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const fetchJobDetails = React.useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    category:categories(name)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setJob(data as unknown as Job);
        } catch (error) {
            console.error('Error fetching job:', error);
            showToast('Erro ao carregar detalhes do pedido', 'error');
        } finally {
            setLoading(false);
        }
    }, [id, showToast]);

    const fetchCompanyId = React.useCallback(async () => {
        try {
            const { data } = await supabase
                .from('companies')
                .select('id')
                .eq('slug', slug)
                .single();

            if (data) setCompanyId(data.id);
        } catch (err) {
            console.error(err);
        }
    }, [slug]);

    useEffect(() => {
        if (id && slug) {
            fetchJobDetails();
            fetchCompanyId();
        }
    }, [id, slug, fetchJobDetails, fetchCompanyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!job || !companyId || !user) return;
        if (!price || !description) {
            setError('Preencha todos os campos da proposta');
            return;
        }

        try {
            setSubmitting(true);

            // 1. Check if already proposed (optional, logical check)
            const { data: existing } = await supabase
                .from('proposals')
                .select('id')
                .eq('job_id', job.id)
                .eq('company_id', companyId)
                .single();

            if (existing) {
                showToast('Você já enviou uma proposta para este pedido.', 'error');
                return;
            }

            // 2. Insert Proposal
            const { error: insertError } = await supabase.from('proposals').insert({
                job_id: job.id,
                company_id: companyId,
                price: parseFloat(price),
                status: 'pending',
                cover_letter: description,
                // Add estimated_hours or days if schema supports it
            });

            if (insertError) throw insertError;

            // 3. Increment proposal count on job
            await supabase.rpc('increment_proposal_count', { job_id: job.id });

            // 4. Create Notification for the Job Owner (Client)
            await supabase.from('notifications').insert({
                user_id: job.user_id,
                type: 'proposal_received',
                title: 'Nova Proposta Recebida',
                message: `Você recebeu uma nova proposta de R$ ${parseFloat(price).toFixed(2)} para o pedido "${job.title}".`,
                link: `/perfil/pedidos`, // Direct to orders page
                read: false
            });

            showToast('Proposta enviada com sucesso!', 'success');
            navigate(`/dashboard/empresa/${slug}/oportunidades`);

        } catch (error) {
            console.error('Error sending proposal:', error);
            showToast('Erro ao enviar proposta', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando detalhes...</div>;
    if (!job) return <div className="p-8 text-center text-red-500">Pedido não encontrado.</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-primary-600" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Oportunidades
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Job Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                            {job.category && <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium">{job.category.name}</span>}
                        </div>

                        <div className="flex gap-4 text-sm text-gray-500 mb-6">
                            <span>{new Date(job.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{job.city} / {job.state}</span>
                            <span>•</span>
                            <span className={job.urgency === 'high' ? 'text-red-500 font-medium' : ''}>Prioridade: {job.urgency}</span>
                        </div>

                        <div className="prose max-w-none text-gray-700">
                            <h3 className="text-lg font-semibold mb-2">Descrição</h3>
                            <p className="whitespace-pre-line">{job.description}</p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h3 className="text-lg font-semibold mb-2">Orçamento do Cliente</h3>
                            <p className="text-2xl font-bold text-green-700">
                                {job.budget_min && job.budget_max
                                    ? `R$ ${job.budget_min} - ${job.budget_max}`
                                    : job.budget_min ? `A partir de R$ ${job.budget_min}` : 'A Combinar'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Proposal Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xl sticky top-24">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Enviar Proposta</h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Valor da Proposta (R$)"
                                type="number"
                                placeholder="0.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem / Detalhes</label>
                                <textarea
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    rows={5}
                                    placeholder="Descreva como você pode ajudar, prazos e diferenciais."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            {error && <p className="text-sm text-red-600">{error}</p>}

                            <Button
                                type="submit"
                                className="w-full"
                                isLoading={submitting}
                            >
                                Enviar Orçamento
                            </Button>
                            <p className="text-xs text-center text-gray-500 mt-2">
                                Ao enviar, você concorda com nossos termos de serviço.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProJobDetailsPage;
