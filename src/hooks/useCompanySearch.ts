import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { calculateDistance } from '../utils/geo';
import { Company } from '../types';

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

            // Base query
            let query = supabase
                .from('companies')
                .select(`
                  *,
                  services!inner (*)
                `, { count: 'exact' });

            // 1. Text Search
            if (searchTerm) {
                query = query.or(`company_name.ilike.%${searchTerm}%,services.title.ilike.%${searchTerm}%`);
            }

            // 2. Location
            if (locationTerm) {
                query = query.or(`city.ilike.%${locationTerm}%,state.ilike.%${locationTerm}%`);
            }

            // 3. Category
            if (selectedCategory !== 'all') {
                query = query.eq('category', selectedCategory);
            }

            // 4. Sorting (Server-side)
            if (sortBy === 'name') {
                query = query.order('company_name', { ascending: true });
            } else if (sortBy === 'rating') {
                query = query.order('created_at', { ascending: false });
            }

            // 5. Pagination
            query = query.range(from, to);

            const { data, count, error } = await query;

            if (error) throw error;

            // Map to UI types
            let mappedCompanies: Company[] = (data || []).map((c) => ({
                id: c.id,
                slug: c.slug,
                companyName: c.company_name,
                legalName: c.legal_name,
                cnpj: c.cnpj,
                logo: c.logo_url || 'https://placehold.co/150',
                coverImage: c.cover_image_url || 'https://placehold.co/1200x400',
                category: c.category,
                rating: 5.0,
                reviewCount: 0,
                description: c.description,
                address: typeof c.address === 'string' ? JSON.parse(c.address) : c.address,
                phone: c.phone,
                email: c.email,
                website: c.website,
                services: c.services || [],
                portfolio: [],
                reviews: []
            }));

            // Price Filtering (Client Side)
            if (priceRange !== 'all') {
                mappedCompanies = mappedCompanies.filter(c => {
                    const minPrice = c.services.length > 0
                        ? Math.min(...c.services.map((s: any) => (typeof s === 'object' && s && 'price' in s ? Number(s.price) || 0 : 0)))
                        : 0;
                    if (priceRange === 'low') return minPrice < 100;
                    if (priceRange === 'mid') return minPrice >= 100 && minPrice < 300;
                    if (priceRange === 'high') return minPrice >= 300;
                    return true;
                });
            }

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

            return { companies: mappedCompanies, count: count || 0 };
        },
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new (better UX)
    });

    return {
        companies: data?.companies || [],
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
