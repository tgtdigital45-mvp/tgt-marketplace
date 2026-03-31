import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/core';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, MessageSquare, Clock, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { Badge, Button } from '@tgt/ui-web';
import { formatOrderStatus, ORDER_STATUS_COLOR } from '@/utils/statusMapper';




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
            professional:profiles!proposals_user_id_profiles_fkey(full_name, avatar_url)
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
                <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-8 animate-pulse">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                            <div className="h-6 w-48 bg-slate-100 rounded-lg"></div>
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
            <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Meus Pedidos de Orçamento</h2>
                    <p className="text-sm text-slate-500 font-medium">Gerencie suas solicitações e propostas recebidas.</p>
                </div>
                <Button variant="primary" className="rounded-xl px-6 font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20">Novo Orçamento</Button>
            </div>

            {loading ? renderSkeletons() : jobs.length === 0 ? (
                <div className="bg-slate-50 rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-200">
                    <FileText size={48} className="text-slate-200 mx-auto mb-6" />
                    <h3 className="text-xl font-black text-slate-400 mb-2">Nenhum orçamento solicitado</h3>
                    <p className="text-sm text-slate-400 font-medium mb-8">Quando você precisar de um serviço sob medida, peça um orçamento aqui.</p>
                    <Button variant="outline" className="rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest">Solicitar Primeiro Orçamento</Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {jobs.map((job) => (
                        <div key={job.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:border-brand-primary/30 hover:shadow-lg transition-all">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                <Clock size={12} /> {new Date(job.created_at).toLocaleDateString()}
                                            </span>
                                            <Badge variant={ORDER_STATUS_COLOR[job.status] || (job.status === 'open' ? 'warning' : 'success')}>
                                                {formatOrderStatus(job.status)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-brand-primary">{job.proposals?.length || 0} propostas</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">{job.description}</p>

                                {job.proposals && job.proposals.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-slate-50 space-y-4">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Propostas Recebidas</h4>
                                        {job.proposals.map((prop: any) => (
                                            <div key={prop.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group border border-transparent hover:border-slate-200">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-primary font-black shadow-sm overflow-hidden shrink-0">
                                                        {prop.professional?.avatar_url ? (
                                                            <img src={prop.professional.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            prop.professional?.full_name?.charAt(0) || 'P'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800">{prop.professional?.full_name || 'Profissional'}</p>
                                                        <p className="text-xs font-black text-brand-primary mt-0.5">
                                                            {prop.price ? `R$ ${prop.price}` : 'Sob consulta'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button className="p-3 bg-white text-slate-400 hover:text-brand-primary rounded-xl transition-colors shadow-sm">
                                                        <MessageSquare size={16} />
                                                    </button>
                                                    <Button size="sm" variant="primary" className="rounded-xl px-5 font-black text-[10px] uppercase tracking-widest shadow-md shadow-brand-primary/20">Ver Proposta</Button>
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
