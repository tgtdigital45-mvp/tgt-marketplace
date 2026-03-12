import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { registerForPushNotificationsAsync, setupNotificationListeners, unregisterPushToken } from '../utils/pushNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DbProfile as Profile } from '@tgt/shared';
import { logger } from '../utils/logger';

export type { Profile };

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async (userId: string, retries = 3) => {
        try {
            for (let i = 0; i < retries; i++) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, user_type, role')
                    .eq('id', userId)
                    .single();

                if (data) return data;

                if (error && error.code !== 'PGRST116') {
                    logger.error('Error fetching profile:', error);
                    return null;
                }

                // Espera 1 segundo caso o trigger ainda esteja criando o profile
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            return null;
        } catch (error) {
            logger.error('Error in fetchProfile:', error);
            return null;
        }
    };

    const refreshProfile = async () => {
        if (user) {
            const data = await fetchProfile(user.id);
            if (data) {
                setProfile(data as Profile);
                AsyncStorage.setItem('@user_profile_cache', JSON.stringify(data));
            } else {
                setProfile(null);
            }
        }
    };

    useEffect(() => {
        let mounted = true;
        let initialCheckDone = false;

        async function initializeAuth() {
            try {
                logger.log('AuthContext: Iniciando inicialização de autenticação...');
                
                // 1. Tentar carregar perfil do cache para shell UI instantânea se possível
                const cachedProfileStr = await AsyncStorage.getItem('@user_profile_cache');
                if (cachedProfileStr && mounted) {
                    try {
                        const cached = JSON.parse(cachedProfileStr);
                        setProfile(cached);
                        logger.log('AuthContext: Perfil carregado do cache.');
                    } catch (e) {
                        logger.warn('AuthContext: Erro ao parsear cache do perfil.');
                    }
                }

                // 2. Buscar sessão real do Supabase
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (mounted) {
                    setSession(initialSession);
                    setUser(initialSession?.user ?? null);

                    if (initialSession?.user) {
                        logger.log('AuthContext: Sessão válida encontrada:', initialSession.user.id);
                        const profileData = await fetchProfile(initialSession.user.id);
                        if (mounted) {
                            if (profileData) {
                                setProfile(profileData as Profile);
                                AsyncStorage.setItem('@user_profile_cache', JSON.stringify(profileData));
                            } else {
                                logger.warn('AuthContext: Sessão ativa mas perfil não encontrado.');
                            }
                        }
                    } else {
                        logger.log('AuthContext: Nenhuma sessão ativa na inicialização.');
                        if (mounted) {
                            setProfile(null);
                            AsyncStorage.removeItem('@user_profile_cache');
                        }
                    }
                }
            } catch (error) {
                logger.error('AuthContext: Falha crítica na inicialização de auth:', error);
            } finally {
                if (mounted) {
                    initialCheckDone = true;
                    // Garantimos um pequeno respiro para que os estados de session/profile se propaguem 
                    // antes de sumir com a splash screen.
                    setTimeout(() => {
                        if (mounted) {
                            setIsLoading(false);
                            logger.log('AuthContext: Loading finalizado.');
                        }
                    }, 500);
                }
            }
        }

        initializeAuth();

        // 3. Ouvir mudanças de estado (login/logout/refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, currentSession: Session | null) => {
                if (!mounted) return;

                logger.log(`AuthContext: Evento Supabase - ${event}`);
                
                // Ignorar INITIAL_SESSION se o initialAuth já estiver cuidando disso para evitar flickering
                if (event === 'INITIAL_SESSION' && initialCheckDone) return;

                const prevUser = user;
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    // Se o usuário mudou ou acabou de logar, buscamos o perfil
                    if (!prevUser || prevUser.id !== currentSession.user.id) {
                        const profileData = await fetchProfile(currentSession.user.id);
                        if (mounted) {
                            setProfile(profileData as Profile);
                            AsyncStorage.setItem('@user_profile_cache', JSON.stringify(profileData));
                            registerForPushNotificationsAsync(currentSession.user.id);
                        }
                    }
                } else if (event === 'SIGNED_OUT') {
                    if (mounted) {
                        if (prevUser) unregisterPushToken(prevUser.id);
                        setProfile(null);
                        AsyncStorage.removeItem('@user_profile_cache');
                    }
                }

                // Se houver qualquer evento de sucesso, garantimos que o loading pare
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                    setIsLoading(false);
                }
            }
        );

        const cleanupNotifications = setupNotificationListeners();

        return () => {
            mounted = false;
            subscription.unsubscribe();
            cleanupNotifications();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ session, user, profile, isLoading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
