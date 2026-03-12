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
                const [jobsResponse, bookingsResponse, quotesResponse] = await Promise.all([
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

                    // 2. Fetch Bookings with Company details
                    supabase
                        .from('bookings')
                        .select(`
            *,
            companies(company_name, logo_url)
          `)
                        .eq('client_id', userId)
                        .order('created_at', { ascending: false }),

                    // 3. Fetch Quotes with Company details (via Service)
                    supabase
                        .from('quotes')
                        .select(`
            *,
            services (
                title,
                duration_minutes,
                companies (
                    id,
                    company_name,
                    logo_url
                )
            )
          `)
                        .eq('user_id', userId)
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

                // Transform Bookings Data
                const rawBookings = (bookingsResponse.data || []) as unknown as DbBooking[];
                const mappedBookings: BookingWithCompany[] = rawBookings.map((b) => ({
                    id: b.id,
                    client_id: b.client_id,
                    company_id: b.company_id,
                    service_title: b.service_title,
                    service_price: b.service_price,
                    booking_date: b.booking_date,
                    booking_time: b.booking_time,
                    status: b.status,
                    // UI Extensions
                    companyName: b.companies?.company_name || 'Empresa Desconhecida',
                    serviceName: b.service_title,
                    price: b.service_price || 0,
                    date: b.booking_date,
                    time: b.booking_time,
                    // Proposal
                    proposed_date: b.proposed_date,
                    proposed_time: (b as any).proposed_time,
                    proposal_expires_at: b.proposal_expires_at,
                    // Linking
                    order_id: (b as any).order_id
                }));

                // Transform Quotes Data to blend perfectly with Bookings 
                const rawQuotes = (quotesResponse.data || []) as any[];
                const mappedQuotes: BookingWithCompany[] = rawQuotes.map((q) => {
                    let mappedStatus = q.status; // pending, answered, rejected, accepted
                    if (q.status === 'pending') mappedStatus = 'pending_quote';
                    if (q.status === 'answered') mappedStatus = 'answered_quote';

                    const companyData = q.services?.companies;
                    return {
                        id: q.id,
                        is_quote: true,
                        client_id: q.user_id,
                        company_id: companyData?.id || '',
                        service_title: q.services?.title || 'Serviço Personalizado',
                        service_price: q.budget_expectation || 0,
                        booking_date: q.created_at, // use created at to sort and display cleanly
                        booking_time: 'A Combinar',
                        status: mappedStatus as any, // 'pending_quote' | 'answered_quote' | etc
                        companyName: companyData?.company_name || 'Empresa',
                        serviceName: q.services?.title || 'Orçamento',
                        price: q.budget_expectation || 0,
                        date: q.created_at,
                        time: 'A Combinar',
                        order_id: q.order_id
                    };
                });

                const bookings = [...mappedBookings, ...mappedQuotes].sort((a, b) => {
                    return new Date((b as any).created_at || b.date).getTime() - new Date((a as any).created_at || a.date).getTime();
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
