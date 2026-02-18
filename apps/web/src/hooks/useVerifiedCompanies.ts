import { useQuery } from '@tanstack/react-query';
import { supabase } from '@tgt/shared';
import { Company, DbCompany } from '@tgt/shared';

interface UseVerifiedCompaniesOptions {
    category?: string;
    limit?: number;
    enabled?: boolean;
}

export const useVerifiedCompanies = ({ category, limit = 12, enabled = true }: UseVerifiedCompaniesOptions = {}) => {
    return useQuery({
        queryKey: ['verified-companies', category, limit],
        queryFn: async () => {
            let query = supabase
                .from('companies')
                .select('id, company_name, slug, logo_url, cover_image_url, category, address, rating, review_count, services, status, verified')
                .eq('status', 'approved')
                .range(0, limit - 1);

            if (category && category !== 'all') {
                query = query.eq('category', category);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching verified companies:', error);
                throw error;
            }

            // Map DB snake_case to frontend camelCase
            return data?.map((item: DbCompany) => ({
                id: item.id,
                slug: item.slug,
                companyName: item.company_name,
                logo: item.logo_url,
                coverImage: item.cover_image_url,
                category: item.category,
                rating: item.rating || 0,
                reviewCount: item.review_count || 0,
                address: item.address || {},
                services: item.services || [],
                description: item.description || '',
                // Add default values for missing fields
                legalName: '',
                cnpj: '',
                email: '',
                portfolio: [],
                reviews: []
            })) as Company[];
        },
        enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
