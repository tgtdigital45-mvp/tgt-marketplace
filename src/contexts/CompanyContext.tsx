import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
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
    const [company, setCompany] = useState<CompanyData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchCompany = useCallback(async () => {
        if (!user || user.type !== 'company') {
            setCompany(null);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('profile_id', user.id)
                .limit(1)
                .maybeSingle();

            if (error) {
                console.error('Error fetching company:', error);
                setCompany(null);
            } else {
                // Map flat DB fields to nested Address object
                const addressData: Address = {
                    street: data.address?.street || '',
                    city: data.address?.city || '',
                    state: data.address?.state || '',
                    cep: data.address?.cep || '',
                    number: data.address?.number || '',
                    district: data.address?.district || ''
                };

                const mappedCompany: CompanyData = {
                    ...data,
                    address: addressData,
                };
                setCompany(mappedCompany);
            }
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            const msg = err?.message || '';
            const isAbort = msg.includes('aborted') || msg.includes('AbortError') || err?.name === 'AbortError';

            if (isAbort) return;

            console.error('Error in fetchCompany:', err);
            setCompany(null);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const refreshCompany = async () => {
        setLoading(true);
        await fetchCompany();
    };

    const updateCompany = async (data: Partial<CompanyData>) => {
        // ... (existing update logic if needed, but we are only replacing the block from fetchCompany to useEffect end)
        if (!company) return;

        try {
            const updatePayload: Partial<CompanyData> = { ...data };
            const { error } = await supabase
                .from('companies')
                .update(updatePayload)
                .eq('id', company.id);

            if (error) {
                console.error('Error updating company:', error);
                throw error;
            }

            // Refresh company data after update
            await refreshCompany();
        } catch (err) {
            console.error('Error in updateCompany:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchCompany();

        // Set up real-time subscription for company changes
        if (user && user.type === 'company') {
            const subscription = supabase
                .channel('company-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'companies',
                        filter: `profile_id=eq.${user.id}`,
                    },
                    (payload) => {
                        console.log('Company data changed:', payload);
                        // For simplicity, just refresh to get clean mapping
                        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                            fetchCompany();
                        }
                    }
                )
                .subscribe();

            return () => {
                subscription.unsubscribe();
            };
        }
    }, [user, fetchCompany]); // Re-subscribe if user changes; fetchCompany update handled by useCallback

    return (
        <CompanyContext.Provider value={{ company, loading, refreshCompany, updateCompany }}>
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
