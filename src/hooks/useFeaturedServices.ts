import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Service } from '../types';

export const useFeaturedServices = () => {
    return useQuery({
        queryKey: ['featured-services'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('services')
                .select(`
                  *,
                  companies (
                    id,
                    slug,
                    company_name,
                    logo_url,
                    rating,
                    review_count,
                    level,
                    verified
                  )
                `)
                .order('created_at', { ascending: false })
                .limit(6);

            if (error) throw error;

            return data as Service[];
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
};
