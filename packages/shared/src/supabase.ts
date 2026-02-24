/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing! Check .env file.');
}

const getSupabase = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;

    // Check global cache to prevent multiple instances (critical for HMR in DEV)
    if (win._supabaseInstance) {
        return win._supabaseInstance;
    }

    const client = createClient(
        supabaseUrl || '',
        supabaseAnonKey || '',
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storageKey: 'contratto-auth-session',
                // Custom lock to prevent NavigatorLockAcquireTimeoutError.
                // Uses ifAvailable mode so it never blocks — falls back to
                // direct execution if the lock is held, avoiding deadlocks
                // caused by auth state change callbacks re-entering Supabase.
                lock: async (name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
                    if (typeof navigator !== 'undefined' && navigator.locks) {
                        let lockAcquired = false;
                        const result = await navigator.locks.request(name, { ifAvailable: true }, async () => {
                            lockAcquired = true;
                            return fn();
                        });

                        if (lockAcquired) return result;

                        console.warn(`[Supabase] Lock "${name}" is busy. Falling back to direct execution to avoid hang.`);
                    }
                    return fn();
                },
            } as any,
        }
    );

    win._supabaseInstance = client;
    return client;
};

export const supabase = getSupabase();
