import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Shadows, Spacing, Typography, BorderRadius } from '../../utils/theme';

type Address = {
    id: string;
    label: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
    is_default: boolean;
};

export default function AddressesScreen() {
    const router = useRouter();
    const { session } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: '', street: '', number: '', neighborhood: '', city: '', state: '', zip: ''
    });

    useEffect(() => {
        loadAddresses();
    }, [session]);

    const loadAddresses = async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_addresses')
                .select('*')
                .eq('user_id', session.user.id)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAddresses(data || []);
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Não foi possível carregar os endereços.');
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefault = async (id: string) => {
        if (!session?.user?.id) return;
        try {
            // Unset all
            await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', session.user.id);
            // Set new default
            const { error } = await supabase.from('user_addresses').update({ is_default: true }).eq('id', id);
            if (error) throw error;

            loadAddresses();
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Não foi possível definir como padrão.');
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Excluir', 'Tem certeza que deseja excluir este endereço?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const { error } = await supabase.from('user_addresses').delete().eq('id', id);
                        if (error) throw error;
                        setAddresses(prev => prev.filter(a => a.id !== id));
                    } catch (e: any) {
                        Alert.alert('Erro', e.message || 'Erro ao excluir.');
                    }
                }
            }
        ]);
    };

    const handleSaveAddress = async () => {
        if (!session?.user?.id) return;
        const { label, street, number, neighborhood, city, state, zip } = newAddress;

        if (!label || !street || !number || !neighborhood || !city || !state || !zip) {
            Alert.alert('Aviso', 'Preencha todos os campos!');
            return;
        }

        if (state.length !== 2) {
            Alert.alert('Aviso', 'O estado deve ter 2 letras (ex: SP).');
            return;
        }

        setSaving(true);
        try {
            const isFirst = addresses.length === 0;
            const { error } = await supabase.from('user_addresses').insert({
                user_id: session.user.id,
                label,
                street,
                number,
                neighborhood,
                city,
                state: state.toUpperCase(),
                zip,
                is_default: isFirst
            });

            if (error) throw error;

            setAddModalVisible(false);
            setNewAddress({ label: '', street: '', number: '', neighborhood: '', city: '', state: '', zip: '' });
            loadAddresses();
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Erro ao salvar o endereço.');
        } finally {
            setSaving(false);
        }
    };

    const renderAddress = ({ item }: { item: Address }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.labelRow}>
                    <Ionicons name={item.label.toLowerCase().includes('casa') ? 'home' : item.label.toLowerCase().includes('trabalho') ? 'briefcase' : 'location'} size={18} color={item.is_default ? Colors.primary : Colors.textSecondary} />
                    <Text style={[styles.cardTitle, item.is_default && { color: Colors.primary }]}>{item.label}</Text>
                    {item.is_default && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Padrão</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 4 }}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.addressText}>{item.street}, {item.number}</Text>
                <Text style={styles.addressSub}>{item.neighborhood} - {item.city}/{item.state}</Text>
                <Text style={styles.addressSub}>CEP: {item.zip}</Text>
            </View>

            {!item.is_default && (
                <TouchableOpacity style={styles.setDefaultBtn} onPress={() => handleSetDefault(item.id)}>
                    <Text style={styles.setDefaultText}>Definir como Principal</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meus Endereços</Text>
                <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.addButton}>
                    <Ionicons name="add" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    keyExtractor={item => item.id}
                    renderItem={renderAddress}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyState}>
                            <Ionicons name="map-outline" size={48} color={Colors.border} />
                            <Text style={styles.emptyTitle}>Nenhum endereço salvo</Text>
                            <Text style={styles.emptySub}>Você ainda não possui endereços cadastrados para agendamentos.</Text>
                            <TouchableOpacity style={styles.emptyBtn} onPress={() => setAddModalVisible(true)}>
                                <Text style={styles.emptyBtnText}>Adicionar Novo</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}

            <Modal visible={isAddModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Novo Endereço</Text>
                            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={[1]}
                            keyExtractor={() => '1'}
                            showsVerticalScrollIndicator={false}
                            renderItem={() => (
                                <View style={styles.form}>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Nome do Local (Ex: Casa, Escritório)</Text>
                                        <TextInput style={styles.input} placeholder="Casa" value={newAddress.label} onChangeText={t => setNewAddress({ ...newAddress, label: t })} />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>CEP</Text>
                                        <TextInput style={styles.input} placeholder="00000-000" keyboardType="numeric" value={newAddress.zip} onChangeText={t => setNewAddress({ ...newAddress, zip: t })} />
                                    </View>

                                    <View style={styles.row}>
                                        <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
                                            <Text style={styles.label}>Rua</Text>
                                            <TextInput style={styles.input} placeholder="Av. Paulista" value={newAddress.street} onChangeText={t => setNewAddress({ ...newAddress, street: t })} />
                                        </View>
                                        <View style={[styles.inputGroup, { flex: 1 }]}>
                                            <Text style={styles.label}>Número</Text>
                                            <TextInput style={styles.input} placeholder="1000" keyboardType="numeric" value={newAddress.number} onChangeText={t => setNewAddress({ ...newAddress, number: t })} />
                                        </View>
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Bairro</Text>
                                        <TextInput style={styles.input} placeholder="Bela Vista" value={newAddress.neighborhood} onChangeText={t => setNewAddress({ ...newAddress, neighborhood: t })} />
                                    </View>

                                    <View style={styles.row}>
                                        <View style={[styles.inputGroup, { flex: 2, marginRight: 10 }]}>
                                            <Text style={styles.label}>Cidade</Text>
                                            <TextInput style={styles.input} placeholder="São Paulo" value={newAddress.city} onChangeText={t => setNewAddress({ ...newAddress, city: t })} />
                                        </View>
                                        <View style={[styles.inputGroup, { flex: 1 }]}>
                                            <Text style={styles.label}>UF</Text>
                                            <TextInput style={styles.input} placeholder="SP" maxLength={2} autoCapitalize="characters" value={newAddress.state} onChangeText={t => setNewAddress({ ...newAddress, state: t })} />
                                        </View>
                                    </View>

                                    <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.7 }]} onPress={handleSaveAddress} disabled={saving}>
                                        {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Salvar Endereço</Text>}
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
    addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: Spacing.lg, paddingBottom: 100 },

    card: { backgroundColor: Colors.white, padding: Spacing.md, borderRadius: 16, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: { ...Typography.bodySmall, fontWeight: '700', color: Colors.text },
    badge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: Colors.primary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

    cardBody: { paddingLeft: 26 },
    addressText: { color: Colors.text, fontSize: 14, fontWeight: '500', marginBottom: 2 },
    addressSub: { color: Colors.textSecondary, fontSize: 13, marginBottom: 2 },

    setDefaultBtn: { marginTop: Spacing.md, paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.borderLight, marginLeft: 26 },
    setDefaultText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },

    emptyState: { alignItems: 'center', marginTop: 60, padding: 20 },
    emptyTitle: { ...Typography.h3, color: Colors.text, marginTop: 16, marginBottom: 8 },
    emptySub: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
    emptyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: BorderRadius.full },
    emptyBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    modalTitle: { ...Typography.h3, color: Colors.text },

    form: { padding: Spacing.lg },
    row: { flexDirection: 'row' },
    inputGroup: { marginBottom: Spacing.md },
    label: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 },
    input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 50, color: Colors.text, ...Typography.body },

    submitBtn: { backgroundColor: Colors.primary, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.xl },
    submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' }
});
