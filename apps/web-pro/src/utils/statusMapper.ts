/**
 * Centraliza o mapeamento de status para o Dashboard do Profissional (web-pro) em Português-BR.
 */

export const ORDER_STATUS_MAP: Record<string, string> = {
    'pending': 'Pendente',
    'waiting_acceptance': 'Aguardando sua Aceitação',
    'accepted': 'Confirmado',
    'in_progress': 'Em Andamento',
    'completed': 'Concluído',
    'cancelled': 'Cancelado',
    'canceled': 'Cancelado',
    'pending_client_approval': 'Aguardando Cliente',
    'rejected': 'Recusado',
    'pending_payment': 'Aguardando Pagamento',
    'payment_held': 'Pagamento Retido',
    'disputed': 'Em Disputa',
    'work_submitted_by_provider': 'Trabalho Enviado',
    'approved_by_client': 'Aprovado pelo Cliente',
};

export const ORDER_STATUS_COLOR: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'secondary' | 'primary'> = {
    'pending': 'warning',
    'waiting_acceptance': 'warning',
    'accepted': 'info',
    'in_progress': 'primary',
    'completed': 'success',
    'cancelled': 'danger',
    'canceled': 'danger',
    'pending_client_approval': 'secondary',
    'rejected': 'danger',
    'pending_payment': 'warning',
    'payment_held': 'info',
    'disputed': 'danger',
    'work_submitted_by_provider': 'info',
    'approved_by_client': 'success',
};

export const formatOrderStatus = (status: string): string => {
    return ORDER_STATUS_MAP[status] || status;
};

export const KANBAN_COLUMNS = [
    { key: 'pending', label: 'Pendentes', color: 'bg-amber-50/50 border-amber-100' },
    { key: 'accepted', label: 'Confirmados', color: 'bg-blue-50/50 border-blue-100' },
    { key: 'in_progress', label: 'Em Andamento', color: 'bg-primary-50/30 border-primary-100' },
    { key: 'completed', label: 'Concluídos', color: 'bg-emerald-50/50 border-emerald-100' },
];
