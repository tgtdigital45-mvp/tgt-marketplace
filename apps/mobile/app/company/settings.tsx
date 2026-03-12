import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../utils/theme';
import FadeInView from '../../components/ui/FadeInView';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import { logger } from '../../utils/logger';

export default function CompanySettingsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyId, setCompanyId] = useState('');

    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [radius, setRadius] = useState<string>('10');

    const fetchCompanyData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('id, address_lat, address_lng, coverage_radius_km')
                .eq('owner_id', user.id)
                .single();

            if (data) {
                setCompanyId(data.id);
                setLat(data.address_lat);
                setLng(data.address_lng);
                if (data.coverage_radius_km) {
                    setRadius(data.coverage_radius_km.toString());
                }
            }
        } catch (e) {
            logger.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCompanyData();
    }, [fetchCompanyData]);

    const handleGetLocation = async () => {
        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão Negada', 'Para encontrar clientes próximos, precisamos acessar sua localização.');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLat(location.coords.latitude);
            setLng(location.coords.longitude);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            logger.error(error);
            Alert.alert('Erro', 'Não foi possível obter a geolocalização.');
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!companyId) return;
        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { error } = await supabase
                .from('companies')
                .update({
                    address_lat: lat,
                    address_lng: lng,
                    coverage_radius_km: parseInt(radius) || 10
                })
                .eq('id', companyId);

            if (error) throw error;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Sucesso', 'Sua área de atuação foi atualizada.');
            router.back();
        } catch (error) {
            logger.error(error);
            Alert.alert('Erro', 'Ocorreu um erro ao salvar as configurações.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} aria-label="Configurações">
                <View style={styles.navHeader}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <Skeleton width={120} height={20} />
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.scrollContent}>
                    <Skeleton width="100%" height={240} borderRadius={24} style={{ marginBottom: 20 }} />
                    <Skeleton width="100%" height={160} borderRadius={24} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']} aria-label="Configurações">
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Área de Atuação</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <FadeInView delay={100} translateY={20}>
                    <View style={styles.cardInfo}>
                        <View style={styles.infoIconBox}>
                            <Ionicons name="map-outline" size={24} color={Colors.primary} />
                        </View>
                        <Text style={styles.cardInfoText}>
                            Sua localização e raio de atendimento determinam quais clientes verão seu perfil no marketplace.
                        </Text>
                    </View>
                </FadeInView>

                <FadeInView delay={200} translateY={10}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ponto Central</Text>
                        <Text style={styles.sectionSubtitle}>
                            Este é o ponto de origem para o cálculo da sua distância até o cliente.
                        </Text>

                        {lat && lng ? (
                            <View style={styles.locationActive}>
                                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                                <Text style={styles.locationActiveText}>Coordenadas fixadas com sucesso</Text>
                            </View>
                        ) : (
                            <View style={styles.locationInactive}>
                                <Ionicons name="alert-circle-outline" size={18} color={Colors.textTertiary} />
                                <Text style={styles.locationInactiveText}>Nenhuma localização definida</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.locationBtn}
                            onPress={handleGetLocation}
                            disabled={saving}
                            activeOpacity={0.7}
                        >
                            {saving ? (
                                <ActivityIndicator color={Colors.primary} />
                            ) : (
                                <>
                                    <Ionicons name="navigate" size={18} color={Colors.primary} />
                                    <Text style={styles.locationBtnText}>Capturar minha posição atual</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </FadeInView>

                <FadeInView delay={300} translateY={10}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Raio de Cobertura</Text>
                        <Text style={styles.sectionSubtitle}>
                            Em quantos quilômetros (km) você consegue se deslocar para atender um cliente?
                        </Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                keyboardType="number-pad"
                                value={radius}
                                onChangeText={setRadius}
                                maxLength={3}
                                placeholder="0"
                                placeholderTextColor={Colors.textTertiary}
                            />
                            <Text style={styles.inputSuffix}>quilômetros</Text>
                        </View>
                    </View>
                </FadeInView>

                <FadeInView delay={400} translateY={10}>
                    <TouchableOpacity
                        style={[styles.saveBtn, (!lat || saving) && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={!lat || saving}
                    >
                        {saving ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.saveBtnText}>Salvar Configurações</Text>
                        )}
                    </TouchableOpacity>

                    {!lat && (
                        <Text style={styles.warningText}>
                            * Capture sua localização antes de salvar.
                        </Text>
                    )}
                </FadeInView>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    navHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.white,
        ...Shadows.sm
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...Typography.h4, color: Colors.text },

    scrollContent: { padding: Spacing.lg },

    cardInfo: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        padding: 20,
        borderRadius: 24,
        marginBottom: Spacing.xl,
        gap: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.sm
    },
    infoIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    cardInfoText: { flex: 1, ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20, fontWeight: '600' },

    section: { marginBottom: 20, backgroundColor: Colors.white, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },
    sectionTitle: { ...Typography.h4, color: Colors.text, marginBottom: 8 },
    sectionSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 20, lineHeight: 18 },

    locationActive: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: 14, borderRadius: 14, marginBottom: 20, gap: 10, borderWidth: 1, borderColor: Colors.success },
    locationActiveText: { color: Colors.successDark, fontWeight: '700', fontSize: 13 },

    locationInactive: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 14, borderRadius: 14, marginBottom: 20, gap: 10, borderWidth: 1, borderColor: Colors.border },
    locationInactiveText: { color: Colors.textTertiary, fontWeight: '600', fontSize: 13 },

    locationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryLight, gap: 10 },
    locationBtnText: { color: Colors.primary, fontWeight: '800', fontSize: 14 },

    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16 },
    input: { flex: 1, paddingVertical: 16, ...Typography.h3, color: Colors.text, fontWeight: '900' },
    inputSuffix: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '700' },

    saveBtn: { backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: BorderRadius.lg, alignItems: 'center', marginTop: Spacing.xl, ...Shadows.md },
    saveBtnText: { ...Typography.button, color: Colors.white },

    warningText: { ...Typography.caption, color: Colors.error, textAlign: 'center', marginTop: 12, fontWeight: '700' },
});
