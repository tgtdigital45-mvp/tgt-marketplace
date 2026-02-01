import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DbWallet, DbTransaction } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/layout/Header';
import Button from '../../components/ui/Button';

const WalletPage = () => {
    const { user } = useAuth();
    const [wallet, setWallet] = useState<DbWallet | null>(null);
    const [transactions, setTransactions] = useState<DbTransaction[]>([]);
    const [loading, setLoading] = useState(true);

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
                    // Try to create if not exists (though trigger should handle it, good fallback)
                    // Or maybe trigger failed? For now assume trigger works, but if testing with old users...
                    // Let's just handle error.
                    console.warn("Wallet not found via select, maybe new user logic needed.");
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

            } catch (error) {
                console.error("Error loading wallet", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWallet();
    }, [user]);

    if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Header />

            <div className="max-w-6xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Minha Carteira</h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Available Balance */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Saldo Disponível</h3>
                        <div className="text-4xl font-bold text-gray-900">
                            R$ {wallet?.balance.toFixed(2) || '0.00'}
                        </div>
                        <Button size="sm" className="mt-4 w-full" variant="outline">Solicitar Saque</Button>
                    </div>

                    {/* Pending Balance (Future Feature) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 opacity-60">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Em Análise (Breve)</h3>
                        <div className="text-4xl font-bold text-gray-900">
                            R$ {wallet?.pending_balance.toFixed(2) || '0.00'}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Valores de pedidos em andamento.</p>
                    </div>

                    {/* Total Earnings (Mock / Calc) */}
                    <div className="bg-brand-primary/5 p-6 rounded-xl shadow-sm border border-brand-primary/20">
                        <h3 className="text-sm font-medium text-brand-primary uppercase tracking-wider mb-2">Total Ganho</h3>
                        <div className="text-4xl font-bold text-brand-primary">
                            R$ {transactions
                                .filter(t => t.type === 'credit')
                                .reduce((acc, curr) => acc + curr.amount, 0)
                                .toFixed(2)}
                        </div>
                        <p className="text-xs text-brand-primary/70 mt-2">Acumulado histórico.</p>
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
