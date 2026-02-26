import React, { useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    RefreshControl,
} from 'react-native';
import { ClipboardList, Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { useUserOrders, UserOrder } from '@/hooks/useUserOrders';

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    pending_payment: {
        label: 'Aguardando Pagamento',
        color: '#d97706',
        bgColor: 'bg-amber-50',
        icon: Clock,
    },
    active: {
        label: 'Ativo',
        color: '#2563eb',
        bgColor: 'bg-blue-50',
        icon: Package,
    },
    in_review: {
        label: 'Em Análise',
        color: '#7c3aed',
        bgColor: 'bg-violet-50',
        icon: AlertCircle,
    },
    completed: {
        label: 'Concluído',
        color: '#10b981',
        bgColor: 'bg-emerald-50',
        icon: CheckCircle,
    },
    cancelled: {
        label: 'Cancelado',
        color: '#ef4444',
        bgColor: 'bg-red-50',
        icon: XCircle,
    },
    pending_quote: {
        label: 'Orçamento Pendente',
        color: '#d97706',
        bgColor: 'bg-amber-50',
        icon: Clock,
    },
    answered_quote: {
        label: 'Orçamento Respondido',
        color: '#2563eb',
        bgColor: 'bg-blue-50',
        icon: AlertCircle,
    },
    rejected_quote: {
        label: 'Orçamento Recusado',
        color: '#ef4444',
        bgColor: 'bg-red-50',
        icon: XCircle,
    },
    accepted_quote: {
        label: 'Orçamento Aceito',
        color: '#10b981',
        bgColor: 'bg-emerald-50',
        icon: CheckCircle,
    },
};

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function OrderCard({ order }: { order: UserOrder }) {
    const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.active;
    const StatusIcon = config.icon;
    const imageUrl = order.service?.image_url;

    return (
        <View className="bg-white rounded-2xl mb-4 border border-slate-100 shadow-sm overflow-hidden mx-4">
            <View className="flex-row">
                {/* Service image */}
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} className="w-24 h-full" resizeMode="cover" />
                ) : (
                    <View className="w-24 bg-slate-100 items-center justify-center">
                        <Package size={28} color="#94a3b8" />
                    </View>
                )}

                {/* Content */}
                <View className="flex-1 p-4">
                    <Text className="text-brand-primary font-bold text-base mb-1" numberOfLines={1}>
                        {order.service_title}
                    </Text>
                    <Text className="text-brand-secondary text-xs mb-3">
                        {formatDate(order.created_at)} • {order.package_tier}
                    </Text>

                    <View className="flex-row items-center justify-between">
                        {/* Status Badge */}
                        <View className={`flex-row items-center ${config.bgColor} rounded-full px-3 py-1`}>
                            <StatusIcon size={12} color={config.color} />
                            <Text style={{ color: config.color }} className="text-xs font-semibold ml-1">
                                {config.label}
                            </Text>
                        </View>

                        {/* Price */}
                        <Text className="text-brand-accent font-bold">{formatCurrency(order.price)}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

function EmptyState() {
    return (
        <View className="flex-1 justify-center items-center px-6">
            <View className="bg-slate-100 p-8 rounded-full mb-6">
                <ClipboardList size={48} color="#64748b" />
            </View>
            <Text className="text-brand-primary text-xl font-bold mb-2">Sem pedidos ainda</Text>
            <Text className="text-brand-secondary text-center">
                Quando você contratar um serviço, ele aparecerá aqui para acompanhamento.
            </Text>
        </View>
    );
}

export default function OrdersScreen() {
    const { data: orders, isLoading, isError, refetch, isRefetching } = useUserOrders();

    const renderItem = useCallback(
        ({ item }: { item: UserOrder }) => <OrderCard order={item} />,
        []
    );

    if (isLoading) {
        return (
            <View className="flex-1 bg-brand-background justify-center items-center">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="text-brand-secondary mt-3">Carregando pedidos...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View className="flex-1 bg-brand-background justify-center items-center px-6">
                <AlertCircle size={48} color="#ef4444" />
                <Text className="text-brand-primary font-bold text-lg mt-4">Erro ao carregar</Text>
                <TouchableOpacity onPress={() => refetch()} className="mt-4 bg-brand-accent rounded-xl px-6 py-3">
                    <Text className="text-white font-bold">Tentar novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <View className="flex-1 bg-brand-background">
                <View className="px-6 pt-14 pb-4 bg-white border-b border-slate-100">
                    <Text className="text-brand-primary text-2xl font-bold">Meus Pedidos</Text>
                </View>
                <EmptyState />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-brand-background">
            <View className="px-6 pt-14 pb-4 bg-white border-b border-slate-100">
                <Text className="text-brand-primary text-2xl font-bold">Meus Pedidos</Text>
                <Text className="text-brand-secondary text-sm mt-1">{orders.length} pedido{orders.length > 1 ? 's' : ''}</Text>
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 30 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563eb" />
                }
            />
        </View>
    );
}
