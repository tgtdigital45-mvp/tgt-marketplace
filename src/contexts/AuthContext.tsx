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
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Initialize loading based on whether we expect a session
  const [loading, setLoading] = useState(() => {
    return !!localStorage.getItem('tgt-auth-session');
  });

  useEffect(() => {
    let mounted = true;

    // Check active session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      try {
        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            type: (session.user.user_metadata.type as 'client' | 'company') || 'client',
            role: 'user', // Default role
            avatar: session.user.user_metadata.avatar_url,
          };

          // Always check if user has a company to ensure type consistency and get slug
          try {
            const { data: companyData, error: companyError } = await supabase
              .from('companies')
              .select('slug')
              .eq('profile_id', session.user.id)
              .limit(1)
              .maybeSingle();

            if (companyError) {
              console.warn("AuthContext: Error checking company existence", companyError);

              // Critical: Check for JWT expiration
              if (companyError.code === 'PGRST303' || companyError.message?.includes('JWT expired')) {
                console.warn("AuthContext: JWT expired detected during initial company check. Logging out.");
                await supabase.auth.signOut();
                // Force hard redirect
                window.location.href = '/login/empresa';
                return;
              }

              // Fallback: attempts to get any company associated if maybeSingle fails (though limit 1 should prevent 406)
              if (companyError.code === 'PGRST116' || companyError.code === '406') {
                const { data: fallbackData } = await supabase
                  .from('companies')
                  .select('slug')
                  .eq('profile_id', session.user.id)
                  .limit(1);

                if (fallbackData && Array.isArray(fallbackData) && fallbackData.length > 0) {
                  userData.type = 'company';
                  userData.companySlug = fallbackData[0].slug;
                }
              }
            } else if (companyData) {
              userData.type = 'company'; // Force type to company if record exists
              userData.companySlug = companyData.slug;
            }

            // Buscar role do usuário
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileError) {
              console.error('[AuthContext] Error fetching profile role:', profileError);
            }

            if (profileData) {
              console.log('[AuthContext] Fetched role for user:', profileData.role);
              if (profileData.role) {
                userData.role = profileData.role as 'user' | 'admin' | 'moderator';
              }
            } else {
              console.warn('[AuthContext] No profile data found for user');
            }
          } catch (companyError: any) {
            console.error("AuthContext: Failed to fetch company data", companyError);

            // Critical: If JWT expired during this check, force logout to prevent loop
            if (companyError?.code === 'PGRST303' || companyError?.message?.includes('JWT expired')) {
              console.warn("AuthContext: JWT expired detected during initial check. Logging out.");
              await supabase.auth.signOut();
              if (mounted) setUser(null);
              // We don't redirect here immediately to avoid interfering with public pages that might try to load auth
              // But we ensure user is null so private routes will redirect
              return;
            }
          }

          if (mounted) setUser(userData);
        }
      } catch (err) {
        console.error("AuthContext: Unexpected error in session check", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }).catch(err => {
      // Ignore AbortError which happens on strict mode re-renders
      if (err.name === 'AbortError' || err.message?.includes('aborted')) return;
      console.error("AuthContext: Terminal error getting session", err);
      if (mounted) setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Handle programmatic redirects for password recovery
      if (event === 'PASSWORD_RECOVERY') {
        // This event comes from Supabase when a recovery link is clicked and session is established
      }

      try {
        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            type: (session.user.user_metadata.type as 'client' | 'company') || 'client',
            avatar: session.user.user_metadata.avatar_url,
          };

          try {
            // Always check if user has a company
            const { data: companyData, error: companyError } = await supabase
              .from('companies')
              .select('slug')
              .eq('profile_id', session.user.id)
              .limit(1)
              .maybeSingle();

            if (companyError) {
              console.warn("AuthContext (Subscription): Error checking company existence", companyError);

              // Critical: Check for JWT expiration
              if (companyError.code === 'PGRST303' || companyError.message?.includes('JWT expired')) {
                console.warn("AuthContext: JWT expired detected during subscription company check. Logging out.");
                await supabase.auth.signOut();
                window.location.href = '/login/empresa';
                return;
              }

              if (companyError.code === 'PGRST116' || companyError.code === '406') {
                const { data: fallbackData } = await supabase
                  .from('companies')
                  .select('slug')
                  .eq('profile_id', session.user.id)
                  .limit(1);

                if (fallbackData && Array.isArray(fallbackData) && fallbackData.length > 0) {
                  userData.type = 'company';
                  userData.companySlug = fallbackData[0].slug;
                }
              }
            } else if (companyData) {
              userData.type = 'company'; // Force type to company if record exists
              userData.companySlug = companyData.slug;
            }

            // Buscar role do usuário (CRITICAL FIX: Fetch role in onAuthStateChange)
            const { data: profileData } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profileData?.role) {
              userData.role = profileData.role as 'user' | 'admin' | 'moderator';
            }
          } catch (companyError: any) {
            console.error("AuthContext: Failed to fetch company data on state change", companyError);

            // Critical: If JWT expired during this check, force logout to prevent loop
            if (companyError?.code === 'PGRST303' || companyError?.message?.includes('JWT expired')) {
              console.warn("AuthContext: JWT expired detected during company check. Logging out.");
              await supabase.auth.signOut();
              if (mounted) setUser(null);
              window.location.href = '/login/empresa'; // Hard redirect to clear bad state
              return;
            }
          }

          if (mounted) setUser(userData);
        } else {
          if (mounted) setUser(null);
        }
      } catch (authStateError) {
        console.error("AuthContext: Error handling auth state change", authStateError);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
