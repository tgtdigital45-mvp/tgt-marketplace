import { useQuery } from '@tanstack/react-query';
import { supabase } from '@tgt/core';
import type { DbService } from '@tgt/core';

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

    // Use dynamic import for h3-js to avoid Metro loading it eagerly at startup.
    // h3-js uses TextDecoder with 'utf-16le' encoding which Expo does not support.
    // By lazy-importing, we only pay the cost if the user has location access.
    if (lat && lng) {
        try {
            const h3 = await import('h3-js');
            const centerCell = h3.latLngToCell(lat, lng, 8);
            const searchCells = h3.gridDisk(centerCell, 12);
            query = query.in('h3_index', searchCells);
        } catch (h3Error) {
            // h3-js not available or unsupported encoding — skip geo filter gracefully
            console.warn('[useServices] h3-js unavailable, skipping geo filter:', h3Error);
        }
    }

    const { data, error } = await query;

    if (error) throw error;

    // Helper to safely decode h3 cell center (may fail if h3-js unavailable)
    const safeH3Center = (h3Index: string): [number, number] | null => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const h3 = require('h3-js');
            return h3.cellToLatLng(h3Index);
        } catch {
            return null;
        }
    };

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
        latitude: row.h3_index ? safeH3Center(row.h3_index)?.[0] : undefined,
        longitude: row.h3_index ? safeH3Center(row.h3_index)?.[1] : undefined,
    }));
}

export function useServices(search?: string, lat?: number, lng?: number) {
    return useQuery<ServiceListItem[]>({
        queryKey: ['services', search, lat, lng],
        queryFn: () => fetchServices(search, lat, lng),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
