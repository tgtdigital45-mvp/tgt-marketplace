import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Address {
    street: string;
    number?: string;
    district?: string;
    city: string;
    state: string;
    cep: string;
}

interface CompanyData {
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
        queryFn: async () => {
            if (!profileId || !isCompany) return null;

            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('profile_id', profileId)
                .limit(1);

            if (error) throw error;
            if (!data || data.length === 0) return null;

            const companyRecord = data[0];

            // Map flat DB fields to nested Address object
            const addressData: Address = {
                street: companyRecord.address?.street || '',
                city: companyRecord.address?.city || '',
                state: companyRecord.address?.state || '',
                cep: companyRecord.address?.cep || '',
                number: companyRecord.address?.number || '',
                district: companyRecord.address?.district || ''
            };

            return {
                ...companyRecord,
                address: addressData,
            } as CompanyData;
        },
        enabled: !!profileId && isCompany,
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
        // Real-time subscription
        if (profileId && isCompany) {
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
                        console.log('Company data changed via realtime:', payload);
                        queryClient.invalidateQueries({ queryKey: ['company'] });
                    }
                )
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [profileId, isCompany, queryClient]);

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
