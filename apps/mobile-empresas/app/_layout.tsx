import '../utils/initSupabase';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, Text, Animated, StyleSheet } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from '../utils/stripe';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../utils/theme';
import { AppState, AppStateStatus, Platform } from 'react-native';
import type * as NotificationsType from 'expo-notifications';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { logger } from '../utils/logger';
import { initSentry } from '../utils/sentry';

// Initialize Sentry early
initSentry();

function SplashScreenAnimation({ onFinish }: { onFinish: () => void }) {
    const [fadeAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => onFinish());
        }, 2000);
    }, [fadeAnim, onFinish]);

    return (
        <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
            <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>CONTRATTO</Text>
            </View>
            <ActivityIndicator size="small" color={Colors.white} style={{ marginTop: 20 }} />
        </Animated.View>
    );
}

function RootLayoutNav() {
    const { session, profile, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    const [splashFinished, setSplashFinished] = useState(false);
    const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);

    useEffect(() => {
        async function checkIntro() {
            const val = await AsyncStorage.getItem('HAS_SEEN_INTRO');
            setHasSeenIntro(val === 'true');
        }
        checkIntro();
    }, []);

    useEffect(() => {
        if (hasSeenIntro === false) {
            AsyncStorage.getItem('HAS_SEEN_INTRO').then(val => {
                if (val === 'true') {
                    setHasSeenIntro(true);
                    logger.log('Intro state updated: user has seen intro.');
                }
            });
        }
    }, [segments, hasSeenIntro]);

    useEffect(() => {
        if (isLoading || !splashFinished || hasSeenIntro === null) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inOnboarding = segments.includes('onboarding');
        const inIntro = segments.includes('intro');
        const isBrowse = segments.includes('browse');
        const isCompanyDetails = segments[0] === 'company';

        if (profile) {
            logger.log(`RootNav: Session: ${!!session}, Profile: ${!!profile}, UserType: ${profile?.user_type}, Role: ${profile?.role}, Segments: ${segments.join('/')}`);
        }

        // 1. Se não viu a introdução, sempre redireciona para lá
        if (!hasSeenIntro && !inIntro) {
            router.replace('/(auth)/intro');
            return;
        }

        // Se já viu a intro, mas está nela, redireciona para login (ou tabs se logado)
        if (hasSeenIntro && inIntro) {
            if (session) {
                router.replace('/(tabs)');
            } else {
                router.replace('/(auth)/login');
            }
            return;
        }

        // 2. Lógica de Autenticação/Onboarding
        if (!session) {
            // Permitimos ver browse/company profile sem login
            if (isBrowse || isCompanyDetails || inAuthGroup) return;
            router.replace('/(auth)/login');
        } else {
            // Logado
            // Se o perfil ainda não existe ou não tem role selecionado
            if (!profile || !profile.user_type) {
                if (!inOnboarding) {
                    logger.log('RootNav: Usuário sem perfil completo, enviando para onboarding.');
                    router.replace('/(auth)/onboarding');
                }
            } 
            // Se tem role e está em telas de auth/intro/onboarding, manda pras tabs
            else {
                if (segments.join('/') === '' || inAuthGroup || inOnboarding || inIntro) {
                    logger.log('RootNav: Usuário autenticado, enviando para tabs.');
                    router.replace('/(tabs)');
                }
            }
        }
    }, [session, profile, isLoading, segments, splashFinished, hasSeenIntro]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                // Notificações removidas do Expo Go no SDK 53
                if (Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
                    try {
                        const Notifications = require('expo-notifications');
                        Notifications.setBadgeCountAsync(0).catch(() => {});
                    } catch (e) {}
                }
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        if (Platform.OS === 'ios') {
            requestTrackingPermissionsAsync().catch(err =>
                logger.warn('Failed to request tracking permissions', err)
            );
        }
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="company/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="company/service/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="company/book/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="company/checkout/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="orders/chat" options={{ headerShown: false }} />
                <Stack.Screen name="orders/schedule/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="company/form/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="company/manage-services" options={{ headerShown: false }} />
                <Stack.Screen name="company/finance" options={{ headerShown: false }} />
                <Stack.Screen name="orders/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="orders/review" options={{ headerShown: false }} />
            </Stack>

            {(!splashFinished || isLoading) && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
                    <SplashScreenAnimation onFinish={() => setSplashFinished(true)} />
                </View>
            )}
        </View>
    );
}

export default function RootLayout() {
    return (
        <ErrorBoundary>
            <StripeProvider
                publishableKey={STRIPE_PUBLISHABLE_KEY}
                merchantIdentifier="merchant.com.contratto"
            >
                <AuthProvider>
                    <RootLayoutNav />
                </AuthProvider>
            </StripeProvider>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    splashContainer: {
        flex: 1,
        backgroundColor: Colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        color: Colors.white,
        fontWeight: '900',
        fontSize: 36,
        letterSpacing: -1,
    },
});
