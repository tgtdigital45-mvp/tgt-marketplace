import { createClient } from '@supabase/supabase-js';

// Detect which environment we are in:
// - Vite (web): VITE_* vars are injected into globalThis via define in vite.config.ts
// - Expo/React Native: process.env.EXPO_PUBLIC_* is available
//
// IMPORTANT: We do NOT use import.meta.env here because Hermes (React Native engine)
// fails to PARSE files containing `import.meta` — even inside try/catch blocks.
// Instead, Vite's `define` config injects vars as globalThis properties for web.
function getEnvVar(viteKey: string, expoKey: string, fallback?: string): string {
    // 1. Try Expo / Node environment (works in React Native and Node)
    const expoVal = (typeof process !== 'undefined' && process?.env?.[expoKey]) as string | undefined;
    if (expoVal) return expoVal;

    // 2. Try Vite-injected global (set via `define` in vite.config.ts)
    // This avoids import.meta.env which crashes Hermes at parse time.
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const viteEnv = (globalThis as any).__VITE_ENV__;
        if (viteEnv && viteEnv[viteKey]) return viteEnv[viteKey];
    } catch {
        // globalThis not available — ignore
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

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM NAVIGATOR LOCK — Previne NavigatorLockAcquireTimeoutError
// ─────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildLockFn(): ((name: string, timeout: number, fn: () => Promise<unknown>) => Promise<unknown>) | undefined {
    if (!isWeb || typeof navigator === 'undefined' || !navigator.locks) {
        return undefined;
    }

    return async (name: string, _timeout: number, fn: () => Promise<unknown>) => {
        let acquired = false;

        try {
            const result = await navigator.locks.request(
                name,
                { ifAvailable: true },
                async (lock) => {
                    if (lock === null) return null;
                    acquired = true;
                    return fn();
                }
            );

            if (acquired) return result;
        } catch (e) {
            console.warn('[Supabase] Navigator lock error, running without lock:', e);
        }

        return fn();
    };
}

// Singleton guard — ensures only ONE supabase client across HMR reloads in development.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
if (!g._supabaseShared) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authOptions: any = {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: isWeb,
        storageKey: 'contratto-auth-session',
        lock: buildLockFn(),
    };

    g._supabaseShared = createClient(supabaseUrl, supabaseAnonKey, { auth: authOptions });
}

export const supabase = g._supabaseShared;
