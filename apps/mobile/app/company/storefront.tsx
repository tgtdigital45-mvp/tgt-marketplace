import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../utils/theme';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import FadeInView from '../../components/ui/FadeInView';
import EmptyState from '../../components/ui/EmptyState';
import * as Haptics from 'expo-haptics';
import { logger } from '../../utils/logger';

export default function StorefrontScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [company, setCompany] = useState<any>(null);

    const [businessName, setBusinessName] = useState('');
    const [description, setDescription] = useState('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState(true);
    const [portfolio, setPortfolio] = useState<any[]>([]);

    const fetchCompany = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(false);
        try {
            const { data, error: fetchError } = await supabase.from('companies').select('id, business_name, bio, logo_url, cover_url, is_public, portfolio, description').eq('owner_id', user.id).maybeSingle();
            if (fetchError) throw fetchError;
            if (data) {
                setCompany(data);
                setBusinessName(data.business_name || '');
                setDescription(data.description || '');
                setLogoUrl(data.logo_url);
                setCoverUrl(data.cover_url);
                setIsPublic(data.is_public !== false);
                setPortfolio(data.portfolio || []);
            }
        } catch (e) {
            logger.error('Fetch Storefront Error:', e);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchCompany(); }, [fetchCompany]);

    const handlePickImage = async (type: 'logo' | 'cover' | 'portfolio') => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão Negada', 'Precisamos de acesso às suas fotos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: type !== 'portfolio',
            aspect: type === 'logo' ? [1, 1] : type === 'cover' ? [16, 9] : undefined,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0] && company) {
            setSaving(true);
            try {
                const asset = result.assets[0];
                const ext = asset.uri.split('.').pop() || 'jpg';
                const folder = type === 'portfolio' ? 'portfolios' : `${type}s`;
                const fileName = `${folder}/${company.id}/${Date.now()}.${ext}`;

                const response = await fetch(asset.uri);
                const blob = await response.blob();
                const arrayBuffer = await new Response(blob).arrayBuffer();

                await supabase.storage.from('marketplace').upload(fileName, arrayBuffer, {
                    contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
                    upsert: true
                });

                const { data: urlData } = supabase.storage.from('marketplace').getPublicUrl(fileName);
                const finalUrl = `${urlData.publicUrl}?t=${Date.now()}`;

                if (type === 'logo') {
                    setLogoUrl(finalUrl);
                    await supabase.from('companies').update({ logo_url: finalUrl }).eq('id', company.id);
                } else if (type === 'cover') {
                    setCoverUrl(finalUrl);
                    await supabase.from('companies').update({ cover_url: finalUrl }).eq('id', company.id);
                } else {
                    const newItem = { id: Date.now().toString(), url: finalUrl, type: 'image' };
                    const newPortfolio = [...portfolio, newItem];
                    setPortfolio(newPortfolio);
                    await supabase.from('companies').update({ portfolio: newPortfolio }).eq('id', company.id);
                }

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
                logger.error(e);
                Alert.alert('Erro', 'Erro ao carregar imagem.');
            } finally {
                setSaving(false);
            }
        }
    };

    const handleRemovePortfolioItem = async (id: string) => {
        if (!company) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const newPortfolio = portfolio.filter(item => item.id !== id);
        setPortfolio(newPortfolio);

        try {
            await supabase.from('companies').update({ portfolio: newPortfolio }).eq('id', company.id);
        } catch (e) {
            logger.error(e);
        }
    };

    const handleSave = async () => {
        if (!company) return;
        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await supabase.from('companies').update({
                business_name: businessName,
                description: description,
                is_public: isPublic
            }).eq('id', company.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Sucesso', 'Perfil da vitrine atualizado!');
        } catch (e) {
            logger.error(e);
            Alert.alert('Erro', 'Erro ao salvar alterações.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.navHeader}><Skeleton width={40} height={40} borderRadius={20} /><Skeleton width={120} height={20} /><View style={{ width: 40 }} /></View>
                <View style={{ padding: 24 }}><Skeleton width="100%" height={200} borderRadius={30} style={{ marginBottom: 24 }} /><Skeleton width="100%" height={60} borderRadius={20} /></View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <View style={styles.navHeader}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Minha Vitrine</Text>
                    <View style={{ width: 44 }} />
                </View>
                <EmptyState
                    icon="alert-circle-outline"
                    title="Erro ao carregar vitrine"
                    subtitle="Não foi possível obter os dados da sua vitrine. Tente novamente."
                    actionLabel="Tentar Novamente"
                    onAction={fetchCompany}
                    isError={true}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Minha Vitrine</Text>
                <TouchableOpacity onPress={() => router.push(`/company/${company?.id}`)} style={styles.previewBtn}>
                    <Ionicons name="eye-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <FadeInView delay={100} translateY={10}>
                    <View style={styles.mediaSection}>
                        <TouchableOpacity style={styles.coverUpload} onPress={() => handlePickImage('cover')}>
                            {coverUrl ? <Image source={{ uri: coverUrl }} style={styles.coverImg} /> : <View style={styles.coverPlaceholder}><Ionicons name="image-outline" size={40} color={Colors.border} /><Text style={styles.placeholderText}>Adicionar Capa</Text></View>}
                            <View style={styles.editBadge}><Ionicons name="camera" size={16} color={Colors.white} /></View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.logoUpload} onPress={() => handlePickImage('logo')}>
                            {logoUrl ? <Image source={{ uri: logoUrl }} style={styles.logoImg} /> : <View style={styles.logoPlaceholder}><Ionicons name="business" size={30} color={Colors.border} /></View>}
                            <View style={[styles.editBadge, styles.logoBadge]}><Ionicons name="camera" size={12} color={Colors.white} /></View>
                        </TouchableOpacity>
                    </View>
                </FadeInView>

                <FadeInView delay={300} translateY={20}>
                    <View style={styles.card}>
                        <View style={styles.switchRow}>
                            <View>
                                <Text style={styles.cardTitle}>Status do Perfil</Text>
                                <Text style={styles.cardSubtitle}>{isPublic ? 'Público e visível no marketplace' : 'Privado (oculto na busca)'}</Text>
                            </View>
                            <Switch
                                value={isPublic}
                                onValueChange={setIsPublic}
                                trackColor={{ false: Colors.border, true: Colors.success + '40' }}
                                thumbColor={isPublic ? Colors.success : Colors.white}
                            />
                        </View>

                        <Text style={styles.inputLabel}>NOME EXIBIDO</Text>
                        <TextInput
                            style={styles.input}
                            value={businessName}
                            onChangeText={setBusinessName}
                            placeholder="Nome do seu negócio"
                        />

                        <Text style={styles.inputLabel}>SOBRE SEU NEGÓCIO (BIO)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            placeholder="Escreva algo atrativo para seus clientes..."
                        />

                        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                            {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Salvar Informações</Text>}
                        </TouchableOpacity>
                    </View>
                </FadeInView>

                <FadeInView delay={500} translateY={20}>
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={styles.cardTitle}>Meu Portfólio</Text>
                                <Text style={styles.cardSubtitle}>Imagens dos seus melhores trabalhos</Text>
                            </View>
                            <TouchableOpacity style={styles.addPortfolioBtn} onPress={() => handlePickImage('portfolio')}>
                                <Ionicons name="add" size={24} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.portfolioScroll}>
                            {portfolio.length === 0 ? (
                                <View style={styles.emptyPortfolio}>
                                    <Ionicons name="images-outline" size={30} color={Colors.border} />
                                    <Text style={styles.emptyPortfolioText}>Adicione fotos para atrair clientes</Text>
                                </View>
                            ) : (
                                portfolio.map((item) => (
                                    <View key={item.id} style={styles.portfolioItemContainer}>
                                        <Image source={{ uri: item.url }} style={styles.portfolioThumb} />
                                        <TouchableOpacity
                                            style={styles.removeBtn}
                                            onPress={() => handleRemovePortfolioItem(item.id)}
                                        >
                                            <Ionicons name="close-circle" size={24} color={Colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </FadeInView>

                <View style={styles.tipBox}>
                    <Ionicons name="bulb-outline" size={20} color={Colors.warning} />
                    <Text style={styles.tipText}>Dica: Fotos de boa qualidade e uma biografia clara aumentam as chances de fechamento em até 40%.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, backgroundColor: Colors.white, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, ...Shadows.sm },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...Typography.h4, color: Colors.text, fontWeight: '900' },
    previewBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },

    scroll: { padding: 24, gap: 24, paddingBottom: 60 },
    mediaSection: { height: 260, marginBottom: 20 },
    coverUpload: { width: '100%', height: 200, borderRadius: 32, overflow: 'hidden', backgroundColor: Colors.white, ...Shadows.sm },
    coverImg: { width: '100%', height: '100%' },
    coverPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    placeholderText: { fontSize: 13, fontWeight: '700', color: Colors.textTertiary },
    editBadge: { position: 'absolute', bottom: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.text, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: Colors.white },

    logoUpload: { position: 'absolute', bottom: 0, left: 24, width: 90, height: 90, borderRadius: 32, backgroundColor: Colors.white, ...Shadows.md, padding: 4 },
    logoImg: { width: '100%', height: '100%', borderRadius: 28 },
    logoPlaceholder: { flex: 1, backgroundColor: Colors.surface, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    logoBadge: { bottom: -4, right: -4, width: 28, height: 28, borderRadius: 14 },

    card: { backgroundColor: Colors.white, borderRadius: 32, padding: 24, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Colors.divider },
    cardTitle: { ...Typography.label, color: Colors.text, fontWeight: '900' },
    cardSubtitle: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '600' },

    inputLabel: { fontSize: 11, fontWeight: '900', color: Colors.textTertiary, marginBottom: 10, paddingLeft: 4, letterSpacing: 1 },
    input: { backgroundColor: Colors.surface, borderRadius: 20, padding: 18, marginBottom: 24, ...Typography.bodySmall, color: Colors.text, fontWeight: '700', borderWidth: 1, borderColor: Colors.borderLight },
    textArea: { height: 120, textAlignVertical: 'top' },

    saveBtn: { backgroundColor: Colors.primary, paddingVertical: 20, borderRadius: 24, alignItems: 'center', ...Shadows.lg },
    saveBtnText: { color: Colors.white, fontWeight: '900', fontSize: 17 },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    addPortfolioBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },

    portfolioScroll: { gap: 16, paddingRight: 24 },
    emptyPortfolio: { width: 280, height: 160, borderRadius: 24, backgroundColor: Colors.surface, borderStyle: 'dotted', borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', gap: 12 },
    emptyPortfolioText: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '700' },

    portfolioItemContainer: { width: 220, height: 160, position: 'relative' },
    portfolioThumb: { width: '100%', height: '100%', borderRadius: 24, backgroundColor: Colors.surface },
    removeBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: Colors.white, borderRadius: 12, ...Shadows.sm },

    tipBox: { flexDirection: 'row', gap: 12, backgroundColor: Colors.warning + '10', padding: 20, borderRadius: 24, alignItems: 'center' },
    tipText: { flex: 1, fontSize: 12, fontWeight: '700', color: Colors.text, lineHeight: 18 }
});
