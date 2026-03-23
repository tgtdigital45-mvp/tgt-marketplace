import React, { useState } from 'react';
import { APP_VERSION } from '../../utils/version';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
    ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../utils/theme';
import FadeInView from '../../components/ui/FadeInView';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, profile, refreshProfile } = useAuth();

    const [isSigningOut, setIsSigningOut] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const handlePickAvatar = async () => {
        if (!user) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão', 'Precisamos da permissão para acessar suas fotos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
        });

        if (result.canceled || !result.assets?.[0]) return;

        setUploadingAvatar(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const asset = result.assets[0];
            const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${user.id}/avatar.${ext}`;

            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const { error: uploadErr } = await supabase.storage.from('avatars')
                .upload(fileName, arrayBuffer, { contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`, upsert: true });

            if (uploadErr) throw uploadErr;

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
            const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

            const { error: updateErr } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
            if (updateErr) throw updateErr;

            await refreshProfile();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível enviar a foto.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSignOut = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert('Sair da Conta', 'Deseja mesmo encerrar sua sessão?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Sair', style: 'destructive', onPress: async () => {
                    setIsSigningOut(true);
                    await supabase.auth.signOut();
                }
            },
        ]);
    };


    const navigateTo = (path: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(path as any);
    };

    const isProvider = profile?.user_type === 'company';
    const fullName = profile?.full_name || 'Usuário';
    const names = profile?.full_name?.split(' ') || [];
    const initials = [names[0]?.[0], names.length > 1 ? names[names.length - 1]?.[0] : ''].filter(Boolean).join('').toUpperCase() || '?';
    const hasAvatar = !!profile?.avatar_url;

    const renderMenuItem = (icon: any, title: string, subtitle: string, onPress: () => void, color = Colors.primary) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.menuIconBox, { backgroundColor: `${color}10` }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>{title}</Text>
                <Text style={styles.menuItemSub}>{subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.border} />
        </TouchableOpacity>
    );

    if (!profile) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.scroll}>
                    <Skeleton width={100} height={100} borderRadius={50} style={{ alignSelf: 'center', marginBottom: 20 }} />
                    <Skeleton width={200} height={30} borderRadius={8} style={{ alignSelf: 'center', marginBottom: 40 }} />
                    <Skeleton width="100%" height={240} borderRadius={24} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']} aria-label="Perfil">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <FadeInView delay={100}>
                    <View style={styles.heroSection}>
                        <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} disabled={uploadingAvatar}>
                            {hasAvatar ? (
                                <Image source={{ uri: profile!.avatar_url! }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarCircle}>
                                    <Text style={styles.avatarText}>{initials}</Text>
                                </View>
                            )}
                            <View style={styles.cameraBadge}>
                                {uploadingAvatar ? <ActivityIndicator size={12} color={Colors.white} /> : <Ionicons name="camera" size={14} color={Colors.white} />}
                            </View>
                        </TouchableOpacity>

                        <Text style={styles.heroName}>{fullName}</Text>
                        <View style={styles.roleBadge}>
                            <Ionicons name={isProvider ? 'briefcase' : 'person'} size={12} color={Colors.primary} />
                            <Text style={styles.roleText}>{isProvider ? 'PRESTADOR' : 'CLIENTE'}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.editProfileBtn}
                            onPress={() => navigateTo('/profile/edit')}
                        >
                            <Ionicons name="create-outline" size={16} color={Colors.primary} />
                            <Text style={styles.editProfileText}>Editar Perfil</Text>
                        </TouchableOpacity>
                    </View>
                </FadeInView>

                {isProvider && (
                    <FadeInView delay={200} translateY={10}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Meu Negócio</Text>
                            <View style={styles.card}>
                                {renderMenuItem('stats-chart-outline', 'Faturamento', 'Ganhos e histórico financeiro', () => navigateTo('/company/finance'), Colors.success)}
                                <View style={styles.divider} />
                                {renderMenuItem('calendar-outline', 'Agenda', 'Calendário de compromissos', () => navigateTo('/company/calendar'), Colors.info)}
                                <View style={styles.divider} />
                                {renderMenuItem('list-outline', 'Serviços', 'Gerencie seu catálogo', () => navigateTo('/company/manage-services'), '#0EA5E9')}
                                <View style={styles.divider} />
                                {renderMenuItem('storefront-outline', 'Vitrine', 'Perfil público da empresa', () => navigateTo('/company/storefront'), Colors.warning)}
                            </View>
                        </View>
                    </FadeInView>
                )}

                {!isProvider && (
                    <FadeInView delay={200} translateY={10}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Minhas Informações</Text>
                            <View style={styles.card}>
                                {renderMenuItem('home-outline', 'Meus Endereços', 'Gerencie locais de agendamento', () => navigateTo('/profile/addresses'), Colors.info)}
                                <View style={styles.divider} />
                                {renderMenuItem('receipt-outline', 'Meus Pagamentos', 'Histórico de transações', () => navigateTo('/profile/financial'), Colors.success)}
                                <View style={styles.divider} />
                                {renderMenuItem('heart-outline', 'Favoritos', 'Profissionais salvos', () => navigateTo('/profile/favorites'), Colors.error)}
                            </View>
                        </View>
                    </FadeInView>
                )}

                <FadeInView delay={300} translateY={10}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sistema</Text>
                        <View style={styles.card}>
                            {renderMenuItem('settings-outline', 'Configurações', 'Conta e privacidade', () => navigateTo('/profile/settings'), Colors.textSecondary)}
                            <View style={styles.divider} />
                            {renderMenuItem('help-buoy-outline', 'Ajuda', 'Suporte técnico', () => navigateTo('/profile/support'), Colors.primary)}
                        </View>
                    </View>
                </FadeInView>

                {profile?.user_type === 'admin' || user?.email === 'admin@contratto.app' ? (
                    <FadeInView delay={350} translateY={10}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Administração</Text>
                            <View style={styles.card}>
                                {renderMenuItem('shield-checkmark-outline', 'Moderação', 'Gerenciar denúncias e usuários', () => navigateTo('/admin/moderation'), Colors.error)}
                            </View>
                        </View>
                    </FadeInView>
                ) : null}

                <FadeInView delay={400} translateY={10}>
                    <View style={styles.section}>
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut} disabled={isSigningOut}>
                            {isSigningOut ? (
                                <ActivityIndicator color={Colors.error} />
                            ) : (
                                <>
                                    <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                                    <Text style={styles.logoutText}>Encerrar Sessão</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </FadeInView>


                <View style={styles.footer}>
                    <Text style={styles.versionText}>CONTRATTO Premium v{APP_VERSION}</Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {isSigningOut && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }]}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={{ marginTop: 16, fontWeight: '800', color: Colors.text, fontSize: 16 }}>
                        Encerrando sessão...
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },

    heroSection: { alignItems: 'center', marginBottom: Spacing.xl },
    avatarWrapper: { position: 'relative', marginBottom: Spacing.md, ...Shadows.md },
    avatarImage: { width: 104, height: 104, borderRadius: 52, backgroundColor: Colors.white, borderWidth: 4, borderColor: Colors.white },
    avatarCircle: { width: 104, height: 104, borderRadius: 52, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: Colors.white },
    avatarText: { fontSize: 34, fontWeight: '900', color: Colors.white, letterSpacing: 1 },
    cameraBadge: {
        position: 'absolute', bottom: 2, right: 2,
        backgroundColor: Colors.text, width: 32, height: 32, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: Colors.white,
    },

    heroName: { ...Typography.h2, color: Colors.text, marginBottom: 8 },
    roleBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.white,
        paddingHorizontal: 16, paddingVertical: 6,
        borderRadius: BorderRadius.full, gap: 6,
        borderWidth: 1, borderColor: Colors.borderLight,
        ...Shadows.sm
    },
    roleText: { color: Colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    editProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.primaryLight, borderRadius: 12 },
    editProfileText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },

    section: { marginBottom: Spacing.xl },
    sectionTitle: {
        ...Typography.caption, color: Colors.textTertiary,
        textTransform: 'uppercase', letterSpacing: 1,
        marginBottom: Spacing.sm, paddingLeft: 4,
        fontWeight: '800'
    },

    card: {
        backgroundColor: Colors.white, borderRadius: 24,
        overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight,
        ...Shadows.md,
    },
    divider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 72 },

    menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
    menuIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
    menuItemText: { flex: 1 },
    menuItemTitle: { ...Typography.bodySmall, fontWeight: '800', color: Colors.text, marginBottom: 2 },
    menuItemSub: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '500' },

    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: Colors.errorLight, paddingVertical: 18,
        borderRadius: 20, borderWidth: 1, borderColor: '#FFE4E4', gap: 10,
    },
    logoutText: { color: Colors.error, fontSize: 15, fontWeight: '800' },

    deleteAccountBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, gap: 8,
    },
    deleteAccountText: { color: Colors.textTertiary, fontSize: 13, fontWeight: '600' },

    footer: { alignItems: 'center', marginTop: Spacing.md },
    versionText: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '700' },
});
