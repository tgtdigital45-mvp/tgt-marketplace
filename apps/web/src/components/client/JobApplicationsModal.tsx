import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/core';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@tgt/ui-web';
import { X, User, DollarSign, Clock, CheckCircle2, Phone, Mail, AlertCircle, ChevronRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Proposal {
    id: string;
    user_id: string;
    price: number;
    message: string;
    estimated_days: number;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    profile?: {
        full_name: string;
        avatar_url: string;
        phone: string;
        email: string;
        rating: number;
    };
}

interface Props {
    jobId: string;
    onClose: () => void;
    onUpdated: () => void;
}

const JobApplicationsModal: React.FC<Props> = ({ jobId, onClose, onUpdated }) => {
    const { addToast: showToast } = useToast();
    const navigate = useNavigate();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchProposals = async () => {
            try {
                const { data, error } = await supabase
                    .from('proposals')
                    .select(`
                        *,
                        profile:profiles(full_name, avatar_url, phone, email)
                    `)
                    .eq('job_id', jobId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setProposals(data as unknown as Proposal[]);
            } catch (error) {
                console.error('Error fetching proposals:', error);
            } finally {
                setLoading(false);
            }
        };

        if (jobId) fetchProposals();
    }, [jobId]);

    const handleAccept = async (proposalId: string) => {
        try {
            setProcessingId(proposalId);
            
            // Call the RPC we created
            const { data, error } = await supabase.rpc('accept_job_proposal', {
                p_proposal_id: proposalId
            });

            if (error) throw error;

            showToast('Proposta aceita com sucesso!', 'success');
            
            // Optional: Redirect to checkout if there's an order_id
            if (data?.order_id) {
                navigate(`/checkout/${data.order_id}`);
            } else {
                onUpdated();
                onClose();
            }
        } catch (error: any) {
            console.error('Error accepting proposal:', error);
            showToast(error.message || 'Erro ao aceitar proposta', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col scale-in duration-300">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Propostas Candidatadas</h2>
                        <p className="text-slate-500 font-medium">Selecione o melhor profissional para o seu serviço.</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-3xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Analisando candidaturas...</p>
                        </div>
                    ) : proposals.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-500">Nenhum profissional se candidatou ainda.</h3>
                            <p className="text-slate-400">As propostas aparecerão aqui assim que forem enviadas.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {proposals.map((proposal) => {
                                const isAccepted = proposal.status === 'accepted';
                                return (
                                    <div 
                                        key={proposal.id} 
                                        className={`bg-white p-6 rounded-[36px] border-2 transition-all relative overflow-hidden ${isAccepted ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-100'}`}
                                    >
                                        <div className="flex flex-col md:flex-row gap-8 relative z-10">
                                            {/* Left: Professional Info */}
                                            <div className="w-full md:w-64 space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex-shrink-0 overflow-hidden">
                                                        {proposal.profile?.avatar_url ? (
                                                            <img src={proposal.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <User className="w-6 h-6 text-slate-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 leading-tight">{proposal.profile?.full_name || 'Profissional'}</h4>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                                            <span className="text-xs font-bold text-slate-600">4.9 (24)</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 p-4 bg-slate-50 rounded-2xl">
                                                    {isAccepted ? (
                                                        <>
                                                            <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                                                                <Phone className="w-3 h-3 text-brand-primary" />
                                                                {proposal.profile?.phone || 'N/D'}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                                                                <Mail className="w-3 h-3 text-brand-primary" />
                                                                {proposal.profile?.email || 'N/D'}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col gap-1.5 opacity-40 select-none">
                                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 italic">
                                                                <Phone className="w-3 h-3" />
                                                                (Aceite para liberar)
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 italic">
                                                                <Mail className="w-3 h-3" />
                                                                (Aceite para liberar)
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Center: Proposal Text */}
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orçamento</span>
                                                        <span className="text-2xl font-black text-emerald-600">R$ {proposal.price.toLocaleString('pt-BR')}</span>
                                                    </div>
                                                    <div className="w-px h-10 bg-slate-100 hidden md:block" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prazo</span>
                                                        <span className="text-lg font-black text-slate-700">{proposal.estimated_days} dias</span>
                                                    </div>
                                                </div>
                                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                                        "{proposal.message}"
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex md:flex-col justify-end gap-3 pt-4 md:pt-0">
                                                {isAccepted ? (
                                                    <div className="flex items-center gap-2 py-3 px-6 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        Proposta Aceita
                                                    </div>
                                                ) : (
                                                    <Button 
                                                        onClick={() => handleAccept(proposal.id)}
                                                        isLoading={processingId === proposal.id}
                                                        disabled={processingId !== null && processingId !== proposal.id}
                                                        className="bg-brand-primary text-white rounded-2xl px-10 py-5 font-black uppercase text-xs tracking-widest shadow-xl shadow-brand-primary/20 hover:scale-[1.03] transition-all"
                                                    >
                                                        Contratar e Pagar
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Tip */}
                <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        Utilize o pagamento TGT para garantir a segurança da transação.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default JobApplicationsModal;
