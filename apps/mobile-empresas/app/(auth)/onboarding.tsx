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

    React.useEffect(() => {
        if (user && !loading) {
            handleSelectRole('company');
        }
    }, [user]);

    return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} aria-label="Aguarde">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ marginTop: 24, fontSize: 16, color: Colors.textSecondary, fontWeight: '600' }}>
                Configurando seu perfil da empresa...
            </Text>
            {errorMsg ? (
                <Text style={{ marginTop: 16, color: Colors.error, textAlign: 'center' }}>{errorMsg}</Text>
            ) : null}
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
