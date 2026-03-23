import AsyncStorage from '@react-native-async-storage/async-storage';

// Injeta o AsyncStorage na variável global para que o pacote @tgt/core/src/types/supabase.ts 
// possa utilizá-lo sem causar conflitos de dependência no ambiente web.
(globalThis as any)._SUPABASE_STORAGE = AsyncStorage;
