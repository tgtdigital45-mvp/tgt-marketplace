import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Image,
    StatusBar,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, BorderRadius, Spacing } from '../../utils/theme';
import * as WebBrowser from 'expo-web-browser';
import { LEGAL_URLS } from '../../utils/version';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Bem-vindo ao\nCONTRATTO',
        description: 'Encontre os melhores profissionais da sua região para qualquer tipo de serviço.',
        image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '2',
        title: 'Profissionais\nVerificados',
        description: 'Todos os prestadores são verificados para garantir qualidade e segurança no seu atendimento.',
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: '3',
        title: 'Agendamento\nFácil',
        description: 'Agende serviços em poucos toques e acompanhe tudo em tempo real pelo aplicativo.',
        image: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=800&q=80',
    },
];

export default function IntroScreen() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList<(typeof SLIDES)[0]>>(null);

    const handleContinue = async () => {
        if (currentIndex < SLIDES.length - 1) {
            const nextIndex = currentIndex + 1;
            flatListRef.current?.scrollToIndex({
                index: nextIndex,
                animated: true,
            });
            setCurrentIndex(nextIndex);
        } else {
            await AsyncStorage.setItem('HAS_SEEN_INTRO', 'true');
            router.replace('/(auth)/login');
        }
    };

    const handleOpenPrivacy = () => WebBrowser.openBrowserAsync(LEGAL_URLS.PRIVACY_POLICY);
    const handleOpenTerms = () => WebBrowser.openBrowserAsync(LEGAL_URLS.TERMS_OF_USE);

    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(nextIndex);
    };

    const renderItem = ({ item }: { item: (typeof SLIDES)[0] }) => (
        <View style={styles.slide}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.image} />
                <View style={styles.imageOverlay} />
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.paginationDots}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[styles.dot, currentIndex === index && styles.activeDot]}
                        />
                    ))}
                </View>

                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                keyExtractor={(item) => item.id}
                bounces={false}
            />

            <SafeAreaView style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={handleContinue}>
                    <Text style={styles.buttonText}>
                        {currentIndex === SLIDES.length - 1 ? 'Começar' : 'Continuar'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={async () => {
                        await AsyncStorage.setItem('HAS_SEEN_INTRO', 'true');
                        router.replace('/(tabs)/browse');
                    }}
                >
                    <Text style={styles.skipButtonText}>Explorar sem entrar</Text>
                </TouchableOpacity>

                <View style={styles.legalLinks}>
                    <TouchableOpacity onPress={handleOpenTerms}>
                        <Text style={styles.legalText}>Termos de Uso</Text>
                    </TouchableOpacity>
                    <Text style={styles.legalDivider}> • </Text>
                    <TouchableOpacity onPress={handleOpenPrivacy}>
                        <Text style={styles.legalText}>Privacidade</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.brand,
    },
    slide: {
        width,
        flex: 1,
    },
    imageContainer: {
        width: '100%',
        height: height * 0.55,
        backgroundColor: Colors.white,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    contentContainer: {
        flex: 1,
        padding: Spacing.xxl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paginationDots: {
        flexDirection: 'row',
        marginBottom: Spacing.xl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginHorizontal: 4,
    },
    activeDot: {
        width: 24,
        backgroundColor: Colors.white,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.white,
        textAlign: 'center',
        marginBottom: Spacing.md,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.xxl,
    },
    button: {
        backgroundColor: Colors.white,
        height: 56,
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.black,
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonText: {
        color: Colors.brand,
        fontSize: 16,
        fontWeight: '800',
    },
    skipButton: {
        marginTop: Spacing.sm,
        paddingVertical: Spacing.sm,
        alignItems: 'center',
    },
    skipButtonText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
    },
    legalLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingTop: Spacing.md,
        opacity: 0.6,
    },
    legalText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    legalDivider: {
        color: Colors.white,
        fontSize: 10,
    },
});
