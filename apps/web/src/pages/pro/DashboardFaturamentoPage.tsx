import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/shared';
import { DbWallet, DbTransaction, SellerStats } from '@tgt/shared';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import Button from '@/components/ui/Button';

const PLATFORM_FEE_RATE = 0.15;

const DashboardFaturamentoPage: React.FC = () => {
    const { user } = useAuth();
    const { company } = useCompany();
    const [wallet, setWallet] = useState<DbWallet | null>(null);
    const [transactions, setTransactions] = useState<DbTransaction[]>([]);
    const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
    const [loading, setLoading] = useState(true);

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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Faturamento & Carteira</h1>
                    <p className="text-gray-500 mt-1">Gerencie seus ganhos, transações e saques.</p>
                </div>

                {/* Seller Level Badge (Top Right) */}
                {sellerStats && (
                    <div className={`px-4 py-2 rounded-full border flex items-center shadow-sm ${getLevelBadgeColor(sellerStats.current_level)}`}>
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.827.872l-.78 7.373a3 3 0 01-1.385 2.115l-4.316 2.47V18a1 1 0 11-2 0v-3.818l-4.316-2.47a3 3 0 01-1.385-2.115l-.78-7.373a1 1 0 011.827-.872l1.699 3.181L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552a1 1 0 01-.1.218 1 1 0 01-.986.096l4.09 2.338L10 13.5l2.814 1.977 4.09-2.337a1 1 0 01-.986-.097l-.818-2.552-2.9 1.16a1 1 0 01-.748 0L10 10.98l-1.452.68a1 1 0 01-.748 0l-2.9-1.16z" clipRule="evenodd" /></svg>
                        <span className="font-bold">{sellerStats.current_level}</span>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Available Balance */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Saldo Disponível</h3>
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
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 opacity-90">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Em Análise</h3>
                    <div className="text-3xl font-bold text-gray-900">
                        R$ {wallet?.pending_balance.toFixed(2) || '0.00'}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Valores de pedidos em andamento.</p>
                </div>

                {/* Total Earnings */}
                <div className="bg-brand-primary/5 p-6 rounded-xl shadow-sm border border-brand-primary/20">
                    <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Total Ganho</h3>
                    <div className="text-3xl font-bold text-brand-primary">
                        R$ {transactions
                            .filter(t => t.type === 'credit')
                            .reduce((acc, curr) => acc + curr.amount, 0)
                            .toFixed(2)}
                    </div>
                    <p className="text-xs text-brand-primary/70 mt-2">Sua receita total na plataforma.</p>
                </div>

                {/* Gamification / Level Progress */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-lg shadow-gray-200 text-white relative overflow-hidden group">
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
                                                className="bg-brand-secondary h-1.5 rounded-full transition-all duration-500"
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
                    {/* Decorative Icon */}
                    <svg className="absolute -bottom-4 -right-4 w-24 h-24 text-gray-700/20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                </div>
            </div>

            {/* Fee Breakdown */}
            <div className="grid grid-cols-3 gap-4 p-5 bg-white rounded-xl shadow-sm border border-gray-200">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Histórico de Transações</h3>
                    <Button variant="outline" size="sm" onClick={() => { }}>Exportar CSV</Button>
                </div>

                {/* Filters */}
                <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-3 items-center">
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value as any)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    >
                        <option value="all">Todos os tipos</option>
                        <option value="credit">Entradas</option>
                        <option value="debit">Saídas</option>
                    </select>
                    <input
                        type="date"
                        value={filterDateStart}
                        onChange={e => setFilterDateStart(e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                    <input
                        type="date"
                        value={filterDateEnd}
                        onChange={e => setFilterDateEnd(e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
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
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p>Nenhuma transação encontrada.</p>
                        <p className="text-sm">Suas entradas e saídas aparecerão aqui.</p>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-1">Dados para Recebimento</h3>
                <p className="text-sm text-gray-500 mb-5">Informe seus dados bancários para receber saques da plataforma.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Chave PIX</label>
                        <input
                            type="text"
                            value={bankData.pix_key}
                            onChange={e => setBankData(prev => ({ ...prev, pix_key: e.target.value }))}
                            placeholder="CPF, CNPJ, e-mail ou telefone"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Banco</label>
                        <input
                            type="text"
                            value={bankData.bank_name}
                            onChange={e => setBankData(prev => ({ ...prev, bank_name: e.target.value }))}
                            placeholder="Ex: Nubank, Itaú, Bradesco"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Agência</label>
                        <input
                            type="text"
                            value={bankData.bank_agency}
                            onChange={e => setBankData(prev => ({ ...prev, bank_agency: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Conta</label>
                        <input
                            type="text"
                            value={bankData.bank_account}
                            onChange={e => setBankData(prev => ({ ...prev, bank_account: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Conta</label>
                        <select
                            value={bankData.bank_account_type}
                            onChange={e => setBankData(prev => ({ ...prev, bank_account_type: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
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
