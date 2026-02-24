import React from 'react';
import { getOptimizedImageUrlExact } from '@/utils/supabase-image-loader';

interface Transaction {
    id: string;
    created_at: string;
    amount: number;
    type: string;
    description: string;
    from_profile?: {
        full_name: string;
        email: string;
        avatar_url?: string;
    };
    to_profile?: {
        full_name: string;
        email: string;
    };
}

interface TransactionsTableProps {
    transactions: Transaction[];
    loading?: boolean;
}

/**
 * TransactionsTable - Tabela de transações recentes para admin
 */
const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions, loading }) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(amount);
    };

    const getTypeBadgeColor = (type: string) => {
        const colors: Record<string, string> = {
            'payment': 'bg-green-100 text-green-700',
            'platform_fee': 'bg-blue-100 text-blue-700',
            'withdrawal': 'bg-orange-100 text-orange-700',
            'refund': 'bg-red-100 text-red-700',
        };
        return colors[type] || 'bg-gray-100 text-gray-700';
    };

    const getAvatarUrl = (path: string | null | undefined, name: string) => {
        if (!path) return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=40`;
        return getOptimizedImageUrlExact(path, 40, 40);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4" />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-100 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Transações Recentes</h3>
                <p className="text-sm text-gray-500 mt-1">Últimas {transactions.length} transações da plataforma</p>
            </div>

            <div className="p-0">
                {/* Mobile View (Cards) */}
                <div className="block sm:hidden divide-y divide-gray-100">
                    {transactions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Nenhuma transação encontrada
                        </div>
                    ) : (
                        transactions.map((tx) => (
                            <div key={tx.id} className="p-4 flex flex-col gap-3 bg-white hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={getAvatarUrl(tx.from_profile?.avatar_url, tx.from_profile?.full_name || 'U')}
                                            alt=""
                                            className="h-10 w-10 rounded-full object-cover"
                                            loading="lazy"
                                        />
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm">
                                                {tx.from_profile?.full_name || 'Sistema'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Para: {tx.to_profile?.full_name || 'Plataforma'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-gray-900 text-right">
                                        {formatCurrency(tx.amount)}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-500 font-medium">
                                        {formatDate(tx.created_at)}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getTypeBadgeColor(tx.type)}`}>
                                        {tx.type}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Data
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    De
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Para
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Valor
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Nenhuma transação encontrada
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatDate(tx.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center">
                                                <img
                                                    src={getAvatarUrl(tx.from_profile?.avatar_url, tx.from_profile?.full_name || 'U')}
                                                    alt=""
                                                    className="h-8 w-8 rounded-full mr-3 object-cover"
                                                    loading="lazy"
                                                />
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {tx.from_profile?.full_name || 'Sistema'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {tx.from_profile?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="font-medium text-gray-900">
                                                {tx.to_profile?.full_name || 'Plataforma'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {tx.to_profile?.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(tx.type)}`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                            {formatCurrency(tx.amount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TransactionsTable;
