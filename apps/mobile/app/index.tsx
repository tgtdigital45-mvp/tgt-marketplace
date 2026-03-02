import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/providers/AuthProvider';

// Conditional import for Lottie to avoid web build errors
let LottieView: any;
if (Platform.OS !== 'web') {
    LottieView = require('lottie-react-native');
}

export default function SplashScreen() {
    const router = useRouter();
    const { session, loading } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in the animation container
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        // Redirect after animation (3.5 seconds) and when auth loading is finished
        if (!loading) {
            const timer = setTimeout(() => {
                if (session) {
                    router.replace('/(tabs)');
                } else {
                    router.replace('/(auth)/login');
                }
            }, 3500);

            return () => clearTimeout(timer);
        }
    }, [loading, session]);

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <Animated.View style={[styles.animationContainer, { opacity: fadeAnim }]}>
                {Platform.OS !== 'web' && LottieView ? (
                    <LottieView
                        source={require('../assets/logo_anim.json')}
                        autoPlay
                        loop={false}
                        style={styles.lottie}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={styles.webLogoContainer}>
                        <Text style={styles.webLogoText}>CONTRATO</Text>
                        <View style={styles.webLogoUnderline} />
                    </View>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a', // brand-primary
        alignItems: 'center',
        justifyContent: 'center',
    },
    animationContainer: {
        width: '80%',
        height: '80%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lottie: {
        width: 300,
        height: 300,
    },
    webLogoContainer: {
        alignItems: 'center',
    },
    webLogoText: {
        fontSize: 48,
        color: '#2563eb',
        fontWeight: '900',
        letterSpacing: -1,
    },
    webLogoUnderline: {
        width: 100,
        height: 4,
        backgroundColor: '#2563eb',
        marginTop: 8,
        borderRadius: 2,
    }
});
