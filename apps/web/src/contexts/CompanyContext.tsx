import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';

interface Address {
    street: string;
    number?: string;
    district?: string;
    city: string;
    state: string;
    cep: string;
}

export interface CompanyData {
    id: string;
    slug: string;
    company_name: string;
    legal_name: string;
    cnpj: string;
    logo_url: string | null;
    cover_image_url: string | null;
    category: string | null;
    description: string | null;
    address: Address;
    phone: string | null;
    email: string | null;
    website: string | null;
    status: string;
    profile_id: string;
    current_plan_tier?: 'starter' | 'pro' | 'agency';
    subscription_status?: string;
}

interface CompanyContextType {
    company: CompanyData | null;
    loading: boolean;
    refreshCompany: () => Promise<void>;
    updateCompany: (data: Partial<CompanyData>) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const isCompany = user?.type === 'company';
    const profileId = user?.id;

    // Use Query for fetching company data
    const {
        data: company,
        isLoading: loading,
        refetch
    } = useQuery({
        queryKey: ['company', profileId],
        queryFn: async ({ signal }) => {
            if (!profileId) return null;

            const fetchWithRetry = async (retryCount = 0): Promise<any> => {
                try {
                    const { data, error } = await supabase
                        .from('companies')
                        .select('*')
                        .eq('profile_id', profileId)
                        .limit(1)
                        .abortSignal(signal as AbortSignal); // Pass signal for correct unmount handling

                    if (error) {
                        if (error.message?.includes('AbortError') && retryCount < 2) {
                            console.log("[CompanyContext] Retrying aborted fetch...");
                            return fetchWithRetry(retryCount + 1);
                        }
                        throw error;
                    }
                    return data;
                } catch (err: any) {
                    if (err.message?.includes('AbortError') && retryCount < 2) {
                        return fetchWithRetry(retryCount + 1);
                    }
                    throw err;
                }
            };

            const data = await fetchWithRetry();

            if (!data || data.length === 0) {
                console.warn("[CompanyContext] No results for profile_id:", profileId);
                return null;
            }

            const companyRecord = data[0];

            // Map flat DB fields to nested Address object with robust fallback
            const rawAddress = typeof companyRecord.address === 'string' ? JSON.parse(companyRecord.address) : companyRecord.address;
            const addressData: Address = {
                street: rawAddress?.street || '',
                city: rawAddress?.city || '',
                state: rawAddress?.state || '',
                cep: rawAddress?.cep || '',
                number: rawAddress?.number || '',
                district: rawAddress?.district || ''
            };

            console.log("[CompanyContext] Successfully loaded company for slug:", companyRecord.slug);

            return {
                ...companyRecord,
                address: addressData,
            } as CompanyData;
        },
        enabled: !!profileId, // Fetch for any logged in user to robustly detect company
        staleTime: 1000 * 60 * 10, // 10 minutes (rarely changes)
    });

    // Mutation for updating company data
    const updateMutation = useMutation({
        mutationFn: async (data: Partial<CompanyData>) => {
            if (!company?.id) throw new Error("No company loaded");

            const { error } = await supabase
                .from('companies')
                .update(data)
                .eq('id', company.id);

            if (error) throw error;
        },
        onSuccess: () => {
            // Invalidate broadly to ensure Public Profile (referencing via slug) also updates
            queryClient.invalidateQueries({ queryKey: ['company'] });
        }
    });

    const updateCompany = async (data: Partial<CompanyData>) => {
        await updateMutation.mutateAsync(data);
    };

    const refreshCompany = async () => {
        await refetch();
    };

    useEffect(() => {
        // Realtime subscription for company record
        if (profileId) {
            console.log("[CompanyContext] Subscribing to Realtime for profile_id:", profileId);
            const subscription = supabase
                .channel(`company-changes-${profileId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'companies',
                        filter: `profile_id=eq.${profileId}`,
                    },
                    (payload) => {
                        console.log('[CompanyContext] Realtime Update Detected:', payload.eventType, payload.new);

                        // Invalidate query to force a refetch with full mapping logic
                        queryClient.invalidateQueries({ queryKey: ['company', profileId] });

                        // If it's a deletion, explicitly set company to null
                        if (payload.eventType === 'DELETE') {
                            queryClient.setQueryData(['company', profileId], null);
                        }
                    }
                )
                .subscribe((status) => {
                    console.log(`[CompanyContext] Realtime subscription status: ${status}`);
                });

            return () => {
                console.log("[CompanyContext] Unsubscribing from Realtime");
                subscription.unsubscribe();
            };
        }
    }, [profileId, queryClient]);

    return (
        <CompanyContext.Provider value={{
            company: company || null,
            loading,
            refreshCompany,
            updateCompany
        }}>
            {children}
        </CompanyContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (context === undefined) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
};
