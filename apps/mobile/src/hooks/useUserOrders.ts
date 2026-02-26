import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface UserOrder {
    id: string;
    created_at: string;
    status: string;
    payment_status: string;
    price: number;
    package_tier: string;
    service_title: string;
    delivery_deadline: string | null;
    is_quote?: boolean;
    service?: {
        id: string;
        title: string;
        image_url: string | null;
    };
}

export function useUserOrders() {
    const { user } = useAuth();

    return useQuery<UserOrder[]>({
        queryKey: ['user-orders', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const [ordersRes, quotesRes] = await Promise.all([
                supabase
                    .from('orders')
                    .select(`
                        id,
                        created_at,
                        status,
                        payment_status,
                        price,
                        package_tier,
                        service_title,
                        delivery_deadline,
                        service:services (id, title, image_url)
                    `)
                    .eq('buyer_id', user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('quotes')
                    .select(`
                        id,
                        created_at,
                        status,
                        budget_expectation,
                        service:services (id, title, image_url)
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
            ]);

            if (ordersRes.error) throw ordersRes.error;
            if (quotesRes.error) throw quotesRes.error;

            const orders = (ordersRes.data ?? []) as unknown as UserOrder[];

            const quotes: UserOrder[] = (quotesRes.data ?? []).map(q => {
                let mappedStatus = q.status; // pending, answered, rejected, accepted
                if (q.status === 'pending') mappedStatus = 'pending_quote';
                if (q.status === 'answered') mappedStatus = 'answered_quote';
                if (q.status === 'rejected') mappedStatus = 'rejected_quote';
                if (q.status === 'accepted') mappedStatus = 'accepted_quote';

                return {
                    id: q.id,
                    is_quote: true,
                    created_at: q.created_at,
                    status: mappedStatus,
                    payment_status: 'none',
                    price: q.budget_expectation ?? 0,
                    package_tier: 'Orçamento',
                    service_title: (q.service as any)?.title ?? 'Serviço',
                    delivery_deadline: null,
                    service: q.service as any
                };
            });

            // Merge and sort
            const allItems = [...orders, ...quotes].sort((a, b) => {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            return allItems;
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 2,
    });
}
