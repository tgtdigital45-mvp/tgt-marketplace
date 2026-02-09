import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
          } catch (companyError) {
            console.error("AuthContext: Failed to fetch company data", companyError);
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
          } catch (companyError) {
            console.error("AuthContext: Failed to fetch company data on state change", companyError);
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
      // 1. Immediate UI clear to prevent ghost state
      setUser(null);

      // 2. Clear Supabase session
      await supabase.auth.signOut();

      // 3. Force hard redirect to clear all application state/cache
      window.location.replace('/login');
    } catch (error) {
      console.error("Error during logout:", error);
      // Fallback: Force redirect even if Supabase errors
      window.location.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signInWithGoogle, logout }}>
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
