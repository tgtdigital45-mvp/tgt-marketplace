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

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM NAVIGATOR LOCK — Previne NavigatorLockAcquireTimeoutError
//
// Causa raiz: O Supabase Auth usa o Web Locks API com timeout de 10s para
// serializar operações de sessão. Em desenvolvimento (HMR), uma nova instância
// do cliente tenta adquirir o lock enquanto a instância anterior ainda o segura,
// causando timeout e bloqueio de TODAS as queries Supabase.
//
// Solução: Usar `ifAvailable: true` (não-bloqueante). Se o lock estiver ocupado,
// executar a função diretamente sem lock ao invés de esperar 10s e travar.
// Em produção isso raramente acontece; em dev/HMR resolve o problema.
// ─────────────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildLockFn(): ((name: string, timeout: number, fn: () => Promise<unknown>) => Promise<unknown>) | undefined {
    if (!isWeb || typeof navigator === 'undefined' || !navigator.locks) {
        // Web Locks API não disponível (React Native, Safari <15.4, etc.)
        return undefined;
    }

    return async (name: string, _timeout: number, fn: () => Promise<unknown>) => {
        let acquired = false;

        try {
            const result = await navigator.locks.request(
                name,
                { ifAvailable: true },
                async (lock) => {
                    if (lock === null) {
                        // Lock ocupado (ex: HMR — instância anterior ainda ativa)
                        return null;
                    }
                    acquired = true;
                    return fn();
                }
            );

            if (acquired) return result;
        } catch (e) {
            // Erro inesperado no lock — não deve bloquear operação
            console.warn('[Supabase] Navigator lock error, running without lock:', e);
        }

        // Lock ocupado ou falhou → executa diretamente (sem serialização)
        // Trade-off consciente: possível uso concorrente, mas preferível ao bloquear
        return fn();
    };
}

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
        lock: buildLockFn(),
    };

    g._supabaseShared = createClient(supabaseUrl, supabaseAnonKey, { auth: authOptions });
}

export const supabase = g._supabaseShared;

// Vite HMR: when this module is hot-replaced, destroy the old client instance
// so the new one starts with a clean lock state (prevents NavigatorLockAcquireTimeoutError).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((import.meta as any).hot) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import.meta as any).hot.dispose(() => {
        // Force the next module evaluation to create a fresh client
        delete g._supabaseShared;
    });
}

