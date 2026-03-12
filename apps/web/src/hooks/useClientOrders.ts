import { useQuery } from '@tanstack/react-query';
import { supabase } from '@tgt/shared';
import { BookingWithCompany, JobRequest, DbJobRequest, DbBooking } from '@tgt/shared';

export interface ClientOrdersData {
    jobs: JobRequest[];
    bookings: BookingWithCompany[];
}

export const useClientOrders = (userId: string | undefined) => {
    return useQuery({
        queryKey: ['client-orders', userId],
        queryFn: async (): Promise<ClientOrdersData> => {
            if (!userId) return { jobs: [], bookings: [] };

            // Parallel Fetching using Promise.all
            try {
                const [jobsResponse, bookingsResponse] = await Promise.all([
                    supabase
                        .from('jobs')
                        .select(`
            *,
            proposals (
              *,
              professional:profiles!proposals_user_id_profiles_fkey (
                id,
                full_name, avatar_url
              )
            )
          `)
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false }),

                     // 2. Fetch Orders (Both standard and budget)
                    supabase
                        .from('orders')
                        .select(`
                            *,
                            service:services (
                                requires_quote,
                                title,
                                duration_minutes,
                                company:companies (
                                    id,
                                    company_name,
                                    logo_url
                                )
                            ),
                            seller:profiles!orders_seller_id_fkey (
                                id,
                                full_name,
                                avatar_url,
                                companies!profile_id (
                                    company_name,
                                    logo_url
                                )
                            )
                        `)
                        .eq('buyer_id', userId)
                        .order('created_at', { ascending: false })
                ]);

                if (jobsResponse.error) {
                    console.error('Error fetching jobs:', jobsResponse.error);
                }
                if (bookingsResponse.error) {
                    console.error('Error fetching bookings:', bookingsResponse.error);
                }

                // Transform Jobs Data
                const rawJobs = (jobsResponse.data || []) as any[];

                // Fetch companies for proposals
                let professionalIds: string[] = [];
                rawJobs.forEach(j => {
                    j.proposals?.forEach((p: any) => {
                        if (p.professional?.id) professionalIds.push(p.professional.id);
                    });
                });
                professionalIds = [...new Set(professionalIds)].filter(Boolean);
                let companiesMap: Record<string, any> = {};

                if (professionalIds.length > 0) {
                    const { data: companiesData } = await supabase
                        .from('companies')
                        .select('profile_id, company_name, logo_url')
                        .in('profile_id', professionalIds);
                    if (companiesData) {
                        companiesData.forEach(c => companiesMap[c.profile_id] = c);
                    }
                }

                const jobs: JobRequest[] = rawJobs.map((j) => ({
                    id: j.id,
                    title: j.title,
                    description: j.description,
                    status: j.status,
                    created_at: j.created_at,
                    budget_min: j.budget_min,
                    budget_max: j.budget_max,
                    category: undefined, // Category join removed due to schema issues
                    proposals: (j.proposals || []).map((p: any) => ({
                        id: p.id,
                        company_id: p.user_id, // professional user_id
                        price: p.price,
                        cover_letter: p.message, // using 'message' from DB instead of 'cover_letter'
                        status: p.status,
                        created_at: p.created_at,
                        company: {
                            name: companiesMap[p.professional?.id]?.company_name || p.professional?.full_name || 'Profissional',
                            avatar_url: companiesMap[p.professional?.id]?.logo_url || p.professional?.avatar_url
                        }
                    }))
                }));

                // Transform Bookings/Orders Data (Detecting Quotes)
                const rawBookings = (bookingsResponse.data || []) as any[];
                const bookings: BookingWithCompany[] = rawBookings.map((b) => {
                    const isQuote = b.service?.requires_quote || b.price === 0 || ['pending', 'viewed', 'in_review'].includes(b.status);
                    
                    let mappedStatus = b.status;
                    if (isQuote) {
                        if (b.status === 'pending') mappedStatus = 'pending_quote';
                        if (b.status === 'in_review') mappedStatus = 'answered_quote';
                    }

                    const sellerCompany = b.seller?.companies?.[0] || b.service?.company;

                    return {
                        id: b.id,
                        is_quote: isQuote,
                        client_id: b.buyer_id,
                        company_id: b.seller_id,
                        service_title: b.service_title || b.service?.title,
                        service_price: b.price || b.budget_expectation || 0,
                        booking_date: b.scheduled_for || b.created_at,
                        booking_time: b.scheduled_for 
                            ? new Date(b.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : 'A Combinar',
                        status: mappedStatus as any,
                        // UI Extensions
                        companyName: sellerCompany?.company_name || b.seller?.full_name || 'Empresa',
                        serviceName: b.service_title || b.service?.title || 'Serviço',
                        price: b.price || b.budget_expectation || 0,
                        date: b.scheduled_for || b.created_at,
                        time: b.scheduled_for 
                            ? new Date(b.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : 'A Combinar',
                        // Proposal
                        proposed_date: b.proposed_date,
                        proposed_time: (b as any).proposed_time,
                        proposal_expires_at: b.proposal_expires_at,
                        // Linking
                        order_id: b.id,
                        created_at: b.created_at
                    };
                }).sort((a, b) => {
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                });

                return { jobs, bookings };

            } catch (error) {
                console.error('CRITICAL: Error fetching client orders:', error);
                return { jobs: [], bookings: [] };
            }


        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
};
