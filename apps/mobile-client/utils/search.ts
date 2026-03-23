import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { logger } from '../utils/logger';

const RECENT_SEARCHES_KEY = 'contratto_recent_searches';
const MAX_RECENT_SEARCHES = 10;

// ─── Tipos ───
export type ServiceSearchResult = {
    id: string;
    title: string;
    description: string | null;
    price: number;
    requires_quote: boolean;
    company: {
        id: string;
        company_name: string;
        logo_url: string | null;
        cover_image_url: string | null;
        city: string | null;
        rating?: number;
    };
};

export type SearchResult = {
    id: string;
    company_name: string;
    description: string | null;
    logo_url: string | null;
    cover_image_url: string | null;
    city: string | null;
    state: string | null;
    rating?: number;
    rank?: number;
};

export type SearchFilters = {
    categoryId?: string | null;
    city?: string | null;
    limit?: number;
};

// ─── Busca de Serviços (para a Home) ───
export async function searchServices(
    term: string = '',
    limit: number = 20
): Promise<ServiceSearchResult[]> {
    try {
        let query = supabase
            .from('services')
            .select(`
                id, title, description, price, requires_quote,
                company:companies (
                    id, company_name, logo_url, cover_image_url, city
                )
            `);

        if (term.trim()) {
            query = query.ilike('title', `%${term.trim()}%`);
        }

        const { data, error } = await query.limit(limit);

        if (error) throw error;
        return (data as any[]) || [];
    } catch (e) {
        logger.error('Error searching services:', e);
        return [];
    }
}

// ─── Busca Full-Text via RPC (usa tsvector + GIN) ───
export async function searchCompanies(
    term: string,
    filters: SearchFilters = {}
): Promise<SearchResult[]> {
    const { categoryId, city, limit = 20 } = filters;

    // Se o termo é curto, usa ILIKE simples (melhor para 1-2 chars)
    if (term.trim().length < 3) {
        return searchCompaniesSimple(term, filters);
    }

    try {
        const { data, error } = await supabase.rpc('search_companies', {
            search_term: term.trim(),
            category_filter: categoryId || null,
            city_filter: city || null,
            result_limit: limit,
        });

        if (error) {
            logger.error('FTS search error, falling back to simple:', error);
            return searchCompaniesSimple(term, filters);
        }

        return (data as SearchResult[]) || [];
    } catch (e) {
        logger.error('Search error:', e);
        return searchCompaniesSimple(term, filters);
    }
}

// ─── Busca simples com ILIKE (fallback) ───
async function searchCompaniesSimple(
    term: string,
    filters: SearchFilters = {}
): Promise<SearchResult[]> {
    const { categoryId, limit = 20 } = filters;

    let query = supabase
        .from('companies')
        .select(`
            id, company_name, description, logo_url, cover_image_url, city, state,
            services(category_tag)
        `)
        .ilike('company_name', `%${term.trim()}%`);

    if (categoryId) {
        query = query.eq('services.category_tag', categoryId);
    }

    const { data, error } = await query.limit(limit);

    if (error) {
        logger.error('Simple search error:', error);
        return [];
    }

    // Deduplica (inner join pode gerar duplicatas)
    const seen = new Set<string>();
    return ((data as any[]) || []).filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    }) as SearchResult[];
}

// ─── Buscas Recentes (AsyncStorage) ───
export async function getRecentSearches(): Promise<string[]> {
    try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export async function addRecentSearch(term: string): Promise<void> {
    if (!term.trim()) return;

    try {
        const recent = await getRecentSearches();
        // Remove duplicata se já existir
        const filtered = recent.filter(s => s.toLowerCase() !== term.trim().toLowerCase());
        // Adiciona no início
        const updated = [term.trim(), ...filtered].slice(0, MAX_RECENT_SEARCHES);
        await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
        logger.error('Error saving recent search:', e);
    }
}

export async function removeRecentSearch(term: string): Promise<void> {
    try {
        const recent = await getRecentSearches();
        const updated = recent.filter(s => s !== term);
        await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
        logger.error('Error removing recent search:', e);
    }
}

export async function clearRecentSearches(): Promise<void> {
    try {
        await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
        logger.error('Error clearing recent searches:', e);
    }
}
