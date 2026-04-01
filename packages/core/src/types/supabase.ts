import { createClient } from '@supabase/supabase-js';

// Detect which environment we are in:
// - Vite (web): VITE_* vars are injected into globalThis via define in vite.config.ts
// - Expo/React Native: process.env.EXPO_PUBLIC_* is available
//
// IMPORTANT: We do NOT use import.meta.env here because Hermes (React Native engine)
// fails to PARSE files containing `import.meta` — even inside try/catch blocks.

declare global {
    var VITE_SUPABASE_URL: string | undefined;
    var VITE_SUPABASE_ANON_KEY: string | undefined;
    var VITE_APP_TYPE: string | undefined;
}

const supabaseUrl = (typeof globalThis !== 'undefined' && globalThis.VITE_SUPABASE_URL)
    ? globalThis.VITE_SUPABASE_URL
    : (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_SUPABASE_URL : undefined) || '';

const supabaseAnonKey = (typeof globalThis !== 'undefined' && globalThis.VITE_SUPABASE_ANON_KEY)
    ? globalThis.VITE_SUPABASE_ANON_KEY
    : (typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY : undefined) || '';

const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

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
            // Em desenvolvimento, avisa se houver erro real no lock
            if (process.env.NODE_ENV === 'development') {
                console.debug('[Supabase] Navigator lock error, running without lock:', e);
            }
        }

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
const nativeStorageAdapter = {
    getItem: (key: string) => {
        if (!g._SUPABASE_STORAGE) return null;
        return g._SUPABASE_STORAGE.getItem(key);
    },
    setItem: (key: string, value: string) => {
        if (!g._SUPABASE_STORAGE) return;
        return g._SUPABASE_STORAGE.setItem(key, value);
    },
    removeItem: (key: string) => {
        if (!g._SUPABASE_STORAGE) return;
        return g._SUPABASE_STORAGE.removeItem(key);
    }
};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appType = (typeof globalThis !== 'undefined' && globalThis.VITE_APP_TYPE) ? globalThis.VITE_APP_TYPE : 'shared';
    const authOptions: any = {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: isWeb,
        storageKey: `contratto-auth-session-${appType}`,
        storage: isWeb ? new SafeCookieStorage() : nativeStorageAdapter, // Usa cookies no web, adapter dinamico no mobile
        lock: buildLockFn(),
    };

    g._supabaseShared = createClient(supabaseUrl, supabaseAnonKey, { auth: authOptions });
}

export const supabase = g._supabaseShared;
