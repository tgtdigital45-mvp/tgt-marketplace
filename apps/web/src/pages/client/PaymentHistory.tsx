import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@tgt/shared';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
    CreditCard,
    Receipt,
    CheckCircle,
    XCircle,
    Clock,
    Filter,
    Download,
    Plus,
    TrendingDown,
    Wallet,
    Calendar
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface PaymentHistoryProps {
    isEmbedded?: boolean;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ isEmbedded = false }) => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*, seller:profiles!orders_seller_id_fkey(companies(company_name, logo_url))')
                    .eq('buyer_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOrders(data || []);
            } catch (error) {
                console.error("Error fetching payment history", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [user]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const filteredOrders = orders.filter(o => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'paid') return o.payment_status === 'paid';
        if (activeFilter === 'pending') return o.payment_status === 'pending' || !o.payment_status;
        if (activeFilter === 'failed') return o.payment_status === 'failed';
        return true;
    });

    const totalInvestedMonth = orders
        .filter(o => o.payment_status === 'paid' && new Date(o.created_at).getMonth() === new Date().getMonth())
        .reduce((acc, curr) => acc + (curr.price || 0), 0);

    const pendingInvoices = orders
        .filter(o => o.payment_status === 'pending' || !o.payment_status)
        .reduce((acc, curr) => acc + (curr.price || 0), 0);

    if (loading) return <div className="h-64 flex items-center justify-center"><LoadingSpinner /></div>;

    return (
        <div className={`space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 ${!isEmbedded ? 'container px-4 py-12 max-w-5xl mx-auto' : ''}`}>

            {/* FINANCIAL SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-primary/5 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-6">
                        <TrendingDown size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Investimento Mensal</p>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(totalInvestedMonth)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-green-500">
                        <span className="px-2 py-0.5 bg-green-50 rounded-full">+12% vs mês anterior</span>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/5 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 mb-6">
                        <Clock size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Faturas Pendentes</p>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(pendingInvoices)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-orange-400">
                        <span className="px-2 py-0.5 bg-orange-50 rounded-full">{orders.filter(o => o.payment_status === 'pending').length} faturas aguardando</span>
                    </div>
                </div>

                <div className="bg-brand-primary rounded-[2rem] p-8 shadow-xl shadow-brand-primary/20 relative overflow-hidden group text-white">
                    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-6">
                        <Wallet size={24} />
                    </div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Saldo em Carteira</p>
                    <h3 className="text-3xl font-black tracking-tight">R$ 45,90</h3>
                    <p className="mt-4 text-[10px] font-bold text-white/80">Créditos de estorno ou bônus</p>
                </div>
            </div>

            {/* TRANSACTION LIST */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight mb-1">Histórico de Transações</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acompanhe todos os seus pagamentos</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {(['all', 'paid', 'pending', 'failed'] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === filter
                                    ? 'bg-slate-800 text-white shadow-lg shadow-slate-200'
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                    }`}
                            >
                                {filter === 'all' ? 'Tudo' :
                                    filter === 'paid' ? 'Pagos' :
                                        filter === 'pending' ? 'Pendentes' : 'Falhas'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5">Serviço / Prestador</th>
                                <th className="px-8 py-5">Data</th>
                                <th className="px-8 py-5">Valor</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Recibo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma transação encontrada nesta categoria</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id} className="group hover:bg-slate-50/30 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 group-hover:scale-110 transition-transform shadow-inner">
                                                    {(order.seller?.companies as any)?.[0]?.logo_url ? (
                                                        <img src={(order.seller?.companies as any)[0].logo_url} alt={(order.seller?.companies as any)[0].company_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Wallet className="w-6 h-6 text-slate-300" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm leading-tight group-hover:text-brand-primary transition-colors">{order.service_title}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{(order.seller?.companies as any)?.[0]?.company_name || 'Profissional'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                                <Calendar className="w-4 h-4 opacity-40" />
                                                {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-black text-slate-800">{formatCurrency(order.price || 0)}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge variant={
                                                order.payment_status === 'paid' ? 'success' :
                                                    order.payment_status === 'failed' ? 'danger' : 'warning'
                                            }>
                                                {order.payment_status === 'paid' ? 'Liquidado' :
                                                    order.payment_status === 'failed' ? 'Falhou' : 'Aguardando'}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-3 text-slate-300 hover:text-brand-primary rounded-xl hover:bg-brand-primary/5 transition-all">
                                                <Download size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CARD MANAGEMENT MOCKUP */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 text-white relative overflow-hidden group">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-brand-primary/20 to-transparent pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="max-w-md">
                        <h2 className="text-3xl font-black tracking-tight mb-4 italic">Seus Cartões Salvos</h2>
                        <p className="text-slate-400 font-bold text-sm leading-relaxed mb-8 uppercase tracking-widest">Gerencie suas formas de pagamento para um checkout mais rápido e seguro.</p>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                                <div className="w-12 h-8 bg-slate-800 rounded-md border border-white/10 flex items-center justify-center font-black text-[10px] italic">VISA</div>
                                <div className="flex-grow">
                                    <p className="text-sm font-bold">•••• •••• •••• 4422</p>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Expira em 08/28</p>
                                </div>
                                <Badge variant="info" className="text-[8px] bg-white/10 border-white/20">Principal</Badge>
                            </div>
                        </div>

                        <Button variant="secondary" className="w-full sm:w-auto bg-white text-slate-900 border-none hover:bg-slate-100 rounded-xl px-10 h-12 text-xs font-black uppercase tracking-widest shadow-xl shadow-white/5">
                            <Plus size={16} className="mr-2" /> Novo Cartão
                        </Button>
                    </div>

                    {/* Visual Card Mockup */}
                    <div className="w-full max-w-[340px] aspect-[1.6/1] bg-gradient-to-br from-brand-primary via-blue-600 to-indigo-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden ring-1 ring-white/20 hover:scale-105 transition-transform duration-500">
                        <div className="absolute right-0 bottom-0 p-8 opacity-20">
                            <div className="w-32 h-32 border-[12px] border-white rounded-full"></div>
                        </div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                                    <CreditCard className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-black italic text-white/40 tracking-widest uppercase text-sm">Contratto Pay</span>
                            </div>
                            <div>
                                <p className="text-xl font-mono text-white tracking-[0.2em] mb-4">•••• •••• •••• 4422</p>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[8px] text-white/40 uppercase tracking-widest mb-1">Titular</p>
                                        <p className="text-xs font-black uppercase tracking-widest">{user?.email?.split('@')[0] || 'VOCE'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] text-white/40 uppercase tracking-widest mb-1">Validade</p>
                                        <p className="text-xs font-black leading-none">08 / 28</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentHistory;
