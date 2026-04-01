import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@tgt/core';
import { DbService } from '@tgt/core';
import { getH3SearchIndexes } from '@/utils/h3Utils';
import { devLog, devWarn, logError } from '@/utils/logger';

export type ServiceFilter = 'all' | 'remote' | 'presential';

interface UseServicesMarketplaceOptions {
    category?: string;
    searchQuery?: string;
    serviceFilter?: ServiceFilter;
    limit?: number;
    useAI?: boolean; // Opção para forçar busca semântica
}

interface UseServicesMarketplaceReturn {
    services: DbService[];
    loading: boolean;
    error: string | null;
    hasLocation: boolean;
    locationLoading: boolean;
    totalCount: number;
    isAIPowered: boolean; // Indica se os resultados vieram de busca semântica
    refetch: () => void;
}

/**
 * Hook for the Service-First marketplace vitrine.
 *
 * Strategy (AI-Powered):
 * 1. If searchQuery exists, try Semantic Search (pgvector) first.
 * 2. Fallback/Combine with standard RPCs (get_remote_services / get_nearby_services)
 * 3. Final fallback to direct table query
 */
export function useServicesMarketplace({
    category,
    searchQuery,
    serviceFilter = 'all',
    limit = 50,
    useAI = true,
}: UseServicesMarketplaceOptions = {}): UseServicesMarketplaceReturn {
    const [services, setServices] = useState<DbService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasLocation, setHasLocation] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [h3Indexes, setH3Indexes] = useState<string[] | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [isAIPowered, setIsAIPowered] = useState(false);

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
     * Helper: Generate embedding for search query
     */
    const getQueryEmbedding = async (query: string): Promise<number[] | null> => {
        try {
            const { data, error: rpcError } = await supabase.functions.invoke('generate-embeddings', {
                body: { input: query }
            });

            if (rpcError) throw rpcError;
            return data.embedding;
        } catch (err) {
            devWarn('[useServicesMarketplace] Failed to generate query embedding:', err);
            return null;
        }
    };

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
                    cover_image_url,
                    rating,
                    slug,
                    status,
                    is_sponsored
                )
            `, { count: 'exact' })
            .eq('is_active', true)
            .in('companies.status', ['approved', 'active'])
            .is('deleted_at', null);

        if (serviceFilter === 'remote') {
            query = query.in('location_type', ['remote', 'hybrid']);
        } else if (serviceFilter === 'presential') {
            query = query.in('location_type', ['in_store', 'at_home', 'hybrid']);
            if (h3Indexes && h3Indexes.length > 0) {
                query = query.in('h3_index', h3Indexes);
            }
        }

        if (category) {
            query = query.eq('category_tag', category);
        }

        if (searchQuery) {
            query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category_tag.ilike.%${searchQuery}%`);
        }

        query = query.order('is_sponsored', { ascending: false });
        query = query.order('is_sponsored', { ascending: false, referencedTable: 'companies' });
        query = query.order('rating', { ascending: false, referencedTable: 'companies' });
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
            company_cover_url: s.companies?.cover_image_url,
            company_rating: s.companies?.rating,
            company_slug: s.companies?.slug,
            company_is_sponsored: s.companies?.is_sponsored,
        }));
    }, [category, searchQuery, serviceFilter, limit, h3Indexes]);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        setError(null);
        setIsAIPowered(false);

        try {
            let results: DbService[] = [];
            let semanticResultsFound = false;

            // 1. TRY SEMANTIC SEARCH (AI) if query is long enough
            if (useAI && searchQuery && searchQuery.trim().length > 3) {
                devLog('[useServicesMarketplace] Attemting Semantic Search...');
                const queryEmbedding = await getQueryEmbedding(searchQuery);
                
                if (queryEmbedding) {
                    const { data:语义Data, error: semanticError } = await supabase.rpc('match_services', {
                        query_embedding: queryEmbedding,
                        match_threshold: 0.35, // Ajustável
                        match_count: limit,
                        filter_category: category || null,
                        filter_type: serviceFilter
                    });

                    if (!semanticError && 语义Data && 语义Data.length > 0) {
                        devLog(`[useServicesMarketplace] Semantic Search found ${语义Data.length} results.`);
                        results.push(...语义Data);
                        semanticResultsFound = true;
                        setIsAIPowered(true);
                    } else if (semanticError) {
                        devWarn('[useServicesMarketplace] Semantic Search error:', semanticError);
                    }
                }
            }

            // 2. STANDARD RPCS (Fallback or Combine)
            let rpcWorked = false;
            if (results.length < limit) {
                const shouldFetchRemote = serviceFilter === 'all' || serviceFilter === 'remote';
                const shouldFetchPresential = (serviceFilter === 'all' || serviceFilter === 'presential') && h3Indexes !== null;

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
                            p_search: searchQuery || null,
                            p_limit: limit,
                            p_offset: 0,
                        });
                        if (!rpcError && data && data.length > 0) {
                            results.push(...(data as DbService[]));
                            rpcWorked = true;
                        }
                    }
                } catch (e) {
                    devWarn('[useServicesMarketplace] Standard RPCs failed:', e);
                }
            }

            // 3. DIRECT TABLE FALLBACK
            if (!semanticResultsFound && !rpcWorked && results.length === 0) {
                devLog('[useServicesMarketplace] Using direct table query fallback');
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

            // If not purely semantic, sort by sponsorship then rating
            if (!semanticResultsFound) {
                unique.sort((a, b) => {
                    // 1. Sponsored first
                    if (a.is_sponsored && !b.is_sponsored) return -1;
                    if (!a.is_sponsored && b.is_sponsored) return 1;
                    
                    // 2. Company sponsored next
                    if (a.company_is_sponsored && !b.company_is_sponsored) return -1;
                    if (!a.company_is_sponsored && b.company_is_sponsored) return 1;

                    // 3. Rating
                    const ratingDiff = (b.company_rating ?? 0) - (a.company_rating ?? 0);
                    if (ratingDiff !== 0) return ratingDiff;

                    // 4. Recency
                    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
                });
            }

            if (totalCount === 0 || unique.length > totalCount) {
                setTotalCount(unique.length);
            }

            setServices(unique);
        } catch (err: any) {
            logError('[useServicesMarketplace] Erro Crítico em fetchServices:', err);
            setError(err.message || 'Erro ao carregar serviços');
        } finally {
            setLoading(false);
        }
    }, [category, searchQuery, serviceFilter, h3Indexes, limit, fetchDirectFromTable, useAI]);

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
        isAIPowered,
        refetch: fetchServices,
    };
}
