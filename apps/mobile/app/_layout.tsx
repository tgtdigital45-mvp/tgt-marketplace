// IMPORTANT: Must be the very first import to polyfill TextDecoder *before* h3-js loads
import '@/polyfills/textDecoder';
import '../global.css';
import { View, Text } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/providers/AuthProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
    const colorScheme = useColorScheme();

    useEffect(() => {
        SplashScreen.hideAsync();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <NotificationProvider>
                    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="index" options={{ headerShown: false }} />
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                            <Stack.Screen name="map/index" options={{ headerShown: false, title: 'Mapa' }} />
                            <Stack.Screen name="service/[id]" options={{ headerShown: false, presentation: 'card' }} />
                            <Stack.Screen name="booking/select-date" options={{ headerShown: false, presentation: 'modal' }} />
                            <Stack.Screen name="checkout/index" options={{ headerShown: false, presentation: 'card', title: 'Checkout' }} />
                            <Stack.Screen name="+not-found" />
                        </Stack>
                        <StatusBar style="auto" />
                    </ThemeProvider>
                </NotificationProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}
