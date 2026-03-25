import React from 'react';
import { CreditCard, History, Plus, ExternalLink, ShieldCheck, Calendar, ArrowUpRight } from 'lucide-react';

import { useClientProfileData } from '@/hooks/useClientProfileData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@tgt/ui-web';


const ClientPayments: React.FC = () => {
    const { user } = useAuth();
    const { data, isLoading } = useClientProfileData(user?.id);

    const orders = data?.orders || [];
    const totalSpent = data?.totalSpent || 0;

    if (isLoading) return <div className="p-20 text-center">Carregando histórico...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Balance & Overview */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-emerald-100 transition-all"></div>
                        
                        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Total Investido na Plataforma</span>
                                <h3 className="text-5xl font-black text-slate-900 tracking-tight flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-slate-400">R$</span>
                                    {totalSpent.toLocaleString('pt-BR')}
                                </h3>
                                <div className="flex items-center gap-2 mt-4 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-full w-fit">
                                    <ShieldCheck size={14} /> Pagamentos via Contratto Safe
                                </div>
                            </div>
                            <Button className="rounded-2xl h-14 px-8 font-black text-xs uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200">
                                Gerenciar Cartões
                            </Button>
                        </div>
                    </section>

                    <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center">
                                    <History size={24} />
                                </div>
                                <h4 className="text-xl font-black text-slate-800">Histórico de Transações</h4>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {orders.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 font-medium bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                    Nenhuma transação encontrada.
                                </div>
                            ) : (
                                orders.map((order: any) => {
                                    // Determine payment status visually
                                    const isPaid = order.payment_status === 'paid' || order.saga_status === 'PAYMENT_CONFIRMED' || order.status === 'completed';
                                    const statusText = isPaid ? 'Pago' : (order.status === 'cancelled' ? 'Cancelado' : 'Pendente');
                                    const statusClass = isPaid
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : (order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600');
                                    
                                    return (
                                        <div key={order.id} className="flex items-center justify-between p-6 rounded-3xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex-shrink-0 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                                                        <Calendar size={20} />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-black text-slate-800 line-clamp-1">{order.service_title || order.service?.title || 'Serviço Contratado'}</h5>
                                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                            {new Date(order.created_at).toLocaleDateString('pt-BR')} • {order.payment_status === 'paid' ? 'Cartão / Pix' : 'Aguardando'}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center justify-between sm:justify-end gap-6 sm:ml-auto w-full sm:w-auto mt-4 sm:mt-0">
                                                    <div className="text-left sm:text-right">
                                                        <div className="text-lg font-black text-slate-900">R$ {Number(order.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${statusClass}`}>
                                                            {statusText}
                                                        </span>
                                                    </div>
                                                    
                                                    {isPaid && order.receipt_url && (
                                                        <a 
                                                            href={order.receipt_url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-brand-primary hover:text-white transition-colors"
                                                            title="Ver Recibo"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                            <CreditCard size={18} className="text-brand-primary" />
                            Meus Cartões
                        </h4>
                        <div className="space-y-4">
                            <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-4">Cartão Padrão</div>
                                    <div className="text-xl font-black mb-1">•••• •••• •••• 4242</div>
                                    <div className="flex justify-between items-end mt-6">
                                        <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">Valid 12/26</span>
                                        <div className="w-10 h-6 bg-white/20 rounded-md"></div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                            </div>
                            <Button variant="outline" className="w-full border-slate-100 hover:bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest h-14 gap-2">
                                <Plus size={16} /> Adicionar Cartão
                            </Button>
                        </div>
                    </div>

                    <div className="bg-brand-primary/10 rounded-[2.5rem] p-8 border border-brand-primary/20">
                        <h4 className="font-black text-brand-primary mb-2">Precisa de Ajuda?</h4>
                        <p className="text-xs text-brand-primary/70 font-bold leading-relaxed mb-6">Problemas com algum pagamento ou cobrança indevida? Nossa equipe resolve para você.</p>
                        <button className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all text-xs font-black uppercase tracking-widest text-brand-primary">
                            Contatar Suporte <ArrowUpRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientPayments;
