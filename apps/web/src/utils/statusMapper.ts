/**
 * Centraliza o mapeamento de status do sistema para Português-BR
 * e define quais status são considerados "ativos" para filtros de UI.
 */

export const ORDER_STATUS_MAP: Record<string, string> = {
    'pending': 'Aguardando Empresa',
    'waiting_acceptance': 'Aguardando sua Aprovação',
    'accepted': 'Confirmado',
    'on_the_way': 'A Caminho',
    'in_progress': 'Em Execução',
    'completed': 'Concluído',
    'cancelled': 'Cancelado',
    'canceled': 'Cancelado',
    'rejected': 'Rejeitado',
    'pending_quote': 'Orçamento Pendente',
    'answered_quote': 'Orçamento Respondido',
    'pending_client_approval': 'Aguardando sua Resposta', // Usado em alguns fluxos como sinônimo de waiting_acceptance
    'rejected_quote': 'Orçamento Recusado',
    'accepted_quote': 'Orçamento Aceito',
    'open': 'Aguardando Propostas',
    'pending_payment': 'Pagamento Pendente',
    'active': 'Projeto Ativo',
    'delivered': 'Entregue / Ag. Aprovação',
    'awaiting_approval': 'Aguardando sua Aprovação',
};

export const ORDER_STATUS_COLOR: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'secondary'> = {
    'pending': 'info',
    'waiting_acceptance': 'warning',
    'accepted': 'success',
    'on_the_way': 'info',
    'in_progress': 'success',
    'completed': 'success',
    'cancelled': 'danger',
    'canceled': 'danger',
    'rejected': 'danger',
    'pending_quote': 'info',
    'answered_quote': 'warning',
    'pending_client_approval': 'warning',
    'rejected_quote': 'danger',
    'accepted_quote': 'success',
};

/**
 * Retorna o label formatado para um status de ordem
 */
export const formatOrderStatus = (status: string): string => {
    return ORDER_STATUS_MAP[status] || status;
};

/**
 * Lista de status considerados "ativos" para o dashboard do cliente
 */
export const ACTIVE_ORDER_STATUSES = [
    'pending',
    'waiting_acceptance',
    'accepted',
    'on_the_way',
    'in_progress',
    'pending_quote',
    'answered_quote',
    'pending_client_approval',
    'pending_payment',
    'active',
    'delivered',
    'awaiting_approval'
];

/**
 * Lista de status de pagamento
 */
export const PAYMENT_STATUS_MAP: Record<string, string> = {
    'paid': 'Pago',
    'pending': 'Pendente',
    'failed': 'Falhou',
    'refunded': 'Reembolsado',
};
