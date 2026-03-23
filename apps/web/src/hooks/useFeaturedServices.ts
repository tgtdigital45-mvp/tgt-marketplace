import { useQuery } from '@tanstack/react-query';
import { supabase } from '@tgt/core';
import { Service } from '@tgt/core';

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
        .is('deleted_at', null)
        .limit(6);

      if (error) throw error;

      return data as Service[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};
