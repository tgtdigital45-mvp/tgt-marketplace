import { useQuery } from '@tanstack/react-query';
import { supabase } from '@tgt/shared';
import { Company } from '@tgt/shared';

export const useSimilarCompanies = (category: string | undefined, currentId: string | undefined) => {
    return useQuery({
        queryKey: ['similar-companies', category, currentId],
        queryFn: async (): Promise<Company[]> => {
            if (!category || !currentId) return [];

            const { data: similarData, error: similarError } = await supabase
                .from('companies')
                .select('*, reviews(rating)')
                .eq('category', category)
                .neq('id', currentId)
                .limit(3);

            if (similarError) throw similarError;
            if (!similarData) return [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const constructedSimilar = similarData.map((comp: any) => {
                const compAddress = comp.address || {};
                const compReviews = comp.reviews || [];
                const totalRating = compReviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
                const avgRating = compReviews.length > 0 ? (totalRating / compReviews.length) : 0;

                return {
                    id: comp.id,
                    slug: comp.slug,
                    companyName: comp.company_name,
                    legalName: comp.legal_name,
                    cnpj: comp.cnpj,
                    logo: comp.logo_url || 'https://placehold.co/150',
                    coverImage: comp.cover_image_url || 'https://placehold.co/1200x400',
                    category: comp.category,
                    rating: parseFloat(avgRating.toFixed(1)),
                    reviewCount: compReviews.length,
                    description: comp.description || '',
                    address: {
                        street: compAddress.street || '',
                        number: compAddress.number || '',
                        district: compAddress.district || '',
                        city: compAddress.city || '',
                        state: compAddress.state || '',
                        cep: compAddress.cep || '',
                        lat: compAddress.lat || -23.55052,
                        lng: compAddress.lng || -46.63330
                    },
                    phone: comp.phone,
                    email: comp.email,
                    website: comp.website,
                    services: [],
                    portfolio: [],
                    reviews: []
                };
            });

            return constructedSimilar;
        },
        enabled: !!category && !!currentId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
