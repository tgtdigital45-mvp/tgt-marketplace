import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@tgt/core';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ArrowLeft, Clock, MapPin, AlertCircle, DollarSign } from 'lucide-react';
import { Job } from '@/components/pro/JobCard';
import { Input, Button } from '@tgt/ui-web';

const ProJobDetailsPage: React.FC = () => {
    const { id, slug } = useParams<{ id: string; slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToast: showToast } = useToast();

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

            // 1. Check if already proposed
            const { data: existing } = await supabase
                .from('proposals')
                .select('id')
                .eq('job_id', job.id)
                .eq('company_id', companyId)
                .maybeSingle();

            if (existing) {
                showToast('Você já enviou uma proposta para este pedido.', 'error');
                return;
            }

            // 2. Insert Proposal
            const { error: insertError } = await supabase.from('proposals').insert({
                job_id: job.id,
                company_id: companyId,
                user_id: user.id,
                price: parseFloat(price),
                status: 'pending',
                message: description,
            });

            if (insertError) throw insertError;

            // 3. Create Notification for the Job Owner
            await supabase.from('notifications').insert({
                user_id: job.user_id,
                type: 'proposal_received',
                title: 'Nova Proposta Recebida',
                message: `Você recebeu uma nova proposta de R$ ${parseFloat(price).toFixed(2)} para o pedido "${job.title}".`,
                read: false
            });

            showToast('Proposta enviada com sucesso!', 'success');
            navigate(`/dashboard/empresa/${slug}/vagas`);

        } catch (error) {
            console.error('Error sending proposal:', error);
            showToast('Erro ao enviar proposta', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="h-[400px] flex flex-col items-center justify-center text-slate-500">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-medium">Carregando detalhes da vaga...</p>
        </div>
    );
    
    if (!job) return (
        <div className="p-12 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Vaga não encontrada</h2>
            <Button onClick={() => navigate(-1)} variant="ghost">Voltar</Button>
        </div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-500 hover:text-brand-primary transition-colors mb-8 group"
            >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="font-bold text-sm">Voltar para Oportunidades</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Job Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{job.title}</h1>
                                {job.category && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                                        {job.category.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6 text-sm text-slate-500 mb-8 p-4 bg-slate-50 rounded-2xl">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-brand-primary" />
                                <span className="font-medium text-slate-700">{new Date(job.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-brand-primary" />
                                <span className="font-medium text-slate-700">{job.city} / {job.state}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertCircle className={`w-4 h-4 ${job.urgency === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                                <span className="font-medium text-slate-700">Prioridade {job.urgency === 'high' ? 'Alta' : 'Normal'}</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    <div className="w-1.5 h-6 bg-brand-primary rounded-full" />
                                    Descrição da Vaga
                                </h3>
                                <div className="text-slate-600 leading-relaxed whitespace-pre-line text-base">
                                    {job.description}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <div className="p-6 bg-emerald-50 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Orçamento Estimado</p>
                                        <p className="text-2xl font-black text-emerald-700">
                                            {job.budget_min && job.budget_max
                                                ? `R$ ${job.budget_min.toLocaleString('pt-BR')} - ${job.budget_max.toLocaleString('pt-BR')}`
                                                : job.budget_min ? `A partir de R$ ${job.budget_min.toLocaleString('pt-BR')}` : 'A Combinar'}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <DollarSign className="w-6 h-6 text-emerald-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Proposal Form Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-900 mb-1">Enviar Proposta</h3>
                            <p className="text-sm text-slate-500">Destaque-se com o melhor orçamento.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                label="Valor da Proposta (R$)"
                                type="number"
                                placeholder="0,00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="font-bold text-lg"
                                required
                            />

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mensagem de Apresentação</label>
                                <textarea
                                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all text-sm min-h-[120px]"
                                    placeholder="Explique por que você é a melhor escolha para este serviço..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full py-4 text-base font-bold shadow-lg shadow-brand-primary/20"
                                isLoading={submitting}
                            >
                                Enviar Orçamento Agora
                            </Button>
                            
                            <p className="text-[10px] text-center text-slate-400 leading-tight">
                                Seus dados de contato só serão liberados se o cliente aceitar sua proposta.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProJobDetailsPage;
