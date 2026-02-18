import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { DbService } from '../types';
import { getH3SearchIndexes } from '../utils/h3Utils';

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
    refetch: () => void;
}

/**
 * Hook for the Service-First marketplace vitrine.
 *
 * Strategy:
 * - Remote/Hybrid services: fetched globally via get_remote_services RPC
 * - Presential services: fetched via get_nearby_services RPC using H3 neighbor indexes
 * - "All" filter: merges both results, deduplicating by id
 */
export function useServicesMarketplace({
    category,
    searchQuery,
    serviceFilter = 'all',
    limit = 20,
}: UseServicesMarketplaceOptions = {}): UseServicesMarketplaceReturn {
    const [services, setServices] = useState<DbService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasLocation, setHasLocation] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [h3Indexes, setH3Indexes] = useState<string[] | null>(null);

    // Fetch user's H3 indexes once on mount
    useEffect(() => {
        const fetchLocation = async () => {
            setLocationLoading(true);
            const indexes = await getH3SearchIndexes(2, 8); // k=2 rings, res=8 (~1.4km)
            setH3Indexes(indexes);
            setHasLocation(indexes !== null);
            setLocationLoading(false);
        };
        fetchLocation();
    }, []);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const results: DbService[] = [];

            const shouldFetchRemote =
                serviceFilter === 'all' || serviceFilter === 'remote' || serviceFilter === 'hybrid';

            const shouldFetchPresential =
                (serviceFilter === 'all' || serviceFilter === 'presential') && h3Indexes !== null;

            // Fetch remote/hybrid services
            if (shouldFetchRemote) {
                const { data, error: rpcError } = await supabase.rpc('get_remote_services', {
                    p_category: category || null,
                    p_search: searchQuery || null,
                    p_limit: limit,
                    p_offset: 0,
                });

                if (rpcError) throw rpcError;
                if (data) results.push(...(data as DbService[]));
            }

            // Fetch presential services (only if we have location)
            if (shouldFetchPresential && h3Indexes) {
                const { data, error: rpcError } = await supabase.rpc('get_nearby_services', {
                    p_h3_indexes: h3Indexes,
                    p_category: category || null,
                    p_limit: limit,
                    p_offset: 0,
                });

                if (rpcError) throw rpcError;
                if (data) results.push(...(data as DbService[]));
            }

            // Deduplicate by id (a hybrid service could appear in both queries)
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

            setServices(unique);
        } catch (err: any) {
            console.error('[useServicesMarketplace] Error:', err);
            setError(err.message || 'Erro ao carregar serviços');
        } finally {
            setLoading(false);
        }
    }, [category, searchQuery, serviceFilter, h3Indexes, limit]);

    // Refetch when filters or location changes
    useEffect(() => {
        // Don't fetch while location is still loading
        if (locationLoading) return;
        fetchServices();
    }, [fetchServices, locationLoading]);

    return {
        services,
        loading,
        error,
        hasLocation,
        locationLoading,
        refetch: fetchServices,
    };
}
