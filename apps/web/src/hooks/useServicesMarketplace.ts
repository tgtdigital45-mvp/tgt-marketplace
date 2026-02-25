import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@tgt/shared';
import { DbService } from '@tgt/shared';
import { getH3SearchIndexes } from '@/utils/h3Utils';

export type ServiceFilter = 'all' | 'remote' | 'presential' | 'hybrid';

interface UseServicesMarketplaceOptions {
    category?: string;
    searchQuery?: string;
    serviceFilter?: ServiceFilter;
    limit?: number;
}

interface UseServicesMarketplaceReturn {
    services: DbService[];
    loading: boolean;
    error: string | null;
    hasLocation: boolean;
    locationLoading: boolean;
    totalCount: number;
    refetch: () => void;
}

/**
 * Hook for the Service-First marketplace vitrine.
 *
 * Strategy (with fallback):
 * 1. Try RPCs (get_remote_services / get_nearby_services)
 * 2. If RPCs fail or return empty → fallback to direct table query
 * 3. Merge, deduplicate, sort by rating
 */
export function useServicesMarketplace({
    category,
    searchQuery,
    serviceFilter = 'all',
    limit = 50,
}: UseServicesMarketplaceOptions = {}): UseServicesMarketplaceReturn {
    const [services, setServices] = useState<DbService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasLocation, setHasLocation] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [h3Indexes, setH3Indexes] = useState<string[] | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    // Fetch user's H3 indexes once on mount
    useEffect(() => {
        const fetchLocation = async () => {
            setLocationLoading(true);
            const indexes = await getH3SearchIndexes(2, 8);
            setH3Indexes(indexes);
            setHasLocation(indexes !== null);
            setLocationLoading(false);
        };
        fetchLocation();
    }, []);

    /**
     * Fallback: direct table query when RPCs fail or return empty
     */
    const fetchDirectFromTable = useCallback(async (): Promise<DbService[]> => {
        let query = supabase
            .from('services')
            .select(`
                *,
                companies!inner (
                    company_name,
                    logo_url,
                    rating,
                    slug,
                    status
                )
            `, { count: 'exact' })
            .eq('is_active', true)
            .is('deleted_at', null); // Soft Delete Filter

        // Service type filter
        if (serviceFilter === 'remote') {
            query = query.in('service_type', ['remote', 'hybrid']);
        } else if (serviceFilter === 'presential') {
            query = query.in('service_type', ['presential', 'hybrid']);
            // Apply H3 location filter if available
            if (h3Indexes && h3Indexes.length > 0) {
                query = query.in('h3_index', h3Indexes);
            }
        } else {
            // all
            if (h3Indexes && h3Indexes.length > 0) {
                // If they want 'all' services, we should still prioritize nearby ones if they have location
                // But for pure exact match, we might want to fetch everything or just remote + nearby presential
                // For simplicity, we just fetch all without location restriction, relying on the sorting later
            }
        }

        // Category filter
        if (category) {
            query = query.eq('category_tag', category);
        }

        // Search filter
        if (searchQuery) {
            query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category_tag.ilike.%${searchQuery}%`);
        }

        query = query.order('created_at', { ascending: false }).limit(limit);

        const { data, error: queryError, count } = await query;
        if (queryError) throw queryError;

        if (count !== null && count !== undefined) {
            setTotalCount(count);
        }

        return (data || []).map((s: any) => ({
            ...s,
            company_name: s.companies?.company_name,
            company_logo: s.companies?.logo_url,
            company_rating: s.companies?.rating,
            company_slug: s.companies?.slug,
        }));
    }, [category, searchQuery, serviceFilter, limit]);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            let results: DbService[] = [];
            let rpcWorked = false;

            const shouldFetchRemote =
                serviceFilter === 'all' || serviceFilter === 'remote' || serviceFilter === 'hybrid';

            const shouldFetchPresential =
                (serviceFilter === 'all' || serviceFilter === 'presential') && h3Indexes !== null;

            // Try RPCs first
            try {
                if (shouldFetchRemote) {
                    const { data, error: rpcError } = await supabase.rpc('get_remote_services', {
                        p_category: category || null,
                        p_search: searchQuery || null,
                        p_limit: limit,
                        p_offset: 0,
                    });

                    if (!rpcError && data && data.length > 0) {
                        results.push(...(data as DbService[]));
                        rpcWorked = true;
                    }
                }

                if (shouldFetchPresential && h3Indexes) {
                    const { data, error: rpcError } = await supabase.rpc('get_nearby_services', {
                        p_h3_indexes: h3Indexes,
                        p_category: category || null,
                        p_limit: limit,
                        p_offset: 0,
                    });

                    if (!rpcError && data && data.length > 0) {
                        results.push(...(data as DbService[]));
                        rpcWorked = true;
                    }
                }
            } catch {
                // RPCs not available — will use fallback
                console.warn('[useServicesMarketplace] RPCs unavailable, using direct query');
            }

            // Fallback: if RPCs didn't work or returned few results, query directly
            if (!rpcWorked || results.length < 3) {
                console.log('[useServicesMarketplace] Using direct table query fallback');
                const directResults = await fetchDirectFromTable();
                results.push(...directResults);
            }

            // Deduplicate by id
            const seen = new Set<string>();
            const unique = results.filter((s) => {
                if (seen.has(s.id)) return false;
                seen.add(s.id);
                return true;
            });

            // Sort: by company rating desc, then by title
            unique.sort((a, b) => {
                const ratingDiff = (b.company_rating ?? 0) - (a.company_rating ?? 0);
                if (ratingDiff !== 0) return ratingDiff;
                return a.title.localeCompare(b.title);
            });

            if (totalCount === 0) {
                setTotalCount(unique.length);
            }

            setServices(unique);
        } catch (err: any) {
            console.error('[useServicesMarketplace] Error:', err);
            setError(err.message || 'Erro ao carregar serviços');
        } finally {
            setLoading(false);
        }
    }, [category, searchQuery, serviceFilter, h3Indexes, limit, fetchDirectFromTable]);

    // Refetch when filters or location changes
    useEffect(() => {
        if (locationLoading) return;
        fetchServices();
    }, [fetchServices, locationLoading]);

    return {
        services,
        loading,
        error,
        hasLocation,
        locationLoading,
        totalCount,
        refetch: fetchServices,
    };
}
