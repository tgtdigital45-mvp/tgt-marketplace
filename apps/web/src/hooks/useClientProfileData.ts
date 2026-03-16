import { useQuery } from '@tanstack/react-query';
import { supabase } from '@tgt/core';;
import { UserProfile, Booking, Favorite, Conversation, DbOrder, DbQuote } from '@tgt/core';;

interface ClientProfileData {
    profile: UserProfile | null;
    bookings: Booking[];
    favorites: Favorite[];
    conversations: Conversation[];
    orders: DbOrder[];
    quotes: DbQuote[];
    totalSpent: number;
}

export const useClientProfileData = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['client-profile-data', userId],
        queryFn: async (): Promise<ClientProfileData> => {
            if (!userId) {
                return { profile: null, bookings: [], favorites: [], conversations: [], orders: [], quotes: [], totalSpent: 0 };
            }

            // Parallel Fetching
            try {
                const [profileRes, bookingsRes, messagesRes, favoritesRes, ordersRes, quotesRes] = await Promise.all([
                    // 1. Profile
                    supabase.from('profiles').select('*').eq('id', userId).single(),

                    // 2. Bookings
                    supabase
                        .from('bookings')
                        .select('*, companies(id, company_name, slug)')
                        .eq('client_id', userId)
                        .order('created_at', { ascending: false }),

                    // 3. Messages (for conversations)
                    supabase
                        .from('messages')
                        .select('*')
                        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                        .order('created_at', { ascending: false }),

                    // 4. Favorites
                    supabase
                        .from('favorites')
                        .select(`
            *,
            company:companies(id, company_name, logo_url, description, category, address, slug)
          `)
                        .eq('user_id', userId),

                    // 5. Orders
                    supabase
                        .from('orders')
                        .select('*, service:services(id, title, company:companies(id, company_name, logo_url, slug))')
                        .eq('buyer_id', userId)
                        .order('created_at', { ascending: false }),

                    // 6. Quotes
                    supabase
                        .from('quotes')
                        .select('*, service:services(id, title), companies:services(company:companies(id, company_name, logo_url, slug))')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false })
                ]);

                // Check for individual query errors
                if (bookingsRes.error) console.error('Bookings Fetch Error:', bookingsRes.error);
                if (messagesRes.error) console.error('Messages Fetch Error:', messagesRes.error);
                if (favoritesRes.error) console.error('Favorites Fetch Error:', favoritesRes.error);
                if (ordersRes.error) console.error('Orders Fetch Error:', ordersRes.error);
                if (quotesRes.error) console.error('Quotes Fetch Error:', quotesRes.error);


                // Process Profile
                const profile = profileRes.data as UserProfile | null;

                // Process Bookings
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const bookings = (bookingsRes.data || []).map((b: any) => ({
                    ...b,
                    companies: {
                        name: b.companies?.company_name || 'Empresa'
                    }
                })) as Booking[];

                // Process Orders & Total Spent
                const orders = (ordersRes.data || []) as DbOrder[];
                const totalSpent = orders
                    .filter(o => o.status === 'completed' || o.saga_status === 'COMPLETED')
                    .reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

                // Process Quotes
                const quotes = (quotesRes.data || []) as DbQuote[];

                // Process Favorites
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const favoritesRaw = (favoritesRes.data || []) as any[];
                const favorites: Favorite[] = favoritesRaw.map(fav => ({
                    id: fav.id,
                    company: {
                        id: fav.company?.id,
                        name: fav.company?.company_name,
                        logo_url: fav.company?.logo_url,
                        description: fav.company?.description,
                        category: fav.company?.category,
                        rating: 0,
                        review_count: 0,
                        city: fav.company?.address?.city || '',
                        state: fav.company?.address?.state || ''
                    }
                }));

                // Process Messages -> Conversations
                const msgs = messagesRes.data || [];
                const conversations: Conversation[] = [];

                if (msgs.length > 0) {
                    const contactIds = new Set<string>();
                    const rawConvos: { contactId: string; lastMessage: string; date: string; unread: boolean; }[] = [];

                    for (const m of msgs) {
                        const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id;
                        if (!contactIds.has(otherId)) {
                            contactIds.add(otherId);
                            rawConvos.push({
                                contactId: otherId,
                                lastMessage: m.content,
                                date: m.created_at,
                                unread: m.receiver_id === userId && !m.read
                            });
                        }
                    }

                    const contactIdArray = Array.from(contactIds);
                    if (contactIdArray.length > 0) {
                        const { data: companies } = await supabase
                            .from('companies')
                            .select('id, company_name, profile_id')
                            .in('profile_id', contactIdArray);

                        conversations.push(...rawConvos.map(c => {
                            const comp = companies?.find((co) => co.profile_id === c.contactId);
                            return {
                                ...c,
                                name: comp?.company_name || 'Empresa Desconhecida'
                            };
                        }));
                    }
                }

                return {
                    profile,
                    bookings,
                    favorites,
                    conversations,
                    orders,
                    quotes,
                    totalSpent
                };

            } catch (err) {
                console.error('CRITICAL: Error fetching client profile data:', err);
                throw err;
            }
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
