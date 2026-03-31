import { useQuery } from '@tanstack/react-query';
import { supabase } from '@tgt/core';
import { Company, DbCompany, DbProfile } from '@tgt/core';

export const useCompanyProfile = (slug: string | undefined) => {
    return useQuery({
        queryKey: ['company', slug],
        queryFn: async (): Promise<Company | null> => {
            if (!slug) return null;

            // 1. Single Fetch with Joins from the Secure View
            // Note: Use public_companies view instead of companies table to avoid RLS restrictions on sensitive data
            const { data, error } = await supabase
                .from('companies')
                .select(`
                  id, profile_id, company_name, slug, description, logo_url, cover_image_url, 
                  category, status, city, state, address, phone, email, website, social_links,
                  verified, rating, created_at, legal_name, cnpj,
                  level, response_time, sales_count,
                  services (*),
                  reviews (
                    *,
                    profiles:reviewer_id (
                      full_name,
                      avatar_url
                    )
                  ),
                  portfolio_items (*),
                  company_projects (*)
                `)
                .eq('slug', slug)
                .single();

            if (error) throw error;
            if (!data) return null;

            // Type assertion to include the joined profile data
            // We define a local type that includes the relations we joined
            type DbCompanyJoined = DbCompany & {
                services: any[];
                reviews: (any & { profiles: DbProfile })[];
                portfolio_items: any[];
                company_projects: any[];
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

            // Map Services (filter out deleted or inactive ones first)
            const services = (raw.services || [])
                .filter(s => !s.deleted_at && s.is_active !== false)
                .map(s => ({
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

            const projects = (raw.company_projects || []).map(p => ({
                id: p.id,
                company_id: p.company_id,
                title: p.title,
                description: p.description,
                main_image_url: p.main_image_url,
                gallery_urls: p.gallery_urls || [],
                service_id: p.service_id,
                completion_date: p.completion_date,
                created_at: p.created_at
            }));

            // Use professional stats directly from company (migrated from profiles/seller_stats)
            const level = (raw.level || 'Iniciante') as 'Iniciante' | 'Nível 1' | 'Pro';
            const owner = undefined;

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
                level: (raw.level || 'Iniciante') as 'Iniciante' | 'Nível 1' | 'Pro',

                rating: parseFloat(avgRating.toFixed(1)),
                reviewCount: reviews.length,
                description: raw.description || '',
                verified: raw.verified || false,
                location: raw.city && raw.state ? `${raw.city}, ${raw.state}` : '',
                memberSince: raw.created_at ? new Date(raw.created_at).toLocaleDateString('pt-BR') : '',
                responseTime: raw.response_time || '1 hora', 

                address: {
                    street: raw.address?.street || '',
                    number: raw.address?.number || '',
                    district: raw.address?.district || '',
                    city: raw.address?.city || '',
                    state: raw.address?.state || '',
                    cep: raw.address?.cep || '',
                    lat: raw.address?.lat || (raw.address as any)?.latitude || undefined,
                    lng: raw.address?.lng || (raw.address as any)?.longitude || undefined
                },

                phone: raw.phone,
                email: raw.email,
                website: raw.website || undefined,
                social_links: (raw as any).social_links,

                services: services,
                portfolio: portfolio,
                projects: projects,
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
