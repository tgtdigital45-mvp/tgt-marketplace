import { useQuery } from '@tanstack/react-query';
import { supabase } from '@tgt/shared';
import { Company, DbCompany, DbProfile } from '@tgt/shared';

export const useCompanyProfile = (slug: string | undefined) => {
    return useQuery({
        queryKey: ['company', slug],
        queryFn: async (): Promise<Company | null> => {
            if (!slug) return null;

            // 1. Single Fetch with Joins
            // We explicitly select fields to ensure we get everything needed to construct the UI object.
            // Note: We use !inner on companies to ensure it exists, but left joins for related data.
            const { data, error } = await supabase
                .from('companies')
                .select(`
          *,
          services (*),

          reviews (
            *,
            profiles:client_id (
              full_name,
              avatar_url
            )
          ),
          portfolio_items (*)
        `)
                .eq('slug', slug)
                .is('services.deleted_at', null)
                .single();

            if (error) throw error;
            if (!data) return null;

            // Type assertion to include the joined profile data
            // We define a local type that includes the relations we joined
            type DbCompanyJoined = DbCompany & {
                services: any[];
                reviews: (any & { profiles: DbProfile })[];
                portfolio_items: any[];
            };

            const raw = data as unknown as DbCompanyJoined;

            // 2. Data Transformation (DB -> UI)

            // Calculate ratings
            // The 'reviews' from the join will be an array of DbReview objects. 
            // We need to map them to the UI Review interface.
            const reviews = (raw.reviews || []).map(r => ({
                id: r.id,
                author: r.profiles?.full_name || 'Usuário',
                avatar: r.profiles?.avatar_url || 'https://i.pravatar.cc/150?u=default',
                rating: r.rating,
                comment: r.comment,
                date: new Date(r.created_at).toLocaleDateString('pt-BR')
            }));

            const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
            const avgRating = reviews.length > 0 ? (totalRating / reviews.length) : 0;

            // Map Services
            const services = (raw.services || []).map(s => ({
                id: s.id,
                title: s.title,
                description: s.description,
                price: s.price,
                starting_price: s.starting_price || s.price, // Map starting_price
                image: s.image_url || 'https://placehold.co/600x400',
                category: s.category_tag || raw.category,
                rating: raw.rating || 5,
                reviewCount: raw.review_count || 0,
                author: {
                    name: raw.company_name,
                    avatar: raw.logo_url
                },
                duration: s.duration,
                company_id: s.company_id,
                gallery: s.gallery
            }));

            // Map Portfolio (fixing image_url vs url mismatch if needed)
            const portfolio = (raw.portfolio_items || []).map(p => ({
                id: p.id,
                title: p.title,
                image_url: p.image_url,
                description: p.description || ''
            }));

            // Map Owner Profile & Fetch Stats
            let owner = undefined;
            let level: 'Iniciante' | 'Nível 1' | 'Pro' = 'Iniciante';

            if ((raw as any).owner_id) {
                const { data: stats } = await supabase
                    .from('seller_stats')
                    .select('current_level')
                    .eq('seller_id', (raw as any).owner_id)
                    .single();

                if (stats && stats.current_level) {
                    // Map backend levels to UI levels
                    const levelMap: Record<string, 'Iniciante' | 'Nível 1' | 'Pro'> = {
                        'Beginner': 'Iniciante',
                        'Level 1': 'Nível 1',
                        'Level 2': 'Pro', // Mapping Level 2 to Pro for simpler UI
                        'Pro': 'Pro'
                    };
                    level = levelMap[stats.current_level] || 'Iniciante';
                }
            }

            // Construct Final Object
            const company: Company = {
                id: raw.id,
                profileId: raw.profile_id,
                slug: raw.slug,
                companyName: raw.company_name,
                legalName: raw.legal_name,
                cnpj: raw.cnpj,
                logo: raw.logo_url || 'https://placehold.co/150',
                coverImage: raw.cover_image_url || 'https://placehold.co/1200x400',
                category: raw.category,
                level: level as 'Iniciante' | 'Nível 1' | 'Pro',

                rating: parseFloat(avgRating.toFixed(1)),
                reviewCount: reviews.length,
                description: raw.description || '',
                verified: raw.verified || false,
                location: raw.city && raw.state ? `${raw.city}, ${raw.state}` : '',
                memberSince: raw.created_at ? new Date(raw.created_at).toLocaleDateString('pt-BR') : '',
                responseTime: '1 hora', // Default value

                address: {
                    street: raw.address?.street || '',
                    number: raw.address?.number || '',
                    district: raw.address?.district || '',
                    city: raw.address?.city || '',
                    state: raw.address?.state || '',
                    cep: raw.address?.cep || '',
                    lat: raw.address?.lat || -23.55052,
                    lng: raw.address?.lng || -46.63330
                },

                phone: raw.phone,
                email: raw.email,
                website: raw.website || undefined,

                services: services,
                portfolio: portfolio,
                reviews: reviews,
                owner: owner
            };

            return company;
        },
        enabled: !!slug,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
        refetchOnMount: true, // Garante dados frescos ao entrar na página
        retry: 1
    });
};
