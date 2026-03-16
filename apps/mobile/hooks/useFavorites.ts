import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

type UseFavoritesResult = {
    favoriteIds: Set<string>;
    isLoading: boolean;
    toggle: (companyId: string) => Promise<void>;
};

export function useFavorites(userId: string | undefined): UseFavoritesResult {
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    const fetchFavorites = useCallback(async () => {
        if (!userId) return;

        setIsLoading(true);
        const { data } = await supabase
            .from('favorite_companies')
            .select('company_id')
            .eq('client_id', userId);

        if (data) {
            setFavoriteIds(new Set(data.map((f: any) => f.company_id)));
        }
        setIsLoading(false);
    }, [userId]);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const toggle = useCallback(async (companyId: string) => {
        if (!userId) return;

        const isFavorited = favoriteIds.has(companyId);

        // Otimistic update
        setFavoriteIds(prev => {
            const next = new Set(prev);
            if (isFavorited) next.delete(companyId);
            else next.add(companyId);
            return next;
        });

        if (isFavorited) {
            await supabase
                .from('favorite_companies')
                .delete()
                .eq('client_id', userId)
                .eq('company_id', companyId);
        } else {
            await supabase
                .from('favorite_companies')
                .insert({ client_id: userId, company_id: companyId });
        }
    }, [userId, favoriteIds]);

    return { favoriteIds, isLoading, toggle };
}
