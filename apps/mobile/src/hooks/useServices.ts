import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DbService } from '@tgt/shared';
import { cellToLatLng, latLngToCell, gridDisk } from 'h3-js';

export interface ServiceListItem {
    id: string;
    title: string;
    description: string;
    price: number;
    starting_price?: number;
    image_url?: string;
    category_tag?: string;
    rating?: number;
    company_name?: string;
    company_logo?: string;
    company_slug?: string;
    h3_index?: string;
    latitude?: number;
    longitude?: number;
}

async function fetchServices(search?: string, lat?: number, lng?: number): Promise<ServiceListItem[]> {
    let query = supabase
        .from('services')
        .select(`
      id,
      title,
      description,
      price,
      starting_price,
      image_url,
      category_tag,
      h3_index,
      companies (
        company_name,
        logo_url,
        slug,
        rating
      )
    `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(100);

    if (search && search.length >= 2) {
        query = query.ilike('title', `%${search}%`);
    }

    if (lat && lng) {
        // H3 Resolution 8 was used as default urban resolution.
        // A kRing of 12 covers roughly 6-10km radius depending on distortion.
        const centerCell = latLngToCell(lat, lng, 8);
        const searchCells = gridDisk(centerCell, 12);
        query = query.in('h3_index', searchCells);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        price: row.price,
        starting_price: row.starting_price,
        image_url: row.image_url,
        category_tag: row.category_tag,
        company_name: row.companies?.company_name ?? 'Profissional',
        company_logo: row.companies?.logo_url,
        company_slug: row.companies?.slug,
        rating: row.companies?.rating ?? 0,
        h3_index: row.h3_index,
        latitude: row.h3_index ? cellToLatLng(row.h3_index)[0] : undefined,
        longitude: row.h3_index ? cellToLatLng(row.h3_index)[1] : undefined,
    }));
}

export function useServices(search?: string, lat?: number, lng?: number) {
    return useQuery<ServiceListItem[]>({
        queryKey: ['services', search, lat, lng],
        queryFn: () => fetchServices(search, lat, lng),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
