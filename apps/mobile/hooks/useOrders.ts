import { useState, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase';
import type { OrderStatus, UserRole } from '@tgt/shared';

export type OrderListItem = {
    id: string;
    status: OrderStatus;
    scheduled_for: string | null;
    total_price: number | null;
    created_at: string;
    services: { title: string } | null;
    companies: { business_name: string } | null;
};

const PAGE_SIZE = 15;

type UseOrdersResult = {
    orders: OrderListItem[];
    isLoading: boolean;
    isRefreshing: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    error: boolean;
    fetchOrders: (options?: { silent?: boolean }) => Promise<void>;
    fetchMore: () => Promise<void>;
};

export function useOrders(userId: string | undefined, role: UserRole | null | undefined): UseOrdersResult {
    const [orders, setOrders] = useState<OrderListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(false);
    const pageRef = useRef(0);

    const fetchOrders = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
        if (!userId) return;

        if (!silent) setIsLoading(true);
        else setIsRefreshing(true);
        setError(false);
        pageRef.current = 0;

        try {
            let query = supabase
                .from('service_orders')
                .select('id, status, scheduled_for, total_price, created_at, services(title), companies(business_name)')
                .order('created_at', { ascending: false })
                .range(0, PAGE_SIZE - 1);

            if (role === 'client') {
                query = query.eq('client_id', userId);
            } else {
                const { data: company } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('owner_id', userId)
                    .single();
                if (company) {
                    query = query.eq('company_id', company.id);
                }
            }

            const { data, error: fetchError } = await query;
            if (fetchError) throw fetchError;

            const fetched = (data as unknown as OrderListItem[]) ?? [];
            setOrders(fetched);
            setHasMore(fetched.length === PAGE_SIZE);
            pageRef.current = 1;
        } catch {
            setError(true);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [userId, role]);

    const fetchMore = useCallback(async () => {
        if (!userId || isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);

        try {
            const from = pageRef.current * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = supabase
                .from('service_orders')
                .select('id, status, scheduled_for, total_price, created_at, services(title), companies(business_name)')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (role === 'client') {
                query = query.eq('client_id', userId);
            } else {
                const { data: company } = await supabase
                    .from('companies')
                    .select('id')
                    .eq('owner_id', userId)
                    .single();
                if (company) {
                    query = query.eq('company_id', company.id);
                }
            }

            const { data, error: fetchError } = await query;
            if (fetchError) throw fetchError;

            const fetched = (data as unknown as OrderListItem[]) ?? [];
            setOrders(prev => {
                const existingIds = new Set(prev.map(o => o.id));
                return [...prev, ...fetched.filter(o => !existingIds.has(o.id))];
            });
            setHasMore(fetched.length === PAGE_SIZE);
            pageRef.current += 1;
        } catch {
            // silencioso para paginação
        } finally {
            setIsLoadingMore(false);
        }
    }, [userId, role, isLoadingMore, hasMore]);

    return { orders, isLoading, isRefreshing, isLoadingMore, hasMore, error, fetchOrders, fetchMore };
}
