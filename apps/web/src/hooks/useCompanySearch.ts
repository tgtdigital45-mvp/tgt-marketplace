import { useState, useEffect, useMemo } from 'react';
import { deduplicateCompanies } from '@/utils/companyUtils';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@tgt/core';
import { calculateDistance } from '@/utils/geo';
import { Company } from '@tgt/core';

export const useCompanySearch = (itemsPerPage: number = 8) => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Getters from URL
    const searchTerm = searchParams.get('q') || '';
    const locationTerm = searchParams.get('loc') || '';
    const selectedCategory = searchParams.get('cat') || 'all';
    const sortBy = searchParams.get('sort') || 'rating';
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    // Price range is a bit special as it might strictly be client-side filtered in this architecture
    // but we should still persist it.
    const priceRange = (searchParams.get('price') as 'all' | 'low' | 'mid' | 'high') || 'all';

    // Lat/Lng for distance sorting
    const userCoords = useMemo(() => {
        const lat = parseFloat(searchParams.get('lat') || '');
        const lng = parseFloat(searchParams.get('lng') || '');
        return (!isNaN(lat) && !isNaN(lng)) ? { lat, lng } : null;
    }, [searchParams]);

    // Setters that update URL
    const updateParams = (newParams: Record<string, string | null>) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            Object.entries(newParams).forEach(([key, value]) => {
                if (value === null || value === '' || value === 'all') {
                    next.delete(key);
                } else {
                    next.set(key, value);
                }
            });
            // Reset to page 1 on filter change unless page is explicitly set
            if (!newParams.page && newParams.page !== null) {
                // But wait, if we are just changing page, we don't want to reset it.
                // The caller handles logic.
            }
            return next;
        }, { replace: true });
    };

    const setSearchTerm = (term: string) => updateParams({ q: term, page: '1' });
    const setLocationTerm = (term: string) => updateParams({ loc: term, page: '1' });
    const setSelectedCategory = (cat: string) => updateParams({ cat, page: '1' });
    const setPriceRangeValue = (price: 'all' | 'low' | 'mid' | 'high') => updateParams({ price, page: '1' });
    const setSortBy = (sort: string) => updateParams({ sort, page: '1' });
    const setCurrentPage = (page: number) => updateParams({ page: page.toString() });

    const setUserCoords = (coords: { lat: number, lng: number } | null) => {
        if (coords) {
            updateParams({ lat: coords.lat.toString(), lng: coords.lng.toString() });
        } else {
            updateParams({ lat: null, lng: null });
        }
    };

    // Query Key based on ALL filters
    const queryKey = ['companies', currentPage, searchTerm, locationTerm, selectedCategory, sortBy, priceRange, userCoords];

    const { data, isLoading: loading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            const from = (currentPage - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            // Base query - Using the secure public view
            let queryData: any[] = [];
            let totalCount = 0;

            const isSemanticSearch = searchTerm && searchTerm.split(' ').length > 2;

            if (isSemanticSearch) {
                try {
                    // 1. Get embedding from Edge Function
                    const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
                        body: { input: searchTerm }
                    });

                    if (!embeddingError && embeddingData?.embedding) {
                        // 2. Call the match_companies RPC
                        const { data: matchData, error: matchError } = await supabase.rpc('match_companies', {
                            query_embedding: embeddingData.embedding,
                            match_threshold: 0.3, // Reduzido para ser mais permissivo na busca semântica
                            match_count: itemsPerPage,
                            filter_category: selectedCategory === 'all' ? null : selectedCategory,
                            filter_city: locationTerm || null
                        });

                        if (!matchError && matchData) {
                            queryData = matchData;
                            totalCount = matchData.length;
                        }
                    }
                } catch (err) {
                    console.error('Semantic search error, falling back to text search:', err);
                }
            }

            // Fallback to standard TST search if AI search fails or isn't needed
            if (!queryData.length) {
                let companyIds: string[] | null = null;
                
                if (searchTerm) {
                    const cleanTerm = searchTerm.trim();
                    // 1. Search in companies
                    const { data: cData } = await supabase
                        .from('public_company_profiles')
                        .select('id')
                        .or(`company_name.ilike.%${cleanTerm}%,description.ilike.%${cleanTerm}%`);
                        
                    // 2. Search in services
                    const { data: sData } = await supabase
                        .from('services')
                        .select('company_id')
                        .or(`title.ilike.%${cleanTerm}%,description.ilike.%${cleanTerm}%,category_tag.ilike.%${cleanTerm}%`)
                        .eq('is_active', true);
                        
                    const setIds = new Set([
                        ...(cData?.map((c: any) => c.id) || []),
                        ...(sData?.map((s: any) => s.company_id) || [])
                    ]);
                    
                    companyIds = Array.from(setIds);
                    
                    // Se não encontrou nenhuma empresa com o termo, retorna vazio imediatamente
                    if (companyIds.length === 0) {
                        return { companies: [], count: 0 };
                    }
                }

                let query = supabase
                    .from('public_company_profiles')
                    .select(`
                      *,
                      services (*)
                    `, { count: 'exact' });

                // 1. Filtro Texto (aplicando os IDs encontrados caso tenha tido busca por texto)
                if (searchTerm && companyIds) {
                    query = query.in('id', companyIds);
                }

                // 2. Location
                if (locationTerm) {
                    query = query.or(`city.ilike.%${locationTerm}%,state.ilike.%${locationTerm}%`);
                }

                // 3. Category
                if (selectedCategory !== 'all') {
                    query = query.eq('category', selectedCategory);
                }

                // 4. Filtro de Preço Server-Side (antes da paginação)
                // Buscamos os IDs das empresas que têm serviços na faixa desejada,
                // exatamente como fazemos com o filtro de texto.
                if (priceRange !== 'all') {
                    const priceFilters: Record<string, { min?: number; max?: number }> = {
                        low:  { max: 100 },
                        mid:  { min: 100, max: 300 },
                        high: { min: 300 },
                    };
                    const { min, max } = priceFilters[priceRange];

                    let priceQuery = supabase
                        .from('services')
                        .select('company_id')
                        .eq('is_active', true);
                    if (min !== undefined) priceQuery = priceQuery.gte('price', min);
                    if (max !== undefined) priceQuery = priceQuery.lt('price', max);

                    const { data: priceData } = await priceQuery;
                    const priceIds: string[] = Array.from(
                        new Set((priceData || []).map((s: { company_id: string }) => s.company_id))
                    ).filter(Boolean) as string[];

                    if (priceIds.length === 0) {
                        return { companies: [], count: 0 };
                    }

                    // Intersecta com companyIds de texto (se existir)
                    if (companyIds) {
                        const intersect = priceIds.filter(id => companyIds!.includes(id));
                        if (intersect.length === 0) return { companies: [], count: 0 };
                        companyIds = intersect;
                    } else {
                        companyIds = priceIds;
                    }
                    query = query.in('id', companyIds);
                }

                // 5. Sorting (Server-side)
                if (sortBy === 'name') {
                    query = query.order('company_name', { ascending: true });
                } else if (sortBy === 'rating') {
                    // Ordenar por rating DESC — empresas sem rating vão para o final
                    query = query.order('rating', { ascending: false, nullsFirst: false });
                }

                // 6. Pagination
                query = query.range(from, to);

                const { data, count: supabaseCount, error } = await query;
                if (error) throw error;
                
                queryData = data || [];
                totalCount = supabaseCount || 0;
            }

            // Map to UI types
            let mappedCompanies: Company[] = queryData.map((c) => {
                let parsedAddress = {};
                try {
                    parsedAddress = typeof c.address === 'string' ? JSON.parse(c.address) : (c.address || {});
                } catch (e) {
                    console.warn('Failed to parse company address:', c.address);
                }

                return {
                    id: c.id,
                    profileId: c.profile_id || c.id,
                    slug: c.slug,
                    companyName: c.company_name,
                    legalName: c.legal_name,
                    cnpj: c.cnpj,
                    logo: c.logo_url || 'https://placehold.co/150',
                    coverImage: c.cover_image_url || 'https://placehold.co/1200x400',
                    category: c.category,
                    rating: c.rating || 5.0,
                    reviewCount: c.review_count || 0,
                    level: c.level || 'Bronze',
                    description: c.description || '',
                    address: parsedAddress as any, // Cast to any to avoid strict Address interface issues for now since we are mapping from DB
                    phone: c.phone || '',
                    email: c.email || '',
                    website: c.website || '',
                    services: c.services || [],
                    portfolio: [],
                    reviews: []
                };
            }) as Company[];

            // Price Filtering: agora feito server-side antes da paginação (ver acima).
            // O bloco de filtro client-side foi removido para evitar resultados truncados por página.

            // Calculate Distance
            if (userCoords) {
                mappedCompanies = mappedCompanies.map(c => {
                    if (c.address?.lat && c.address?.lng) {
                        return {
                            ...c,
                            distance: calculateDistance(userCoords.lat, userCoords.lng, c.address.lat, c.address.lng)
                        };
                    }
                    return c;
                });

                if (sortBy === 'distance') {
                    mappedCompanies.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
                }
            }

            return { companies: mappedCompanies, count: totalCount };
        },
        staleTime: 1000 * 60 * 60, // 1 hora - dados de empresas são relativamente estáticos
        gcTime: 1000 * 60 * 60 * 2, // 2 horas - garbage collection após 2h
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new (better UX)
    });

    return {
        companies: deduplicateCompanies(data?.companies || []),
        totalCount: data?.count || 0,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        locationTerm,
        setLocationTerm,
        selectedCategory,
        setSelectedCategory,
        priceRange,
        setPriceRangeValue,
        sortBy,
        setSortBy,
        currentPage,
        setCurrentPage,
        userCoords,
        setUserCoords
    };
};
