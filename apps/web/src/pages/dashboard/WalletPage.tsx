import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/shared';
import { DbWallet, DbTransaction, SellerStats } from '@tgt/shared';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';

const WalletPage = () => {
    const { user } = useAuth();
    const [wallet, setWallet] = useState<DbWallet | null>(null);
    const [transactions, setTransactions] = useState<DbTransaction[]>([]);
    const [sellerStats, setSellerStats] = useState<SellerStats | null>(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center">
                <div className="space-y-4 text-center">
                    <LoadingSpinner />
                    <p className="text-gray-500 animate-pulse">Carregando carteira e nível...</p>
                </div>
            </div>
        </div>
    );

    // Helper for Level Badge
    const getLevelBadgeColor = (level?: string) => {
        switch (level) {
            case 'Pro': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Level 2': return 'bg-gold-100 text-yellow-800 border-yellow-200'; // custom gold-like?
            case 'Level 1': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Header />

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Minha Carteira</h1>

                    {/* Seller Level Badge (Top Right) */}
                    {sellerStats && (
                        <div className={`px-4 py-2 rounded-full border flex items-center shadow-sm ${getLevelBadgeColor(sellerStats.current_level)}`}>
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 011.827.872l-.78 7.373a3 3 0 01-1.385 2.115l-4.316 2.47V18a1 1 0 11-2 0v-3.818l-4.316-2.47a3 3 0 01-1.385-2.115l-.78-7.373a1 1 0 011.827-.872l1.699 3.181L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552a1 1 0 01-.1.218 1 1 0 01-.986.096l4.09 2.338L10 13.5l2.814 1.977 4.09-2.337a1 1 0 01-.986-.097l-.818-2.552-2.9 1.16a1 1 0 01-.748 0L10 10.98l-1.452.68a1 1 0 01-.748 0l-2.9-1.16z" clipRule="evenodd" /></svg>
                            <span className="font-bold">{sellerStats.current_level}</span>
                        </div>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"> {/* Changed to 4 cols */}
                    {/* Available Balance */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Saldo Disponível</h3>
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

                    {/* Pending Balance (Future Feature) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 opacity-80">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Em Análise</h3>
                        <div className="text-3xl font-bold text-gray-900">
                            R$ {wallet?.pending_balance.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Valores de pedidos em andamento.</p>
                    </div>

                    {/* Total Earnings */}
                    <div className="bg-brand-primary/5 p-6 rounded-xl shadow-sm border border-brand-primary/20">
                        <h3 className="text-sm font-medium text-brand-primary uppercase tracking-wider mb-2">Total Ganho</h3>
                        <div className="text-3xl font-bold text-brand-primary">
                            R$ {transactions
                                .filter(t => t.type === 'credit')
                                .reduce((acc, curr) => acc + curr.amount, 0)
                                .toFixed(2)}
                        </div>
                        <p className="text-xs text-brand-primary/70 mt-2">Histórico completo.</p>
                    </div>

                    {/* NEW: Seller Stats / Progress (Gamification) */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-lg shadow-gray-200 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider mb-2">Próximo Nível</h3>
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
                                                    style={{ width: `${Math.min(100, Math.max(0, ((20 - sellerStats.orders_to_next_level) / 20) * 100))}%` }} // Rough calc based on "20" goal for Level 2, just visual
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                    {!sellerStats.next_level && <p className="text-xs text-yellow-400 mt-2">Você é um vendedor Top!</p>}
                                </>
                            ) : (
                                <p className="text-sm text-gray-400">Dados indisponíveis</p>
                            )}
                        </div>
                        {/* Decorative Icon */}
                        <svg className="absolute -bottom-4 -right-4 w-24 h-24 text-gray-700/20 transform group-hover:scale-110 transition-transform duration-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-bold text-gray-900">Histórico de Transações</h3>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Nenhuma transação encontrada.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Data</th>
                                        <th className="px-6 py-3">Descrição</th>
                                        <th className="px-6 py-3">Tipo</th>
                                        <th className="px-6 py-3 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-gray-600">
                                                {new Date(t.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {t.description}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.type === 'credit'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {t.type === 'credit' ? 'Entrada' : 'Saída'}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {t.type === 'credit' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletPage;
