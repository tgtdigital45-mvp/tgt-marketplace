import { useQuery } from '@tanstack/react-query';
import { supabase } from '@tgt/shared';
import { Company } from '@tgt/shared';

export const useFeaturedCompanies = () => {
    return useQuery({
        queryKey: ['featured-companies'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('companies')
                .select(`
                  *,
                  services(*)
                `)
                .order('created_at', { ascending: false })
                .limit(3);

            if (error) throw error;

            // Map to UI types logic (copied from useCompanySearch for consistency)
            const mappedCompanies: Company[] = (data || []).map((c) => ({
                id: c.id,
                slug: c.slug,
                companyName: c.company_name,
                legalName: c.legal_name,
                cnpj: c.cnpj,
                logo: c.logo_url || 'https://placehold.co/150',
                coverImage: c.cover_image_url || 'https://placehold.co/1200x400',
                category: c.category,
                rating: c.rating || 5.0,
                reviewCount: c.review_count || 0,
                description: c.description || '',
                address: typeof c.address === 'string' ? JSON.parse(c.address) : c.address || {},
                phone: c.phone,
                email: c.email,
                website: c.website || undefined,
                services: c.services || [],
                portfolio: [],
                reviews: []
            }));

            return mappedCompanies;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
