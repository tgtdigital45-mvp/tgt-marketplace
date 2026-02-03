import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Company, DbCompany, DbProfile } from '../types';

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
                .single();

            if (error) throw error;
            if (!data) return null;

            // Type assertion to include the joined profile data
            const raw = data as unknown as DbCompany;

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
                duration: s.duration,
                company_id: s.company_id,
                gallery: s.gallery
            }));

            // Map Portfolio (fixing image_url vs url mismatch if needed)
            const portfolio = (raw.portfolio_items || []).map(p => ({
                id: p.id,
                type: p.type,
                url: p.image_url,
                caption: p.caption || ''
            }));

            // Map Owner Profile
            const owner = undefined;

            // Construct Final Object
            const company: Company = {
                id: raw.id,
                slug: raw.slug,
                companyName: raw.company_name,
                legalName: raw.legal_name,
                cnpj: raw.cnpj,
                logo: raw.logo_url || 'https://placehold.co/150',
                coverImage: raw.cover_image_url || 'https://placehold.co/1200x400',
                category: raw.category,

                rating: parseFloat(avgRating.toFixed(1)),
                reviewCount: reviews.length,
                description: raw.description || '',

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
        retry: 1
    });
};
