import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Shadows } from '../../utils/theme';
import * as Haptics from 'expo-haptics';
import { logger } from '../../utils/logger';

export default function OnboardingScreen() {
    const router = useRouter();
    const { user, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [selectedRole, setSelectedRole] = useState<'client' | 'company' | null>(null);

    const handleSelectRole = async (selectedType: 'client' | 'company') => {
        if (!user) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedRole(selectedType);
        setLoading(true);
        setErrorMsg('');

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    user_type: selectedType,
                    role: 'user' // Reset role to 'user' in case it was modified
                })
                .eq('id', user.id);

            if (error) {
                logger.error('Erro ao atualizar o perfil:', error);
                setErrorMsg('Ocorreu um erro ao salvar a preferência. Tente novamente.');
                setLoading(false);
                setSelectedRole(null);
                return;
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await refreshProfile();
            router.replace('/(tabs)');
        } catch (error: any) {
            setErrorMsg(error.message);
            setLoading(false);
            setSelectedRole(null);
        }
    };

    return (
        <View style={styles.container} aria-label="Boas Vindas">
            <View style={styles.header}>
                <Text style={styles.title}>Bem-vindo!</Text>
                <Text style={styles.subtitle}>Como você deseja usar o aplicativo?</Text>
            </View>

            {errorMsg ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
            ) : null}

            <View style={styles.cardsContainer}>
                <TouchableOpacity
                    style={[
                        styles.card,
                        selectedRole === 'client' && styles.cardSelected,
                        loading && selectedRole !== 'client' && styles.cardDisabled,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectRole('client')}
                    disabled={loading}
                >
                    <View style={styles.cardContent}>
                        <View style={[styles.iconContainer, { backgroundColor: Colors.primaryLight }]}>
                            <Text style={styles.icon}>👋</Text>
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>Sou Cliente</Text>
                            <Text style={styles.cardDesc}>
                                Quero buscar serviços, agendar horários e encontrar os melhores profissionais.
                            </Text>
                        </View>
                    </View>
                    {selectedRole === 'client' && loading && (
                        <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.card,
                        selectedRole === 'company' && styles.cardSelected,
                        loading && selectedRole !== 'company' && styles.cardDisabled,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectRole('company')}
                    disabled={loading}
                >
                    <View style={styles.cardContent}>
                        <View style={[styles.iconContainer, { backgroundColor: '#FFF5F0' }]}>
                            <Text style={styles.icon}>🚀</Text>
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>Sou Profissional</Text>
                            <Text style={styles.cardDesc}>
                                Quero oferecer meus serviços, receber agendamentos e gerenciar meu negócio.
                            </Text>
                        </View>
                    </View>
                    {selectedRole === 'company' && loading && (
                        <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Você poderá usar a mesma conta para as duas funções no futuro, caso deseje.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        paddingTop: 80,
    },
    header: {
        marginBottom: Spacing.xxl,
        marginTop: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: Spacing.md,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        color: Colors.textSecondary,
        lineHeight: 26,
    },
    errorContainer: {
        backgroundColor: Colors.errorLight,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    errorText: {
        color: Colors.error,
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    cardsContainer: {
        flex: 1,
        gap: 20,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1.5,
        borderColor: Colors.border,
        ...Shadows.sm,
    },
    cardSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    cardDisabled: {
        opacity: 0.4,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20,
    },
    icon: {
        fontSize: 32,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    cardDesc: {
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    loader: {
        position: 'absolute',
        top: Spacing.lg,
        right: Spacing.lg,
    },
    footer: {
        paddingBottom: Spacing.xxl,
        alignItems: 'center',
    },
    footerText: {
        textAlign: 'center',
        color: Colors.textTertiary,
        fontSize: 14,
        lineHeight: 20,
        paddingHorizontal: 20,
    },
});
