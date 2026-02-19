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
                storageKey: 'tgt-auth-session',
                // Bypass navigator.locks completely to prevent
                // NavigatorLockAcquireTimeoutError. The default lock
                // implementation uses navigator.locks.request() which
                // can deadlock when auth state change callbacks make
                // supabase queries that also need the same lock.
                lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
                    return await fn();
                },
            } as any,
        }
    );

    win._supabaseInstance = client;
    return client;
};

export const supabase = getSupabase();
