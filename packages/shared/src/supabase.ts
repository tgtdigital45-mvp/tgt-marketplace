import { createClient } from '@supabase/supabase-js';

// Detect which environment we are in:
// - Vite (web): import.meta.env is available
// - Expo/React Native: process.env.EXPO_PUBLIC_* is available
// We must NOT reference import.meta.env directly at module level
// when running in React Native, as the bundler will throw.
// Instead, we use a helper that tries each source safely.
function getEnvVar(viteKey: string, expoKey: string, fallback?: string): string {
    // Try Expo / Node environment first (works in all environments)
    const expoVal = (typeof process !== 'undefined' && process?.env?.[expoKey]) as string | undefined;
    if (expoVal) return expoVal;

    // Try Vite environment (only valid in web/Vite builds)
    // Using indirect access to avoid Metro bundler parse errors on import.meta
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metaEnv = (import.meta as any)?.env;
        if (metaEnv && metaEnv[viteKey]) return metaEnv[viteKey];
    } catch {
        // Not in a Vite environment - ignore
    }

    return fallback ?? '';
}

const supabaseUrl = getEnvVar(
    'VITE_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_URL',
    'https://rclsllzolsiodyebfcfj.supabase.co'
);

const supabaseAnonKey = getEnvVar(
    'VITE_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbHNsbHpvbHNpb2R5ZWJmY2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTE0MjMsImV4cCI6MjA4NTEyNzQyM30.EgLsqMiLPG4no7fjl0MibFWzy5hQPG0lPSa54Xg7yIQ'
);

// Determine if running in a browser/web environment (has window object)
const isWeb = typeof window !== 'undefined';

// Singleton guard — ensures only ONE supabase client across HMR reloads in development.
// Uses globalThis so the reference survives module re-evaluation during HMR.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
if (!g._supabaseShared) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authOptions: any = {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: isWeb, // only parse URL hash in web
        storageKey: 'contratto-auth-session',
    };

    /* 
    // Add custom lock for web only — prevents NavigatorLockAcquireTimeoutError
    // caused by auth state change callbacks re-entering Supabase while holding the lock.
    if (isWeb && typeof navigator !== 'undefined' && navigator.locks) {
        authOptions.lock = async (name: string, _timeout: number, fn: () => Promise<unknown>) => {
            let acquired = false;
            const result = await navigator.locks.request(name, { ifAvailable: true }, async () => {
                acquired = true;
                return fn();
            });
            if (acquired) return result;
            // Lock busy — run directly to avoid deadlock
            return fn();
        };
    }
    */

    g._supabaseShared = createClient(supabaseUrl, supabaseAnonKey, { auth: authOptions });
}

export const supabase = g._supabaseShared;
