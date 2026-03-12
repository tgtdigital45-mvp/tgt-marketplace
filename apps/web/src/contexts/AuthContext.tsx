import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '@tgt/shared';
import { supabase } from '@tgt/shared';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const fetchIdRef = React.useRef(0); // Track fetch attempts
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const mountedRef = React.useRef(true); // Track component mount status
  const lastProcessedUserIdRef = React.useRef<string | null>(null); // Deduplicate SIGNED_IN events
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Initialize loading based on whether we expect a session
  // We use a more cautious approach: only true if there's a strong indication of a session
  const [loading, setLoading] = useState(() => {
    try {
      const hasSession = !!localStorage.getItem('contratto-auth-session');
      if (hasSession) console.log('[AuthContext] Initializing with loading=true (found session in storage)');
      return hasSession;
    } catch (e) {
      return false;
    }
  });

  // Extract profile fetching logic for reuse
  const fetchUserProfile = async (session: any) => {
    if (!session?.user) return;

    // Cancel previous fetch if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const currentFetchId = ++fetchIdRef.current;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);

    try {
      const userData: User = {
        id: session.user.id,
        name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        type: (session.user.user_metadata.type as 'client' | 'company') || 'client',
        role: 'user',
        avatar: session.user.user_metadata.avatar_url || '',
      };

      console.log(`[AuthContext] (ID: ${currentFetchId}) Buscando contexto via RPC unificada...`);

      // Timeout de segurança para a RPC
      const rpcPromise = supabase.rpc('get_user_session_context', { p_user_id: session.user.id });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('RPC Timeout')), 8000)
      );

      const { data: sessionCtx, error: rpcError } = (await Promise.race([
        rpcPromise,
        timeoutPromise
      ])) as any;

      console.log(`[AuthContext] (ID: ${currentFetchId}) RPC concluída. Erro:`, rpcError);

      if (currentFetchId !== fetchIdRef.current) return;

      if (rpcError) {
        console.error(`[AuthContext] (ID: ${currentFetchId}) Erro na RPC get_user_session_context:`, rpcError);
      } else if (sessionCtx) {
        if (sessionCtx.role) userData.role = sessionCtx.role as any;
        if (sessionCtx.full_name) userData.name = sessionCtx.full_name;
        if (sessionCtx.avatar_url) userData.avatar = sessionCtx.avatar_url;
        if (sessionCtx.user_type) userData.type = sessionCtx.user_type as any;
        if (sessionCtx.company_slug) userData.companySlug = sessionCtx.company_slug;
      }

      if (mountedRef.current && currentFetchId === fetchIdRef.current) {
        console.log(`[AuthContext] (ID: ${currentFetchId}) Commitando estado do usuário:`, userData.id);
        setUser(userData);
      }
    } catch (err: any) {
      console.error(`[AuthContext] (ID: ${currentFetchId}) Erro crítico no fetch:`, err);
    } finally {
      if (mountedRef.current && currentFetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  };



  useEffect(() => {
    mountedRef.current = true;
    console.log('[AuthContext] (VER_2026_03_02_1645) Mounting AuthProvider...');

    // Safety timeout: ensure loading is reset even if Supabase events fail to fire
    const safetyTimeout = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn('[AuthContext] Safety timeout reached! Forcing loading=false');
        setLoading(false);
      }
    }, 10000); // 10 seconds is safer for initial session check, matching/exceeding RPC timeout

    // Single listener: let INITIAL_SESSION bootstrap state, then handle subsequent events.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;
      console.log(`[AuthContext] Auth State Change Event: ${event}`);
      
      // Clear safety timeout as soon as we get ANY event
      clearTimeout(safetyTimeout);

      if (event === 'SIGNED_OUT') {
        lastProcessedUserIdRef.current = null;
        setUser(null);
        setLoading(false);
        return;
      }

      // Handle both INITIAL_SESSION and SIGNED_IN
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (!session?.user) {
          // Check if we were already in INITIAL_SESSION with no user to avoid redundant state resets
          if (event === 'INITIAL_SESSION') {
            console.log('[AuthContext] INITIAL_SESSION with no user, resetting loading.');
          }
          setUser(null);
          setLoading(false);
          return;
        }

        // Optimization: Set basic user info from session metadata IMMEDIATELY
        // to update UI (Header) while fetchUserProfile runs in background.
        // Only apply if metadata has a reliable type — never assume 'client' as default,
        // as this causes company users to be redirected to client routes before RPC completes.
        const metadataType = (session.user.user_metadata.user_type || session.user.user_metadata.type) as 'client' | 'company' | undefined;
        if ((!user || user.id !== session.user.id) && metadataType) {
          const initialUserData: User = {
            id: session.user.id,
            name: session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            type: metadataType,
            avatar: session.user.user_metadata.avatar_url || '',
            role: 'user',
          };
          console.log(`[AuthContext] Setting immediate user state from ${event} metadata (type=${metadataType}):`, initialUserData.id);
          setUser(initialUserData);
        }

        // Deduplicate: skip if this user ID was already processed in the current mount cycle
        // to avoid redundant fetches between INITIAL_SESSION and SIGNED_IN.
        // IMPORTANT: Do NOT call setLoading(false) here — an in-flight fetchUserProfile
        // may still be running from the first event. Let it control the loading state.
        if (session.user.id === lastProcessedUserIdRef.current) {
          console.log(`[AuthContext] Skipping redundant fetch for ${event} for user: ${session.user.id}`);
          return;
        }

        lastProcessedUserIdRef.current = session.user.id;

        try {
          await fetchUserProfile(session);
        } catch (err) {
          console.error('[AuthContext] Error handling auth event', event, err);
          if (mountedRef.current) setLoading(false);
        }
        return;
      }

      // All other events (PASSWORD_RECOVERY, etc.)
      if (session?.user) {
        try {
          await fetchUserProfile(session);
        } catch (err) {
          console.error('[AuthContext] Error handling auth event', event, err);
          if (mountedRef.current) setLoading(false);
        }
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []); // Run once on mount

  // 3. Realtime Profile Sync
  useEffect(() => {
    if (!user?.id) return;

    console.log(`[AuthContext] Subscribing to profile Realtime for: ${user.id}`);
    const profileChannel = supabase.channel(`public:profiles:id=eq.${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        console.log('[AuthContext] Profile updated via Realtime:', payload.new);
        const updatedProfile = payload.new;
        setUser(prev => prev ? {
          ...prev,
          name: updatedProfile.full_name || prev.name,
          role: updatedProfile.role || prev.role,
          avatar: updatedProfile.avatar_url || prev.avatar,
          type: updatedProfile.user_type || prev.type
        } : null);
      })
      .subscribe();

    return () => {
      console.log(`[AuthContext] Unsubscribing from profile Realtime for: ${user.id}`);
      profileChannel.unsubscribe();
    };
  }, [user?.id]); // Only re-subscribe if ID changes

  // --- ADMIN SESSION TIMEOUT LOGIC ---
  useEffect(() => {
    // Only enforce timeout for admins/moderators
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) return;

    const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    let timeoutId: NodeJS.Timeout;

    const logoutUser = () => {
      console.warn('[AuthContext] Session timed out due to inactivity.');
      logout();
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(logoutUser, TIMEOUT_DURATION);
    };

    // Events to detect activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    // Set initial timer
    resetTimer();

    // Attach listeners
    events.forEach(event => document.addEventListener(event, resetTimer));

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [user]); // Re-run when user changes

  const login = async () => {
    // This is a placeholder as actual login happens in LoginPage via Supabase directly.
    // We just expose the user state here.
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Use origin directly to avoid hash fragmentation issues.
          // Supabase handles the callback and the app will reload at root, then AuthContext restores session.
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      // 1. Immediate UI clear
      setUser(null);

      // 2. Clear Supabase session
      await supabase.auth.signOut();

      // 3. Clear React Query Cache to avoid stale data
      queryClient.clear();

      // 4. Soft redirect based on app type
      const isMarketplace = (process.env as any).VITE_APP_TYPE === 'marketplace';
      const loginPath = isMarketplace ? '/login/cliente' : '/login/empresa';
      
      navigate(loginPath);
    } catch (error) {
      console.error("Error during logout:", error);
      // Fallback: Force redirect
      const isMarketplace = (process.env as any).VITE_APP_TYPE === 'marketplace';
      window.location.href = isMarketplace ? '/login/cliente' : '/login/empresa';
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (session?.user) {
        // This will trigger onAuthStateChange, or we can manually update
        // Since onAuthStateChange handles the update, we just need to ensure it fires or we manually set
        // Ideally re-fetching the user details manually here ensures we get the latest data (like new company)
        const userInfo = session.user;
        const userData: User = {
          id: userInfo.id,
          name: userInfo.user_metadata.name || userInfo.email?.split('@')[0] || 'User',
          email: userInfo.email || '',
          type: (userInfo.user_metadata.type as 'client' | 'company') || 'client',
          avatar: userInfo.user_metadata.avatar_url,
        };

        // ... duplicate logic from useEffect? Better to extract checks to function.
        // For now, let's just rely on window reload in critical paths, but exposing this allows manual refresh.
        // Actually, force fetching company:
        const { data: companyData } = await supabase.from('companies').select('slug').eq('profile_id', userInfo.id).maybeSingle();
        if (companyData) {
          userData.type = 'company';
          userData.companySlug = companyData.slug;
        }
        setUser(userData);
      }
    } catch (err) {
      console.error("Error refreshing session:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signInWithGoogle, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);

  // Defensive check for transient unmount states or fast-refresh issues
  if (context === undefined) {
    // In production, we might want to return a fallback or log and throw
    // In development, we keep the throw to catch implementation errors early
    if (process.env.NODE_ENV === 'production') {
      console.error('[AuthContext] useAuth accessed outside of AuthProvider. This should not happen in the current tree structure.');
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
