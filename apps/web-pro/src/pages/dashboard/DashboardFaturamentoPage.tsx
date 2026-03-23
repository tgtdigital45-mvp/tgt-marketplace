import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/core';
import { SellerStats } from '@tgt/core';
import { LoadingSpinner, Button } from '@tgt/ui-web';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';

import { Sparkles, Loader2, TrendingUp, Lightbulb, ChevronRight, Wallet, Clock, DollarSign, Zap, Landmark } from 'lucide-react';
import { gemini } from '@/utils/gemini';
import { useToast } from '@/contexts/ToastContext';
import { motion } from 'framer-motion';

const DashboardFaturamentoPage: React.FC = () => {
    const { user } = useAuth();
    const { company } = useCompany();
    const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const [aiTips, setAiTips] = useState<string[]>([]);
    const [loadingTips, setLoadingTips] = useState(false);
    const [connectingStripe, setConnectingStripe] = useState(false);

    // Stripe data state
    const [stripeBalance, setStripeBalance] = useState<{
        available: { amount: number; currency: string }[];
        pending: { amount: number; currency: string }[];
    } | null>(null);
    const [stripeTransactions, setStripeTransactions] = useState<any[]>([]);
    const [payoutsEnabled, setPayoutsEnabled] = useState(false);
    const [monthlyMetrics, setMonthlyMetrics] = useState({ total: 0, count: 0 });

    const handleConnectStripe = async () => {
        if (!company?.id) return;
        try {
            setConnectingStripe(true);
            const { data, error } = await supabase.functions.invoke('create-stripe-onboarding', {
                body: {
                    company_id: company.id,
                    return_url: window.location.href,
                    refresh_url: window.location.href,
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('Não foi possível gerar o link de onboarding.');
            }
        } catch (err: any) {
            console.error('Stripe Connect error:', err);
            addToast(err.message || 'Erro ao conectar com Stripe', 'error');
        } finally {
            setConnectingStripe(false);
        }
    };

    const handleGetAITips = async () => {
        if (!stripeBalance) return;
        try {
            setLoadingTips(true);
            const tips = await gemini.generateBillingTips(
                (stripeBalance.available[0]?.amount || 0) / 100, 
                (stripeBalance.pending[0]?.amount || 0) / 100, 
                stripeTransactions
            );
            setAiTips(tips);
            addToast('Insights gerados com sucesso!', 'success');
        } catch (err) {
            console.error(err);
            addToast('Erro ao gerar insights financeiros.', 'error');
        } finally {
            setLoadingTips(false);
        }
    };

    useEffect(() => {
        const fetchFinanceData = async () => {
            if (!user || !company) return;
            try {
                // 1. Get Seller Stats (Level)
                const { data: statsData, error: statsError } = await supabase
                    .from('seller_stats')
                    .select('*')
                    .eq('seller_id', user.id)
                    .single();

                if (!statsError) {
                    setSellerStats(statsData);
                }

                // 2. Fetch Stripe Data if connected
                if (company.stripe_account_id) {
                    const { data, error: invokeError } = await supabase.functions.invoke('get-stripe-balance', {
                        body: { stripe_account_id: company.stripe_account_id }
                    });

                    if (invokeError) throw invokeError;

                    if (data) {
                        setStripeBalance(data.balance);
                        setStripeTransactions(data.transactions || []);
                        setPayoutsEnabled(data.payouts_enabled);
                    }
                }

                // 3. Fetch Monthly metrics from orders
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

                const { data: dbOrders } = await supabase
                    .from('orders')
                    .select('price')
                    .eq('seller_id', user.id)
                    .eq('status', 'completed')
                    .gte('created_at', startOfMonth);

                const monthlyTotal = (dbOrders || []).reduce((sum, o) => sum + (Number(o.price) || 0), 0);
                setMonthlyMetrics({ total: monthlyTotal, count: dbOrders?.length || 0 });

            } catch (error) {
                console.error("Error loading financial data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFinanceData();
    }, [user, company]);

    const formatCurrency = (amount: number, currency: string) => {
        return (amount / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: currency.toUpperCase(),
        });
    };

    const availableAmount = stripeBalance?.available[0]?.amount || 0;
    const pendingAmount = stripeBalance?.pending[0]?.amount || 0;
    const currency = stripeBalance?.available[0]?.currency || 'brl';

    const grossAmount = monthlyMetrics.total;
    const effectiveCommissionRate = company?.commission_rate ?? 0.20;
    const platformFee = grossAmount * effectiveCommissionRate;
    const netAmount = grossAmount - platformFee;

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="space-y-4 text-center">
                <LoadingSpinner />
                <p className="text-gray-500 animate-pulse">Carregando dados financeiros...</p>
            </div>
        </div>
    );

    // Helper for Level Badge
    const getLevelBadgeColor = (level?: string) => {
        switch (level) {
            case 'Pro': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Level 2': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Level 1': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
            {/* ─── Page Header ─────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
            >
                <div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                        <span>Dashboard</span><ChevronRight size={12} />
                        <span className="text-gray-600 font-medium">Faturamento</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Faturamento & Carteira</h1>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                        Gerencie seus ganhos, transacoes e saques
                    </p>
                </div>

                {sellerStats && (
                    <div className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 shadow-sm ${getLevelBadgeColor(sellerStats.level)}`}>
                        <Zap size={14} />
                        <span className="text-xs font-bold">{sellerStats.level}</span>
                    </div>
                )}
            </motion.div>

            {/* Stripe Connect Onboarding Card */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm ${company?.stripe_charges_enabled
                    ? 'bg-emerald-50 border-emerald-100'
                    : 'bg-amber-50 border-amber-100'
                    }`}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${company?.stripe_charges_enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">
                            {company?.stripe_charges_enabled ? 'Pagamentos Online Ativados' : 'Ative Recebimentos Online'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 max-w-md">
                            {company?.stripe_charges_enabled
                                ? 'Sua conta está conectada e pronta para receber pagamentos via cartão de crédito e PIX no checkout.'
                                : 'Conecte sua conta Stripe para aceitar pagamentos diretamente pela plataforma e automatizar seus recebimentos.'}
                        </p>
                    </div>
                </div>
                <Button
                    onClick={handleConnectStripe}
                    isLoading={connectingStripe}
                    variant={company?.stripe_charges_enabled ? 'secondary' : 'primary'}
                    size="sm"
                    className="w-full sm:w-auto"
                >
                    {company?.stripe_charges_enabled ? 'Configurações Stripe' : 'Conectar Agora'}
                </Button>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Available Balance */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Saldo Disponivel</h3>
                    <div className="text-3xl font-bold text-gray-900">
                        {formatCurrency(availableAmount, currency)}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${payoutsEnabled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className={`text-xs font-semibold ${payoutsEnabled ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {payoutsEnabled ? 'Apto para saque automático' : 'Verificação ou Documentos Pendentes'}
                        </span>
                    </div>
                </div>

                {/* Pending Balance */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Em Processamento</h3>
                    <div className="text-3xl font-bold text-gray-900">
                        {formatCurrency(pendingAmount, currency)}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Ganhos futuros aguardando liberação.</p>
                </div>

                {/* Total Earnings */}
                <div className="bg-primary-50 p-5 rounded-2xl shadow-sm border border-primary-100">
                    <h3 className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-2">Faturamento Mensal</h3>
                    <div className="text-3xl font-bold text-primary-600">
                        R$ {grossAmount.toFixed(2)}
                    </div>
                    <p className="text-xs text-primary-400 mt-2">{monthlyMetrics.count} pedidos completos neste mês.</p>
                </div>

                {/* Gamification / Level Progress */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-2xl shadow-sm text-white relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Próximo Nível</h3>
                        {sellerStats ? (
                            <>
                                <div className="text-2xl font-bold mb-1">
                                    {sellerStats.next_level || 'Máximo Atingido'}
                                </div>
                                {sellerStats.next_level && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-400">
                                            Progresso para o próximo nível
                                        </p>
                                        <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-2">
                                            <div
                                                className="bg-secondary-500 h-1.5 rounded-full transition-all duration-500"
                                                style={{ width: `${sellerStats.level_progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                                {!sellerStats.next_level && <p className="text-xs text-yellow-400 mt-2">Você é um vendedor Top!</p>}
                            </>
                        ) : (
                            <p className="text-sm text-gray-400">Sem dados de nível</p>
                        )}
                    </div>
                    {/* Decorative */}
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                </div>
            </div>

            {/* AI Insights Section */}
            <div className="bg-gradient-to-br from-primary-50 to-white p-6 rounded-2xl border border-primary-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
                            <Lightbulb size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Insights com Inteligencia Artificial</h3>
                            <p className="text-xs text-gray-500">Dicas personalizadas para aumentar seu faturamento</p>
                        </div>
                    </div>
                    <button
                        onClick={handleGetAITips}
                        disabled={loadingTips}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-primary-200 text-primary-700 rounded-xl text-xs font-bold hover:bg-primary-50 transition-all shadow-sm disabled:opacity-50"
                    >
                        {loadingTips ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Sparkles size={14} className="text-primary-500" />
                        )}
                        {aiTips.length > 0 ? 'Atualizar Dicas' : 'Gerar Insights'}
                    </button>
                </div>

                {aiTips.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiTips.map((tip, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={index}
                                className="p-4 bg-white border border-gray-100 rounded-xl flex gap-3 items-start"
                            >
                                <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                                    <TrendingUp size={12} />
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed font-medium">"{tip}"</p>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-4 text-center">
                        <p className="text-sm text-gray-400 italic">Clique no botao acima para analisar seu desempenho e receber dicas.</p>
                    </div>
                )}
            </div>

            {/* Fee Breakdown */}
            <div className="grid grid-cols-3 gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Faturamento Bruto</p>
                    <p className="text-xl font-bold text-gray-900">R$ {grossAmount.toFixed(2)}</p>
                </div>
                <div className="text-center border-x border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Taxa Plataforma ({Math.round(effectiveCommissionRate * 100)}%)</p>
                    <p className="text-xl font-bold text-red-500">- R$ {platformFee.toFixed(2)}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Valor Líquido</p>
                    <p className="text-xl font-bold text-green-600">R$ {netAmount.toFixed(2)}</p>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Histórico de Transações no Stripe</h3>
                </div>

                {stripeTransactions.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <DollarSign size={20} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Nenhuma transação financeira encontrada.</p>
                        <p className="text-xs text-gray-400 mt-1">Seus ganhos e pagamentos aparecerão aqui.</p>
                    </div>
                ) : (
                    <div className="p-0">
                        {/* Mobile View (Cards) */}
                        <div className="block sm:hidden divide-y divide-gray-100">
                            {stripeTransactions.map((t) => (
                                <div key={t.id} className="p-4 flex flex-col gap-2 bg-white hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="font-medium text-gray-900">{t.description || t.type}</div>
                                        <div className={`font-bold ${t.amount > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                            {t.amount > 0 ? '+' : ''} {formatCurrency(t.amount, t.currency)}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs mt-1">
                                        <div className="text-gray-500 flex flex-col">
                                            <span>{new Date(t.created * 1000).toLocaleDateString()}</span>
                                            <span>{new Date(t.created * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${t.amount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {t.type}
                                            </span>
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{t.status}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop View (Table) */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[600px]">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3">Data</th>
                                        <th className="px-6 py-3">Descrição</th>
                                        <th className="px-6 py-3">Tipo</th>
                                        <th className="px-6 py-3 text-right">Valor</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {stripeTransactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                                {new Date(t.created * 1000).toLocaleDateString()} <span className="text-xs text-gray-400 ml-1">{new Date(t.created * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {t.description || t.type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.amount > 0
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${t.amount > 0 ? 'text-green-600' : 'text-gray-600'
                                                }`}>
                                                {t.amount > 0 ? '+' : ''} {formatCurrency(t.amount, t.currency)}
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{t.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            {/* Note: Dados bancarios removed in favor of direct Stripe Dashboard payouts */}
            {!company?.stripe_charges_enabled && (
                <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-100 text-center">
                    <p className="text-yellow-800 text-sm font-bold">Saques e Gestão Bancária</p>
                    <p className="text-yellow-700 text-xs mt-1 mb-3">Conecte sua conta do Stripe para gerenciar seus dados bancários e receber saques automaticamente.</p>
                    <Button onClick={handleConnectStripe} size="sm" variant="outline">
                        Conectar Stripe
                    </Button>
                </div>
            )}
        </div>
    );
};

export default DashboardFaturamentoPage;
