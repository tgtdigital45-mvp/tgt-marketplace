import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import KPICard from '../../components/admin/KPICard';
import TransactionsTable from '../../components/admin/TransactionsTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Icons
const MoneyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const OrdersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

interface AdminMetrics {
    total_revenue: number;
    total_users: number;
    total_buyers: number;
    total_sellers: number;
    active_orders: number;
    completed_orders: number;
}

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Buscar métricas via RPC
                const { data: metricsData, error: metricsError } = await supabase
                    .rpc('get_admin_metrics');

                if (metricsError) {
                    console.error('[AdminDashboard] Error fetching metrics:', metricsError);
                    setError('Erro ao carregar métricas. Verifique se você tem permissão de admin.');
                    return;
                }

                setMetrics(metricsData);

                // Buscar transações recentes
                const { data: transactionsData, error: transactionsError } = await supabase
                    .from('transactions')
                    .select(`
            *,
            from_wallet:wallets!transactions_wallet_id_fkey(
              user:profiles(full_name, email)
            )
          `)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (transactionsError) {
                    console.error('[AdminDashboard] Error fetching transactions:', transactionsError);
                } else {
                    // Transformar dados para o formato esperado
                    const formattedTransactions = (transactionsData || []).map(tx => ({
                        ...tx,
                        from_profile: tx.from_wallet?.user,
                        to_profile: null // TODO: adicionar to_wallet quando disponível
                    }));
                    setTransactions(formattedTransactions);
                }

            } catch (err) {
                console.error('[AdminDashboard] Unexpected error:', err);
                setError('Erro inesperado ao carregar dashboard.');
            } finally {
                setLoading(false);
            }
        };

        if (user?.role === 'admin') {
            fetchAdminData();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-sm text-gray-500 mt-1">Visão global da plataforma TGT Contratto</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Admin
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <KPICard
                        title="Faturamento Total"
                        value={new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                        }).format(metrics?.total_revenue || 0)}
                        subtitle="Comissões da plataforma (10%)"
                        icon={<MoneyIcon />}
                        trend={{
                            value: '+12.5%',
                            isPositive: true
                        }}
                    />
                    <KPICard
                        title="Usuários Totais"
                        value={metrics?.total_users || 0}
                        subtitle={`${metrics?.total_buyers || 0} compradores, ${metrics?.total_sellers || 0} vendedores`}
                        icon={<UsersIcon />}
                        trend={{
                            value: '+8.2%',
                            isPositive: true
                        }}
                    />
                    <KPICard
                        title="Pedidos Ativos"
                        value={metrics?.active_orders || 0}
                        subtitle={`${metrics?.completed_orders || 0} completados no total`}
                        icon={<OrdersIcon />}
                    />
                </div>

                {/* Transações */}
                <TransactionsTable transactions={transactions} loading={false} />

                {/* Estatísticas Adicionais */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Saúde da Plataforma</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Taxa de Conclusão</span>
                                <span className="text-sm font-semibold text-green-600">
                                    {metrics?.completed_orders && metrics?.active_orders
                                        ? ((metrics.completed_orders / (metrics.completed_orders + metrics.active_orders)) * 100).toFixed(1)
                                        : 0}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Comissão Média</span>
                                <span className="text-sm font-semibold text-gray-900">10%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Ticket Médio</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {metrics?.total_revenue && metrics?.completed_orders
                                        ? new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        }).format((metrics.total_revenue * 10) / metrics.completed_orders)
                                        : 'R$ 0,00'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl shadow-sm p-6 text-white">
                        <h3 className="text-lg font-bold mb-4">Ações Rápidas</h3>
                        <div className="space-y-2">
                            <button className="w-full bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-4 py-2 text-left text-sm font-medium">
                                📊 Exportar Relatório
                            </button>
                            <button className="w-full bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-4 py-2 text-left text-sm font-medium">
                                👥 Gerenciar Usuários
                            </button>
                            <button className="w-full bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-4 py-2 text-left text-sm font-medium">
                                ⚙️ Configurações
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
