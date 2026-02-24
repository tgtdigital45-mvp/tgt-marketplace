import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, MessageSquare, Clock, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const ClientBudgets: React.FC = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchBudgets();
        }
    }, [user]);

    const fetchBudgets = async () => {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select(`
          *,
          proposals(
            *,
            professional:profiles!proposals_user_id_fkey(full_name, avatar_url)
          )
        `)
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setJobs(data || []);
        } catch (err) {
            console.error('Error fetching budgets:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderSkeletons = () => (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 animate-pulse">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                            <div className="h-6 w-48 bg-slate-100 rounded-md"></div>
                            <div className="flex gap-2">
                                <div className="h-4 w-20 bg-slate-50 rounded-md"></div>
                                <div className="h-4 w-24 bg-slate-50 rounded-md"></div>
                            </div>
                        </div>
                        <div className="h-4 w-16 bg-slate-50 rounded-md"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-slate-50 rounded-md"></div>
                        <div className="h-4 w-2/3 bg-slate-50 rounded-md"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Meus Pedidos de Orçamento</h2>
                    <p className="text-sm text-slate-500 font-medium">Gerencie suas solicitações e propostas recebidas.</p>
                </div>
                <Button variant="primary" size="sm">Novo Orçamento</Button>
            </div>

            {loading ? renderSkeletons() : jobs.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200">
                    <FileText size={48} className="text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">Nenhum orçamento solicitado</h3>
                    <p className="text-slate-500 mb-6 font-medium">Quando você precisar de um serviço sob medida, peça um orçamento aqui.</p>
                    <Button variant="outline">Solicitar Primeiro Orçamento</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {jobs.map((job) => (
                        <div key={job.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-brand-primary/30 transition-colors">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                <Clock size={12} /> {new Date(job.created_at).toLocaleDateString()}
                                            </span>
                                            <Badge variant={job.status === 'open' ? 'warning' : 'success'}>
                                                {job.status === 'open' ? 'Aguardando Propostas' : job.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-brand-primary">{job.proposals?.length || 0} propostas</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">{job.description}</p>

                                {job.proposals && job.proposals.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Propostas Recebidas</h4>
                                        {job.proposals.map((prop: any) => (
                                            <div key={prop.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-brand-primary font-bold shadow-sm overflow-hidden">
                                                        {prop.professional?.avatar_url ? (
                                                            <img src={prop.professional.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            prop.professional?.full_name?.charAt(0) || 'P'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{prop.professional?.full_name || 'Profissional'}</p>
                                                        <p className="text-xs font-black text-brand-primary">
                                                            {prop.price ? `R$ ${prop.price}` : 'Sob consulta'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button className="p-2 text-slate-400 hover:text-brand-primary transition-colors">
                                                        <MessageSquare size={18} />
                                                    </button>
                                                    <Button size="sm" variant="primary" className="h-8 py-0 px-3 text-xs">Ver Proposta</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientBudgets;
