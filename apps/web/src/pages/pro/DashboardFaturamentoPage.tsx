import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/shared';
import { DbWallet, DbTransaction, SellerStats } from '@tgt/shared';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import Button from '@/components/ui/Button';
import { Sparkles, Loader2, TrendingUp, Lightbulb, ChevronRight, Wallet, Clock, DollarSign, Zap, Landmark } from 'lucide-react';
import { gemini } from '@/utils/gemini';
import { useToast } from '@/contexts/ToastContext';
import { motion } from 'framer-motion';

const PLATFORM_FEE_RATE = 0.15;

const DashboardFaturamentoPage: React.FC = () => {
    const { user } = useAuth();
    const { company } = useCompany();
    const [wallet, setWallet] = useState<DbWallet | null>(null);
    const [transactions, setTransactions] = useState<DbTransaction[]>([]);
    const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const [aiTips, setAiTips] = useState<string[]>([]);
    const [loadingTips, setLoadingTips] = useState(false);

    // Filter state
    const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');

    // Bank data state
    const [bankData, setBankData] = useState({
        pix_key: '',
        bank_name: '',
        bank_agency: '',
        bank_account: '',
        bank_account_type: 'checking',
    });
    const [savingBank, setSavingBank] = useState(false);
    const [connectingStripe, setConnectingStripe] = useState(false);

    const handleConnectStripe = async () => {
        if (!company?.id) return;
        try {
            setConnectingStripe(true);
            const { data, error } = await supabase.functions.invoke('create-connect-onboarding', {
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

    const handlePayout = async () => {
        if (!wallet || wallet.balance <= 0) {
            alert("Saldo insuficiente para saque.");
            return;
        }

        const amountStr = window.prompt(`Quanto deseja sacar? (Máx: R$ ${wallet.balance.toFixed(2)})`, wallet.balance.toString());
        if (!amountStr) return;

        const amount = parseFloat(amountStr.replace(',', '.'));
        if (isNaN(amount) || amount <= 0 || amount > wallet.balance) {
            alert("Valor inválido.");
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase.functions.invoke('request-payout', {
                body: { amount, user_id: user?.id }
            });

            if (error) throw error;

            alert("Solicitação de saque realizada com sucesso!");
            window.location.reload(); // Simple refresh to update balance

        } catch (err: any) {
            console.error('Payout error:', err);
            alert(`Erro ao solicitar saque: ${err.message || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGetAITips = async () => {
        if (!wallet) return;
        try {
            setLoadingTips(true);
            const tips = await gemini.generateBillingTips(wallet, transactions);
            setAiTips(tips);
            addToast('Insights gerados com sucesso!', 'success');
        } catch (err) {
            console.error(err);
            addToast('Erro ao gerar insights financeiros.', 'error');
        } finally {
            setLoadingTips(false);
        }
    };

    // Load bank data from company record
    useEffect(() => {
        if (company) {
            setBankData({
                pix_key: (company as any).pix_key || '',
                bank_name: (company as any).bank_name || '',
                bank_agency: (company as any).bank_agency || '',
                bank_account: (company as any).bank_account || '',
                bank_account_type: (company as any).bank_account_type || 'checking',
            });
        }
    }, [company]);

    const handleSaveBankData = async () => {
        if (!company?.id) return;
        try {
            setSavingBank(true);
            const { error } = await supabase.from('companies').update({
                pix_key: bankData.pix_key,
                bank_name: bankData.bank_name,
                bank_agency: bankData.bank_agency,
                bank_account: bankData.bank_account,
                bank_account_type: bankData.bank_account_type,
            }).eq('id', company.id);
            if (error) throw error;
            alert('Dados bancários salvos com sucesso!');
        } catch (err: any) {
            alert(`Erro ao salvar: ${err.message}`);
        } finally {
            setSavingBank(false);
        }
    };

    useEffect(() => {
        const fetchWallet = async () => {
            if (!user) return;
            try {
                // 1. Get Wallet
                let { data: walletData, error: walletError } = await supabase
                    .from('wallets')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (walletError && walletError.code === 'PGRST116') {
                    // Auto-create wallet if not exists
                    const { data: newWallet, error: createError } = await supabase
                        .from('wallets')
                        .insert({ user_id: user.id })
                        .select()
                        .single();

                    if (createError) throw createError;
                    walletData = newWallet;
                } else if (walletError) {
                    throw walletError;
                }

                if (walletData) {
                    setWallet(walletData);

                    // 2. Get Transactions
                    const { data: trxData, error: trxError } = await supabase
                        .from('transactions')
                        .select('*')
                        .eq('wallet_id', walletData.id)
                        .order('created_at', { ascending: false });

                    if (trxError) throw trxError;
                    setTransactions(trxData || []);
                }

                // 3. Get Seller Stats (Level)
                const { data: statsData, error: statsError } = await supabase
                    .from('seller_stats')
                    .select('*')
                    .eq('seller_id', user.id)
                    .single();

                if (statsError && statsError.code !== 'PGRST116') {
                    console.error("Error fetching stats:", statsError);
                } else {
                    setSellerStats(statsData);
                }

            } catch (error) {
                console.error("Error loading wallet", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWallet();
    }, [user]);

    // Filtered transactions
    const filteredTransactions = transactions.filter(t => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (filterDateStart && t.created_at < filterDateStart) return false;
        if (filterDateEnd && t.created_at > filterDateEnd + 'T23:59:59') return false;
        return true;
    });

    const grossAmount = transactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
    const platformFee = grossAmount * PLATFORM_FEE_RATE;
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
                    <div className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 shadow-sm ${getLevelBadgeColor(sellerStats.current_level)}`}>
                        <Zap size={14} />
                        <span className="text-xs font-bold">{sellerStats.current_level}</span>
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
                        R$ {wallet?.balance.toFixed(2) || '0.00'}
                    </div>
                    <Button
                        size="sm"
                        className="mt-4 w-full"
                        variant="outline"
                        onClick={handlePayout}
                        disabled={!wallet || wallet.balance <= 0}
                    >
                        Solicitar Saque
                    </Button>
                </div>

                {/* Pending Balance */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Em Analise</h3>
                    <div className="text-3xl font-bold text-gray-900">
                        R$ {wallet?.pending_balance.toFixed(2) || '0.00'}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Valores de pedidos em andamento.</p>
                </div>

                {/* Total Earnings */}
                <div className="bg-primary-50 p-5 rounded-2xl shadow-sm border border-primary-100">
                    <h3 className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-2">Total Ganho</h3>
                    <div className="text-3xl font-bold text-primary-600">
                        R$ {transactions
                            .filter(t => t.type === 'credit')
                            .reduce((acc, curr) => acc + curr.amount, 0)
                            .toFixed(2)}
                    </div>
                    <p className="text-xs text-primary-400 mt-2">Sua receita total na plataforma.</p>
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
                                            Faltam {sellerStats.orders_to_next_level} pedidos completos
                                        </p>
                                        <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-2">
                                            <div
                                                className="bg-secondary-500 h-1.5 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, Math.max(0, ((20 - sellerStats.orders_to_next_level) / 20) * 100))}%` }}
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
                    <p className="text-xs text-gray-500 mb-1">Taxa Plataforma (15%)</p>
                    <p className="text-xl font-bold text-red-500">- R$ {platformFee.toFixed(2)}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Valor Líquido</p>
                    <p className="text-xl font-bold text-green-600">R$ {netAmount.toFixed(2)}</p>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Histórico de Transações</h3>
                    <Button variant="outline" size="sm" onClick={() => { }}>Exportar CSV</Button>
                </div>

                {/* Filters */}
                <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-3 items-center">
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value as any)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                        <option value="all">Todos os tipos</option>
                        <option value="credit">Entradas</option>
                        <option value="debit">Saídas</option>
                    </select>
                    <input
                        type="date"
                        value={filterDateStart}
                        onChange={e => setFilterDateStart(e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                    <input
                        type="date"
                        value={filterDateEnd}
                        onChange={e => setFilterDateEnd(e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                    {(filterType !== 'all' || filterDateStart || filterDateEnd) && (
                        <button
                            onClick={() => { setFilterType('all'); setFilterDateStart(''); setFilterDateEnd(''); }}
                            className="text-xs text-gray-500 hover:text-red-500 underline"
                        >
                            Limpar filtros
                        </button>
                    )}
                </div>

                {filteredTransactions.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <DollarSign size={20} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Nenhuma transacao encontrada.</p>
                        <p className="text-xs text-gray-400 mt-1">Suas entradas e saidas aparecerao aqui.</p>
                    </div>
                ) : (
                    <div className="p-0">
                        {/* Mobile View (Cards) */}
                        <div className="block sm:hidden divide-y divide-gray-100">
                            {filteredTransactions.map((t) => (
                                <div key={t.id} className="p-4 flex flex-col gap-2 bg-white hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="font-medium text-gray-900">{t.description}</div>
                                        <div className={`font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'credit' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs mt-1">
                                        <div className="text-gray-500 flex flex-col">
                                            <span>{new Date(t.created_at).toLocaleDateString()}</span>
                                            <span>{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${t.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {t.type === 'credit' ? 'Entrada' : 'Saída'}
                                            </span>
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">Concluído</span>
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
                                    {filteredTransactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                                {new Date(t.created_at).toLocaleDateString()} <span className="text-xs text-gray-400 ml-1">{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {t.description}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.type === 'credit'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {t.type === 'credit' ? 'Entrada' : 'Saída'}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {t.type === 'credit' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Concluído</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            {/* Bank Data Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-1">
                    <Landmark size={16} className="text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-800">Dados para Recebimento</h3>
                </div>
                <p className="text-xs text-gray-400 mb-5">Informe seus dados bancarios para receber saques da plataforma.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Chave PIX</label>
                        <input
                            type="text"
                            value={bankData.pix_key}
                            onChange={e => setBankData(prev => ({ ...prev, pix_key: e.target.value }))}
                            placeholder="CPF, CNPJ, e-mail ou telefone"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Banco</label>
                        <input
                            type="text"
                            value={bankData.bank_name}
                            onChange={e => setBankData(prev => ({ ...prev, bank_name: e.target.value }))}
                            placeholder="Ex: Nubank, Itaú, Bradesco"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Agência</label>
                        <input
                            type="text"
                            value={bankData.bank_agency}
                            onChange={e => setBankData(prev => ({ ...prev, bank_agency: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Conta</label>
                        <input
                            type="text"
                            value={bankData.bank_account}
                            onChange={e => setBankData(prev => ({ ...prev, bank_account: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Conta</label>
                        <select
                            value={bankData.bank_account_type}
                            onChange={e => setBankData(prev => ({ ...prev, bank_account_type: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        >
                            <option value="checking">Conta Corrente</option>
                            <option value="savings">Conta Poupança</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={handleSaveBankData} isLoading={savingBank} size="sm">
                        Salvar Dados Bancários
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DashboardFaturamentoPage;
