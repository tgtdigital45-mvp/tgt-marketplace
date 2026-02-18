import { useQuery } from '@tanstack/react-query';
import { supabase } from '@tgt/shared';
import { UserProfile, Booking, Favorite, Conversation } from '@tgt/shared';

interface ClientProfileData {
    profile: UserProfile | null;
    bookings: Booking[];
    favorites: Favorite[];
    conversations: Conversation[];
}

export const useClientProfileData = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['client-profile-data', userId],
        queryFn: async (): Promise<ClientProfileData> => {
            if (!userId) {
                return { profile: null, bookings: [], favorites: [], conversations: [] };
            }

            // Parallel Fetching
            try {
                const [profileRes, bookingsRes, messagesRes, favoritesRes] = await Promise.all([
                    // 1. Profile
                    supabase.from('profiles').select('*').eq('id', userId).single(),

                    // 2. Bookings
                    supabase
                        .from('bookings')
                        .select('*, companies(company_name)')
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
            company:companies(id, company_name, logo_url, description, category, address)
          `)
                        .eq('user_id', userId)
                ]);

                // Check for individual query errors that might not throw but return { error }
                if (bookingsRes.error) console.error('Bookings Fetch Error:', bookingsRes.error);
                if (messagesRes.error) console.error('Messages Fetch Error:', messagesRes.error);
                if (favoritesRes.error) console.error('Favorites Fetch Error:', favoritesRes.error);


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
                        rating: 0, // Not available in list view currently
                        review_count: 0, // Not available in list view currently
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

                    // Fetch company names for these contacts
                    const contactIdArray = Array.from(contactIds);
                    if (contactIdArray.length > 0) {
                        const { data: companies } = await supabase
                            .from('companies')
                            .select('id, company_name, profile_id')
                            .in('profile_id', contactIdArray);

                        // Merge names
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
                    conversations
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
