import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, Typography, Shadows } from '../../utils/theme';
import { formatCPFCNPJ, isValidDocument, formatPhone } from '../../utils/validators';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import FadeInView from '../../components/ui/FadeInView';
import { logger } from '../../utils/logger';

type ProfileData = {
    first_name: string;
    last_name: string;
    phone: string;
    cpf: string;
    address_street: string;
    address_number: string;
    address_neighborhood: string;
    address_city: string;
    address_state: string;
    address_zip: string;
};

export default function EditProfileScreen() {
    const router = useRouter();
    const { session, refreshProfile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<ProfileData>({
        first_name: '',
        last_name: '',
        phone: '',
        cpf: '',
        address_street: '',
        address_number: '',
        address_neighborhood: '',
        address_city: '',
        address_state: '',
        address_zip: '',
    });

    useEffect(() => {
        async function fetchProfile() {
            if (!session?.user?.id) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('first_name, last_name, phone, cpf, address_street, address_number, address_neighborhood, address_city, address_state, address_zip')
                    .eq('id', session.user.id)
                    .single();

                if (error) throw error;
                if (data) {
                    setForm({
                        first_name: data.first_name || '',
                        last_name: data.last_name || '',
                        phone: data.phone || '',
                        cpf: data.cpf || '',
                        address_street: data.address_street || '',
                        address_number: data.address_number || '',
                        address_neighborhood: data.address_neighborhood || '',
                        address_city: data.address_city || '',
                        address_state: data.address_state || '',
                        address_zip: data.address_zip || '',
                    });
                }
            } catch (e) {
                logger.error('Error fetching profile:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [session]);

    const updateField = (key: keyof ProfileData, value: string) => {
        if (key === 'cpf') value = formatCPFCNPJ(value);
        if (key === 'phone') value = formatPhone(value);
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!session?.user?.id) return;
        if (!form.first_name.trim()) {
            Alert.alert('Atenção', 'O campo Nome é obrigatório.');
            return;
        }
        if (form.cpf && !isValidDocument(form.cpf)) {
            Alert.alert('Atenção', 'CPF/CNPJ inválido.');
            return;
        }

        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: form.first_name.trim(),
                    last_name: form.last_name.trim(),
                    phone: form.phone.trim(),
                    cpf: form.cpf.replace(/\D/g, ''),
                    address_street: form.address_street.trim(),
                    address_number: form.address_number.trim(),
                    address_neighborhood: form.address_neighborhood.trim(),
                    address_city: form.address_city.trim(),
                    address_state: form.address_state.trim().toUpperCase(),
                    address_zip: form.address_zip.replace(/\D/g, ''),
                })
                .eq('id', session.user.id);

            if (error) throw error;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await refreshProfile();
            Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
            router.back();
        } catch (e: any) {
            logger.error('Error saving profile:', e);
            Alert.alert('Erro', e.message || 'Não foi possível salvar o perfil.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.navHeader}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <Skeleton width={130} height={20} />
                    <View style={{ width: 40 }} />
                </View>
                <View style={{ padding: 24 }}>
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} width="100%" height={60} borderRadius={16} style={{ marginBottom: 16 }} />
                    ))}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Perfil</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <FadeInView delay={100} translateY={10}>
                        <View style={styles.card}>
                            <Text style={styles.sectionLabel}>DADOS PESSOAIS</Text>

                            <Text style={styles.inputLabel}>Nome *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.first_name}
                                onChangeText={(v) => updateField('first_name', v)}
                                placeholder="Seu nome"
                                placeholderTextColor={Colors.textTertiary}
                            />

                            <Text style={styles.inputLabel}>Sobrenome</Text>
                            <TextInput
                                style={styles.input}
                                value={form.last_name}
                                onChangeText={(v) => updateField('last_name', v)}
                                placeholder="Seu sobrenome"
                                placeholderTextColor={Colors.textTertiary}
                            />

                            <Text style={styles.inputLabel}>Telefone</Text>
                            <TextInput
                                style={styles.input}
                                value={form.phone}
                                onChangeText={(v) => updateField('phone', v)}
                                placeholder="(11) 99999-9999"
                                placeholderTextColor={Colors.textTertiary}
                                keyboardType="phone-pad"
                                maxLength={15}
                            />

                            <Text style={styles.inputLabel}>CPF/CNPJ</Text>
                            <TextInput
                                style={styles.input}
                                value={form.cpf}
                                onChangeText={(v) => updateField('cpf', v)}
                                placeholder="000.000.000-00"
                                placeholderTextColor={Colors.textTertiary}
                                keyboardType="number-pad"
                                maxLength={18}
                            />
                        </View>
                    </FadeInView>

                    <FadeInView delay={200} translateY={10}>
                        <View style={styles.card}>
                            <Text style={styles.sectionLabel}>ENDEREÇO</Text>

                            <Text style={styles.inputLabel}>Rua</Text>
                            <TextInput
                                style={styles.input}
                                value={form.address_street}
                                onChangeText={(v) => updateField('address_street', v)}
                                placeholder="Nome da rua"
                                placeholderTextColor={Colors.textTertiary}
                            />

                            <View style={styles.rowInputs}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Número</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.address_number}
                                        onChangeText={(v) => updateField('address_number', v)}
                                        placeholder="123"
                                        placeholderTextColor={Colors.textTertiary}
                                        keyboardType="number-pad"
                                    />
                                </View>
                                <View style={{ flex: 2, marginLeft: 12 }}>
                                    <Text style={styles.inputLabel}>Bairro</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.address_neighborhood}
                                        onChangeText={(v) => updateField('address_neighborhood', v)}
                                        placeholder="Bairro"
                                        placeholderTextColor={Colors.textTertiary}
                                    />
                                </View>
                            </View>

                            <View style={styles.rowInputs}>
                                <View style={{ flex: 2 }}>
                                    <Text style={styles.inputLabel}>Cidade</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.address_city}
                                        onChangeText={(v) => updateField('address_city', v)}
                                        placeholder="Cidade"
                                        placeholderTextColor={Colors.textTertiary}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.inputLabel}>UF</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.address_state}
                                        onChangeText={(v) => updateField('address_state', v)}
                                        placeholder="SP"
                                        placeholderTextColor={Colors.textTertiary}
                                        maxLength={2}
                                        autoCapitalize="characters"
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>CEP</Text>
                            <TextInput
                                style={styles.input}
                                value={form.address_zip}
                                onChangeText={(v) => updateField('address_zip', v)}
                                placeholder="00000-000"
                                placeholderTextColor={Colors.textTertiary}
                                keyboardType="number-pad"
                                maxLength={9}
                            />
                        </View>
                    </FadeInView>

                    <FadeInView delay={300} translateY={10}>
                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.saveBtnText}>Salvar Alterações</Text>
                            )}
                        </TouchableOpacity>
                    </FadeInView>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    navHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: Colors.white,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        ...Shadows.sm,
    },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...Typography.h4, color: Colors.text, fontWeight: '900' },

    scroll: { padding: 24, gap: 24 },

    card: {
        backgroundColor: Colors.white,
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.sm,
    },
    sectionLabel: { fontSize: 11, fontWeight: '900', color: Colors.textTertiary, letterSpacing: 1, marginBottom: 20 },

    inputLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, paddingLeft: 4 },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },

    rowInputs: { flexDirection: 'row' },

    saveBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 20,
        borderRadius: 24,
        alignItems: 'center',
        ...Shadows.lg,
    },
    saveBtnText: { color: Colors.white, fontWeight: '900', fontSize: 17 },
});
