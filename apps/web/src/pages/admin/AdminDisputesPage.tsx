import React, { useEffect, useState } from 'react';
import { supabase } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';

interface Dispute {
    id: string;
    order_id: string;
    buyer_id: string;
    seller_id: string;
    reason: string;
    status: string;
    admin_notes: string;
    created_at: string;
    order: {
        amount_total: number;
        service_title: string;
    };
    buyer: {
        full_name: string;
        email: string;
    };
    seller: {
        full_name: string;
        email: string;
    };
}

const AdminDisputesPage = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchDisputes = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('disputes')
                .select(`
                    id, order_id, buyer_id, seller_id, reason, status, admin_notes, created_at,
                    order:orders(amount_total, service_title),
                    buyer:profiles!disputes_buyer_id_fkey(full_name, email),
                    seller:profiles!disputes_seller_id_fkey(full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDisputes(data as any);
        } catch (err: any) {
            console.error('Error fetching disputes:', err);
            addToast('Erro ao carregar disputas: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin' || user?.email?.includes('tgt')) { // For admin verification MVP
            fetchDisputes();
        } else {
            console.warn("User is not admin");
            navigate('/admin');
        }
    }, [user, navigate]);

    const handleRefund = async (dispute: Dispute) => {
        if (!confirm('Tem certeza que deseja ESTORNAR este pedido para o comprador? O dinheiro será retirado do vendedor e processado via Stripe.')) return;

        setProcessingId(dispute.id);
        try {
            const { data, error } = await supabase.functions.invoke('process-refund', {
                body: { order_id: dispute.order_id, reason: 'requested_by_customer' }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            // Update dispute status
            await supabase.from('disputes').update({ status: 'resolved_refunded' }).eq('id', dispute.id);

            addToast('Estorno processado e disputa resolvida com sucesso!', 'success');
            fetchDisputes();
        } catch (err: any) {
            console.error('Refund error:', err);
            addToast('Erro ao processar estorno: ' + err.message, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeny = async (dispute: Dispute) => {
        if (!confirm('Tem certeza que deseja NEGAR esta disputa? O pagamento será liberado para o vendedor na próxima rodada do CRON.')) return;

        setProcessingId(dispute.id);
        try {
            // Update dispute status
            const { error } = await supabase.from('disputes').update({ status: 'resolved_denied' }).eq('id', dispute.id);

            if (error) throw error;

            // Re-activate the order/booking status so CRON will pick it up, or leave it completed.
            // Since it was 'completed' before the dispute, it might already be 'completed'.
            // Actually, simply resolving the dispute allows the CRON job to process it next time.

            addToast('Disputa negada. Valores liberados para o vendedor.', 'success');
            fetchDisputes();
        } catch (err: any) {
            console.error('Deny error:', err);
            addToast('Erro ao negar disputa: ' + err.message, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">Aberta</span>;
            case 'in_review': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">Em Análise</span>;
            case 'resolved_refunded': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Estornado (Comprador)</span>;
            case 'resolved_denied': return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">Negada (Vendedor)</span>;
            default: return <span>{status}</span>;
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner /></div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Mediação de Disputas</h1>
                        <p className="text-gray-500 mt-1">Gerencie casos de conflito e pedidos de estorno.</p>
                    </div>
                    <Link to="/admin" className="text-brand-primary hover:text-brand-secondary">
                        &larr; Voltar ao Dashboard
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido / Valor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Envolvidos</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {disputes.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhuma disputa encontrada.</td></tr>
                                )}
                                {disputes.map((dispute) => (
                                    <tr key={dispute.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(dispute.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 line-clamp-1">{dispute.order.service_title}</div>
                                            <div className="text-sm font-bold text-green-600">R$ {((dispute.order.amount_total || 0) / 100).toFixed(2)}</div>
                                            <div className="text-xs text-brand-primary mt-1">
                                                <Link to={`/orders/${dispute.order_id}`} target="_blank">Ver Sala &rarr;</Link>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <span className="text-gray-500">Comprador:</span> <span className="font-medium text-gray-900">{dispute.buyer?.full_name}</span>
                                            </div>
                                            <div className="text-sm mt-1">
                                                <span className="text-gray-500">Vendedor:</span> <span className="font-medium text-gray-900">{dispute.seller?.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {renderStatusBadge(dispute.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {(dispute.status === 'open' || dispute.status === 'in_review') ? (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleRefund(dispute)}
                                                        disabled={processingId === dispute.id}
                                                    >
                                                        {processingId === dispute.id ? 'Processando...' : 'Estornar'}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeny(dispute)}
                                                        disabled={processingId === dispute.id}
                                                    >
                                                        Negar
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Resolvida</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDisputesPage;
