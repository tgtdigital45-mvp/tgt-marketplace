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
        const val = (globalThis as any)[viteKey];
        if (val) return val;
    } catch {
        // globalThis not available — ignore
    }

    return fallback ?? '';
}

const supabaseUrl = getEnvVar(
    'VITE_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_URL'
);

const supabaseAnonKey = getEnvVar(
    'VITE_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY'
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

        console.log('[Supabase] Lock not available or failed, running function directly');
        return fn();
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM COOKIE STORAGE — Substitui LocalStorage para maior segurança (Anti-XSS)
// ─────────────────────────────────────────────────────────────────────────────
class SafeCookieStorage {
    getItem(key: string): string | null {
        if (!isWeb) return null;
        const name = key + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return null;
    }

    setItem(key: string, value: string): void {
        if (!isWeb) return;
        // Expiração de 7 dias (ajustável)
        const d = new Date();
        d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
        const expires = "expires=" + d.toUTCString();
        // Segurança: SameSite=Strict e Secure (requer HTTPS)
        document.cookie = `${key}=${value};${expires};path=/;SameSite=Strict;Secure`;
    }

    removeItem(key: string): void {
        if (!isWeb) return;
        document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure`;
    }
}

// Singleton guard — ensures only ONE supabase client across HMR reloads in development.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
if (!g._supabaseShared) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appType = getEnvVar('VITE_APP_TYPE', '', 'shared');
    const authOptions: any = {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: isWeb,
        storageKey: `contratto-auth-session-${appType}`,
        storage: isWeb ? new SafeCookieStorage() : undefined, // Usa cookies no web, default (AsyncStorage) no mobile
        lock: buildLockFn(),
    };

    g._supabaseShared = createClient(supabaseUrl, supabaseAnonKey, { auth: authOptions });
}

export const supabase = g._supabaseShared;
