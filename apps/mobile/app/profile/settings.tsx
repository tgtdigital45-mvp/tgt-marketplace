import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../utils/theme';
import { logger } from '../../utils/logger';
import { LEGAL_URLS, APP_VERSION } from '../../utils/version';

export default function SettingsScreen() {
    const router = useRouter();
    const { session } = useAuth();

    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [loading, setLoading] = useState(true);
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [passwordEmail, setPasswordEmail] = useState('');

    useEffect(() => {
        async function loadSettings() {
            if (!session?.user?.id) { setLoading(false); return; }
            try {
                const { data } = await supabase
                    .from('profiles')
                    .select('push_enabled, email_notifications')
                    .eq('id', session.user.id)
                    .single();

                if (data) {
                    setPushEnabled(data.push_enabled !== false);
                    setEmailAlerts(data.email_notifications !== false);
                }
            } catch (e) {
                logger.error('Erro ao carregar configurações:', e);
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, [session]);

    const handleTogglePush = async (value: boolean) => {
        setPushEnabled(value);
        if (!session?.user?.id) return;
        try {
            await supabase
                .from('profiles')
                .update({ push_enabled: value })
                .eq('id', session.user.id);

            if (!value) {
                await supabase
                    .from('push_tokens')
                    .update({ is_active: false })
                    .eq('user_id', session.user.id);
            }
        } catch (e) {
            logger.error('Erro ao salvar configuração push:', e);
            setPushEnabled(!value);
        }
    };

    const handleToggleEmail = async (value: boolean) => {
        setEmailAlerts(value);
        if (!session?.user?.id) return;
        try {
            await supabase
                .from('profiles')
                .update({ email_notifications: value })
                .eq('id', session.user.id);
        } catch (e) {
            logger.error('Erro ao salvar configuração email:', e);
            setEmailAlerts(!value);
        }
    };

    const handleChangePassword = () => {
        setPasswordEmail(session?.user?.email || '');
        setPasswordModalVisible(true);
    };

    const handleSendPasswordReset = async () => {
        if (!passwordEmail.trim()) return;
        setChangingPassword(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(passwordEmail.trim());
            if (error) throw error;
            setPasswordModalVisible(false);
            Alert.alert('Enviado!', 'Verifique seu e-mail para redefinir a senha.');
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Não foi possível enviar o e-mail.');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleOpenPrivacy = () => {
        WebBrowser.openBrowserAsync(LEGAL_URLS.PRIVACY_POLICY);
    };

    const handleOpenTerms = () => {
        WebBrowser.openBrowserAsync(LEGAL_URLS.TERMS_OF_USE);
    };

    const handleClearCache = async () => {
        Alert.alert(
            'Limpar Cache',
            'Isso irá limpar dados de busca e configurações locais. Deseja continuar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Limpar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const keysToKeep = ['supabase-auth-token'];
                            const allKeys = await AsyncStorage.getAllKeys();
                            const keysToRemove = allKeys.filter(k => !keysToKeep.some(keep => k.includes(keep)));
                            await AsyncStorage.multiRemove(keysToRemove);
                            Alert.alert('Sucesso', 'Cache local limpo com sucesso!');
                        } catch (e) {
                            Alert.alert('Erro', 'Não foi possível limpar o cache.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']} aria-label="Configurações">
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configurações</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.sectionTitle}>Notificações</Text>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <View style={styles.rowInfo}>
                            <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
                            <Text style={styles.rowText}>Notificações Push</Text>
                        </View>
                        <Switch
                            value={pushEnabled}
                            onValueChange={handleTogglePush}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            disabled={loading}
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <View style={styles.rowInfo}>
                            <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
                            <Text style={styles.rowText}>Avisos por E-mail</Text>
                        </View>
                        <Switch
                            value={emailAlerts}
                            onValueChange={handleToggleEmail}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            disabled={loading}
                        />
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Segurança e Acesso</Text>
                <View style={styles.card}>
                    <TouchableOpacity
                        style={[styles.row, { paddingVertical: 16 }]}
                        onPress={handleChangePassword}
                        disabled={changingPassword}
                    >
                        <View style={styles.rowInfo}>
                            <Ionicons name="key-outline" size={20} color={Colors.textSecondary} />
                            <Text style={styles.rowText}>Alterar Senha</Text>
                        </View>
                        {changingPassword ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Legal e Transparência</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={[styles.row, { paddingVertical: 16 }]} onPress={handleOpenPrivacy}>
                        <View style={styles.rowInfo}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.textSecondary} />
                            <Text style={styles.rowText}>Política de Privacidade</Text>
                        </View>
                        <Ionicons name="open-outline" size={20} color={Colors.textTertiary} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={[styles.row, { paddingVertical: 16 }]} onPress={handleOpenTerms}>
                        <View style={styles.rowInfo}>
                            <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} />
                            <Text style={styles.rowText}>Termos de Uso</Text>
                        </View>
                        <Ionicons name="open-outline" size={20} color={Colors.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* Zona de Perigo */}
                <View style={[styles.section, { marginTop: 32 }]}>
                    <Text style={[styles.sectionTitle, { color: Colors.error }]}>Zona de Perigo</Text>
                    <View style={[styles.card, { borderColor: Colors.errorLight }]}>
                        <TouchableOpacity
                            style={styles.dangerBtn}
                            onPress={() => {
                                Alert.alert(
                                    "Excluir Conta",
                                    "Esta ação é irreversível e apagará todos os seus dados. Deseja continuar?",
                                    [
                                        { text: "Cancelar", style: "cancel" },
                                        {
                                            text: "Excluir para Sempre",
                                            style: "destructive",
                                            onPress: async () => {
                                                setLoading(true);
                                                try {
                                                    const { data: { session: currentSession } } = await supabase.auth.getSession();
                                                    if (!currentSession) throw new Error('No session');

                                                    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Authorization': `Bearer ${currentSession.access_token}`,
                                                            'Content-Type': 'application/json',
                                                        },
                                                    });

                                                    if (!response.ok) {
                                                        const errorData = await response.json();
                                                        throw new Error(errorData.error || 'Failed to delete account');
                                                    }

                                                    await supabase.auth.signOut();
                                                    Alert.alert("Conta Excluída", "Seus dados foram removidos.");
                                                } catch (e: any) {
                                                    logger.error('Account deletion error:', e);
                                                    Alert.alert("Erro", "Não foi possível excluir sua conta. Contate o suporte.");
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }
                                        }
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color={Colors.error} />
                            <Text style={styles.dangerBtnText}>Excluir Minha Conta</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.dangerNote}>
                        Seus dados serão removidos permanentemente conforme exigido por Apple e Google.
                    </Text>
                </View>

                <View style={styles.appVersion}>
                    <Text style={styles.versionText}>CONTRATTO v{APP_VERSION}</Text>
                    <Text style={styles.copyrightText}>© 2026 Contratto Digital</Text>
                </View>
            </ScrollView>

            <Modal
                visible={passwordModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPasswordModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Alterar Senha</Text>
                        <Text style={styles.modalMessage}>Digite seu e-mail para receber o link de redefinição:</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={passwordEmail}
                            onChangeText={setPasswordEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            placeholder="seu@email.com"
                            placeholderTextColor={Colors.textTertiary}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalBtnCancel}
                                onPress={() => setPasswordModalVisible(false)}
                                disabled={changingPassword}
                            >
                                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalBtnConfirm}
                                onPress={handleSendPasswordReset}
                                disabled={changingPassword || !passwordEmail.trim()}
                            >
                                {changingPassword
                                    ? <ActivityIndicator size="small" color={Colors.white} />
                                    : <Text style={styles.modalBtnConfirmText}>Enviar</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },

    scroll: { padding: 20, paddingBottom: 40 },

    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: 16,
        paddingLeft: 8
    },
    copyrightText: {
        fontSize: 12,
        color: Colors.textTertiary,
        marginTop: 4,
    },
    card: { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },

    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    rowInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowText: { fontSize: 16, color: Colors.text, fontWeight: '500' },

    divider: {
        height: 1,
        backgroundColor: Colors.borderLight,
        marginLeft: 52,
    },
    dangerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    dangerBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.error,
    },
    dangerNote: {
        fontSize: 12,
        color: Colors.textTertiary,
        marginTop: 12,
        paddingHorizontal: 4,
        lineHeight: 18,
    },

    appVersion: { marginTop: 40, alignItems: 'center' },
    versionText: { color: Colors.textTertiary, fontSize: 13, fontWeight: '500' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 24, width: '100%' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
    modalMessage: { fontSize: 14, color: Colors.textSecondary, marginBottom: 16 },
    modalInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.text, marginBottom: 20 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
    modalBtnCancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
    modalBtnConfirm: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' },
    modalBtnConfirmText: { fontSize: 15, fontWeight: '600', color: Colors.white },
});
