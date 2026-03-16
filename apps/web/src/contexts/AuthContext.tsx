import React, { createContext, useState, useContext, useEffect, ReactNode, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { User, supabase } from '@tgt/core';;

// Extensão do tipo User para incluir dados do contexto
interface UserContext extends User {
  companySlug?: string;
}

interface AuthContextType {
  user: UserContext | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  const mountedRef = useRef(true);
  const callCounter = useRef(0);
  const lastProcessedUserIdRef = useRef<string | null>(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Helper para commitar o estado do usuário de forma segura
  const commitUserState = (userData: UserContext, fetchId: string) => {
    if (!mountedRef.current) return;

    const appType = (globalThis as any).VITE_APP_TYPE || 'marketplace';

    // 1. Cache para carregamento instantâneo futuro
    if (userData.companySlug) {
      localStorage.setItem(`contratto-cached-slug-${appType}`, userData.companySlug);
    }

    // 2. Verificação de Segurança por App
    if (appType === 'marketplace' && userData.type === 'company' && !userData.role?.includes('admin')) {
      console.warn('[AuthContext] Company user in marketplace. Redirecting...');
      window.location.href = (globalThis as any).VITE_PORTAL_URL || '/';
      return;
    }
    if (appType === 'portal' && userData.type === 'client') {
      console.warn('[AuthContext] Client user in portal. Redirecting...');
      window.location.href = (globalThis as any).VITE_LANDING_URL || '/';
      return;
    }

    console.log(`${fetchId} Comitando estado:`, userData.id);
    setUser(userData);
    setLoading(false);
  };

  // Busca perfil completo com Race Strategy (RPC vs Fallback)
  const fetchUserProfile = async (userId: string, metadata: any = {}, callId: number): Promise<void> => {
    const fetchId = `[ID: ${callId}]`;
    console.log(`AuthContext.tsx:${callId} ${fetchId} Buscando contexto (Race Strategy)...`);

    const start = Date.now();

    try {
      // Race: RPC vs 3s Timeout
      const rpcPromise = supabase.rpc('get_user_session_context', { p_user_id: userId });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('RPC_TIMEOUT')), 3000)
      );

      let rpcData: any = null;
      let rpcError: any = null;

      try {
        const result: any = await Promise.race([rpcPromise, timeoutPromise]);
        rpcData = result.data;
        rpcError = result.error;
      } catch (err: any) {
        if (err.message === 'RPC_TIMEOUT') {
          console.warn(`${fetchId} RPC Timeout (3s). Tentando Fallback...`);
          rpcError = { message: 'Timeout' };
        } else {
          rpcError = err;
        }
      }

      console.log(`${fetchId} RPC Finalizou em ${Date.now() - start}ms. Erro:`, rpcError);

      if (!rpcError && rpcData) {
        const userData: UserContext = {
          id: userId,
          role: rpcData.role || 'user',
          name: rpcData.full_name || metadata.full_name || metadata.name || 'User',
          avatar: rpcData.avatar_url || metadata.avatar_url || '',
          type: rpcData.user_type || metadata.type || 'client',
          companySlug: rpcData.company_slug || metadata.slug,
          email: metadata.email || ''
        };
        commitUserState(userData, fetchId);
        return;
      }

      // FALLBACK: Consultas manuais se a RPC falhar
      console.log(`${fetchId} Executando fallback manual...`);
      const [profileRes, companyRes] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url, role, user_type').eq('id', userId).maybeSingle(),
        supabase.from('companies').select('slug').eq('profile_id', userId).maybeSingle()
      ]);

      const finalUserData: UserContext = {
        id: userId,
        role: profileRes.data?.role || 'user',
        name: profileRes.data?.full_name || metadata.full_name || metadata.name || 'User',
        avatar: profileRes.data?.avatar_url || metadata.avatar_url || '',
        type: companyRes.data ? 'company' : (profileRes.data?.user_type || metadata.type || 'client'),
        companySlug: companyRes.data?.slug || metadata.slug,
        email: metadata.email || ''
      };

      commitUserState(finalUserData, fetchId);
    } catch (error) {
      console.error(`${fetchId} Erro fatal no AuthContext:`, error);
      setLoading(false);
    }
  };

  // Handler principal de mudança de estado de autenticação
  const handleAuthStateChange = async (event: string, session: any) => {
    if (!mountedRef.current) return;
    console.log(`[AuthContext] Auth Event: ${event}`);

    if (session?.user) {
      const userId = session.user.id;
      const metadata = session.user.user_metadata || {};

      // Evita loops se for o mesmo usuário
      if (userId === lastProcessedUserIdRef.current && event !== 'TOKEN_REFRESHED') return;
      lastProcessedUserIdRef.current = userId;

      // Otimista: Se temos metadados, libera a UI imediatamente
      const cachedType = metadata.user_type || metadata.type;
      const cachedSlug = metadata.company_slug || metadata.slug;

      if (cachedType || cachedSlug) {
        console.log(`[AuthContext] Estado otimista aplicado para ${userId}`);
        setUser({
          id: userId,
          role: metadata.role || 'user',
          name: metadata.full_name || metadata.name || 'User',
          avatar: metadata.avatar_url || '',
          type: cachedType || 'client',
          companySlug: cachedSlug,
          email: session.user.email || ''
        });
        setLoading(false);
      } else {
        setLoading(true);
      }

      callCounter.current += 1;
      fetchUserProfile(userId, metadata, callCounter.current);
    } else {
      lastProcessedUserIdRef.current = null;
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // Inicialização silenciosa
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleAuthStateChange('INITIAL_SESSION', session);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      handleAuthStateChange(event, session);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // Realtime Sync para mudanças de perfil
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(`profile_sync_${user.id}`)
      .on('postgres_changes', { 
         event: 'UPDATE', 
         schema: 'public', 
         table: 'profiles', 
         filter: `id=eq.${user.id}` 
      }, (payload) => {
        console.log('[AuthContext] Update via Realtime:', payload.new);
        setUser(prev => prev ? {
          ...prev,
          name: payload.new.full_name || prev.name,
          avatar: payload.new.avatar_url || prev.avatar,
          role: payload.new.role || prev.role
        } : null);
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user?.id]);

  // Metódos expositivos
  const login = async () => {}; // Login é feito nas páginas específicas
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const logout = async () => {
    setLoading(true);
    setUser(null);
    await supabase.auth.signOut();
    queryClient.clear();
    const isMarketplace = (globalThis as any).VITE_APP_TYPE === 'marketplace';
    navigate(isMarketplace ? '/login/cliente' : '/login/empresa');
    setLoading(false);
  };

  const refreshSession = async () => {
    setIsRefreshing(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await handleAuthStateChange('REFRESH', session);
    setIsRefreshing(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signInWithGoogle, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
