import { useState, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase';
import type { OrderStatus } from '@tgt/shared';

type UserRole = 'client' | 'company';

export type OrderListItem = {
    id: string;
    status: string;
    scheduled_for: string | null;
    price: number | null;
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
                .from('orders')
                .select(`
                    id, status, scheduled_for, price, created_at,
                    services (
                        title,
                        companies (company_name)
                    )
                `)
                .order('created_at', { ascending: false })
                .range(0, PAGE_SIZE - 1);

            if (role === 'client') {
                query = query.eq('buyer_id', userId);
            } else {
                query = query.eq('seller_id', userId);
            }

            const { data, error: fetchError } = await query;
            if (fetchError) throw fetchError;

            const fetched = (data as any[] ?? []).map(row => ({
                id: row.id,
                status: row.status,
                scheduled_for: row.scheduled_for,
                price: row.price,
                created_at: row.created_at,
                services: { title: row.services?.title },
                companies: { business_name: row.services?.companies?.company_name }
            }));

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
                .from('orders')
                .select(`
                    id, status, scheduled_for, price, created_at,
                    services (
                        title,
                        companies (company_name)
                    )
                `)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (role === 'client') {
                query = query.eq('buyer_id', userId);
            } else {
                query = query.eq('seller_id', userId);
            }

            const { data, error: fetchError } = await query;
            if (fetchError) throw fetchError;

            const fetched = (data as any[] ?? []).map(row => ({
                id: row.id,
                status: row.status,
                scheduled_for: row.scheduled_for,
                price: row.price,
                created_at: row.created_at,
                services: { title: row.services?.title },
                companies: { business_name: row.services?.companies?.company_name }
            }));

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
