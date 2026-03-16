import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import type { Company } from '@tgt/core';;

type UseCompanyResult = {
    company: Company | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
};

export function useCompany(userId: string | undefined): UseCompanyResult {
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCompany = useCallback(async () => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
            .from('companies')
            .select('*')
            .eq('owner_id', userId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            setError(fetchError.message);
        }

        setCompany(data as Company | null);
        setIsLoading(false);
    }, [userId]);

    useEffect(() => {
        fetchCompany();
    }, [fetchCompany]);

    return { company, isLoading, error, refresh: fetchCompany };
}
