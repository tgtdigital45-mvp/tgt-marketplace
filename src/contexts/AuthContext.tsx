import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '../types';
import { supabase } from '../lib/supabase';

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
  const mountedRef = React.useRef(true); // Track component mount status
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Initialize loading based on whether we expect a session
  const [loading, setLoading] = useState(() => {
    return !!localStorage.getItem('tgt-auth-session');
  });

  // Extract profile fetching logic for reuse
  const fetchUserProfile = async (session: any) => {
    if (!session?.user) return;

    const currentFetchId = ++fetchIdRef.current;

    // Ensure we are in loading state while fetching profile
    setLoading(true);

    try {
      const userData: User = {
        id: session.user.id,
        name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        type: (session.user.user_metadata.type as 'client' | 'company') || 'client',
        role: 'user', // Default role
        avatar: session.user.user_metadata.avatar_url,
      };

      console.log(`[AuthContext] Fetching profile data (ID: ${currentFetchId}) for:`, session.user.id);

      // 1. Check if user has a company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, slug, profile_id')
        .eq('profile_id', session.user.id);

      // If a newer fetch started, stop immediately
      if (currentFetchId !== fetchIdRef.current) return;

      if (companyError) {
        if (!companyError.message?.includes('AbortError')) {
          console.error("[AuthContext] Error checking company existence:", companyError);
        }
        // Removed early return here to ensure finally block is always reached
      } else if (companyData && companyData.length > 0) {
        console.log("[AuthContext] Found company matching user:", companyData[0].slug);
        userData.type = 'company';
        userData.companySlug = companyData[0].slug;
      }

      // 2. Fetch role and latest profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, avatar_url, user_type')
        .eq('id', session.user.id)
        .maybeSingle();

      if (currentFetchId !== fetchIdRef.current) return;

      if (profileError) {
        if (!profileError.message?.includes('AbortError')) {
          console.error("[AuthContext] Error fetching profile data:", profileError);
        }
        // Removed early return here to ensure finally block is always reached
      }

      if (profileData) {
        if (profileData.role) userData.role = profileData.role as any;
        if (profileData.full_name) userData.name = profileData.full_name;
        if (profileData.avatar_url) userData.avatar = profileData.avatar_url;
        if (profileData.user_type) userData.type = profileData.user_type as any;
      }

      // Final check before committing state
      if (mountedRef.current && currentFetchId === fetchIdRef.current) {
        setUser(userData);
      }
    } catch (err: any) {
      if (!err.message?.includes('AbortError')) {
        console.error("[AuthContext] Failed to fetch user profile", err);
      }
    } finally {
      // Release loading state ONLY if we are the LATEST fetch
      if (mountedRef.current && currentFetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // 1. Initial Session Check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mountedRef.current) return;
      try {
        if (session?.user) {
          await fetchUserProfile(session);
        }
      } catch (err) {
        console.error("AuthContext: Unexpected error in session check", err);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }).catch(err => {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) return;
      console.error("AuthContext: Terminal error getting session", err);
      if (mountedRef.current) setLoading(false);
    });

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;
      console.log(`[AuthContext] Auth State Change Event: ${event}`);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        return;
      }

      // Aggressively set loading true for any auth event that implies a user session
      if (session?.user) {
        setLoading(true);
      }

      try {
        if (session?.user) {
          // fetchUserProfile sets loading true and handles its own setLoading(false) in finally
          await fetchUserProfile(session);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (authStateError) {
        console.error("AuthContext: Error handling auth state change", authStateError);
        setLoading(false); // Failsafe
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

      // 4. Soft redirect
      navigate('/login/empresa');
    } catch (error) {
      console.error("Error during logout:", error);
      // Fallback: Force redirect
      window.location.href = '/login/empresa';
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
