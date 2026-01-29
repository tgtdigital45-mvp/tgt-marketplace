import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
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

    const fetchCompany = async () => {
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
                .single();

            if (error) {
                console.error('Error fetching company:', error);
                setCompany(null);
            } else {
                // Map flat DB fields to nested Address object
                // Note: The actual DB columns for address might be different based on SQL output:
                // address, city, state are separate columns in the DB based on SQL inspection.
                // We'll map them to the Address interface.
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
                    // company_name and cover_image_url are already in data with correct keys
                    address: addressData,
                };
                setCompany(mappedCompany);
            }
        } catch (err) {
            console.error('Error in fetchCompany:', err);
            setCompany(null);
        } finally {
            setLoading(false);
        }
    };

    const refreshCompany = async () => {
        setLoading(true);
        await fetchCompany();
    };

    const updateCompany = async (data: Partial<CompanyData>) => {
        if (!company) return;

        try {
            const updatePayload: any = { ...data };

            // If we are updating address, we need to construct the JSON object
            // For now, we only update specific top-level fields passed in `data`
            // If `data.address` is passed, we might need to merge it or replace it.
            // But usually this method is called with partial flat data updates or full object.

            // If data has address proper, use it.
            // But we must ensure we don't send 'address' as an object if we want to update specific subfields? 
            // No, Supabase updates JSONB by replacing it usually, or we use jsonb_set.
            // Simplified: If address is present, send it as is.

            // Remove derived/frontend-only fields that might be in `data` if it was a full object copy
            // e.g. potentially any extra props.

            // Fix field mapping if ANY legacy code calls this
            // But we should use correct column names.

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
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

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
