import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const supabaseUrl =
    Constants.expoConfig?.extra?.supabaseUrl ??
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    'https://rclsllzolsiodyebfcfj.supabase.co';

const supabaseAnonKey =
    Constants.expoConfig?.extra?.supabaseAnonKey ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbHNsbHpvbHNpb2R5ZWJmY2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTE0MjMsImV4cCI6MjA4NTEyNzQyM30.EgLsqMiLPG4no7fjl0MibFWzy5hQPG0lPSa54Xg7yIQ';

// On web, expo-secure-store is not available — use localStorage instead.
// On native (iOS/Android), use SecureStore for encrypted storage.
function getStorageAdapter() {
    if (Platform.OS === 'web') {
        return {
            getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
            setItem: (key: string, value: string) => {
                localStorage.setItem(key, value);
                return Promise.resolve();
            },
            removeItem: (key: string) => {
                localStorage.removeItem(key);
                return Promise.resolve();
            },
        };
    }

    // Native: use SecureStore (lazy import to avoid web bundling issues)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SecureStore = require('expo-secure-store');
    return {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: getStorageAdapter() as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
