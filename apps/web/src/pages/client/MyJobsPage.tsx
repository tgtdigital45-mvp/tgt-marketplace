import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/core';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { PageTransition, Button } from '@tgt/ui-web';
import { Briefcase, MessageSquare, Clock, CheckCircle2, ChevronRight, LayoutList, AlertCircle, Phone, Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JobApplicationsModal from '@/components/client/JobApplicationsModal';

interface JobWithProposals {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'completed' | 'canceled';
    created_at: string;
    proposals_count: number;
    category?: { name: string };
}

const MyJobsPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addToast: showToast } = useToast();
    const [jobs, setJobs] = useState<JobWithProposals[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<string | null>(null);

    const fetchMyJobs = async () => {
        try {
            if (!user) return;

            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    category:categories(name),
                    proposals_count:proposals(count)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // Map the results to handle the count structure
            const formattedJobs = data.map((j: any) => ({
                ...j,
                proposals_count: j.proposals_count?.[0]?.count || 0
            }));

            setJobs(formattedJobs);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            showToast('Erro ao carregar seus pedidos', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyJobs();
    }, [user, showToast]);

    const statusMap = {
        open: { label: 'Aberto', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        in_progress: { label: 'Em Andamento', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
        completed: { label: 'Concluído', color: 'bg-slate-50 text-slate-600 border-slate-100' },
        canceled: { label: 'Cancelado', color: 'bg-red-50 text-red-600 border-red-100' },
    };

    return (
        <PageTransition>
            <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Meus Pedidos de Serviço</h1>
                        <p className="text-slate-500 font-medium">Acompanhe as propostas e o andamento das suas solicitações.</p>
                    </div>
                    <Button 
                        onClick={() => navigate('/vagas/postar')}
                        className="bg-brand-primary text-white shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all"
                    >
                        Publicar Nova Vaga
                    </Button>
                </header>

                {loading ? (
                    <div className="py-20 text-center">
                        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando seus pedidos...</p>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-100 p-16 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="w-10 h-10 text-slate-300" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Nenhum pedido encontrado</h2>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">Você ainda não publicou nenhuma vaga no marketplace. Comece agora mesmo!</p>
                        <Button onClick={() => navigate('/vagas/postar')} variant="outline" className="rounded-2xl">
                            Publicar meu primeiro serviço
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {jobs.map((job) => (
                            <div 
                                key={job.id} 
                                className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-primary/20 transition-all group overflow-hidden relative"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusMap[job.status].color}`}>
                                                {statusMap[job.status].label}
                                            </span>
                                            {job.category && (
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                    {job.category.name}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-brand-primary transition-colors">
                                            {job.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-brand-primary" />
                                                <span>Publicado em {new Date(job.created_at).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 p-2 bg-indigo-50 text-brand-primary rounded-xl">
                                                <LayoutList className="w-4 h-4" />
                                                <span>{job.proposals_count} {job.proposals_count === 1 ? 'proposta recebida' : 'propostas recebidas'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {job.status === 'open' && (
                                            <Button 
                                                onClick={() => setSelectedJob(job.id)}
                                                className="bg-slate-900 text-white rounded-2xl px-6 py-4 flex items-center gap-2 hover:bg-black transition-all"
                                            >
                                                Ver Propostas
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {job.status === 'in_progress' && (
                                            <Button 
                                                onClick={() => navigate(`/checkout/sucesso?jobId=${job.id}`)}
                                                className="bg-indigo-600 text-white rounded-2xl px-6 py-4 flex items-center gap-2"
                                            >
                                                Pagar Pedido
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Background Decorative Element */}
                                <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <Briefcase className="w-48 h-48 rotate-12" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedJob && (
                <JobApplicationsModal 
                    jobId={selectedJob} 
                    onClose={() => setSelectedJob(null)}
                    onUpdated={fetchMyJobs}
                />
            )}
        </PageTransition>
    );
};

export default MyJobsPage;
