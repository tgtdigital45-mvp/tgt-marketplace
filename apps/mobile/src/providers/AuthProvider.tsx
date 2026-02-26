import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

type UserProfile = {
    id: string;
    full_name: string;
    email: string;
    type: 'client' | 'company' | 'admin' | 'moderator';
    avatar_url?: string;
    company_slug?: string;
    company_id?: string;
    stripe_charges_enabled?: boolean;
};

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*, companies(id, slug, stripe_charges_enabled)')
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (data) {
                const mappedProfile: UserProfile = {
                    id: data.id,
                    full_name: data.full_name,
                    email: data.email,
                    type: data.type,
                    avatar_url: data.avatar_url,
                    company_slug: data.companies?.[0]?.slug,
                    company_id: data.companies?.[0]?.id,
                    stripe_charges_enabled: data.companies?.[0]?.stripe_charges_enabled
                };
                setProfile(mappedProfile);
            }
        } catch (error) {
            console.error("[AuthProvider] Error fetching profile:", error);
            setProfile(null);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            setSession(initialSession);
            setUser(initialSession?.user ?? null);
            if (initialSession?.user) {
                fetchProfile(initialSession.user.id).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        // Listen to auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            if (newSession?.user) {
                await fetchProfile(newSession.user.id);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
