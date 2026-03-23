import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../utils/supabase';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadows, AnimationConfig } from '../../../utils/theme';
import { Skeleton } from '../../../components/ui/SkeletonLoader';
import FadeInView from '../../../components/ui/FadeInView';
import { useAuth } from '../../../contexts/AuthContext';
import { logger } from '../../../utils/logger';

type Service = {
    id: string;
    company_id: string;
    title: string;
    description: string;
    price: number;
    requires_quote: boolean;
    location_type: 'in_store' | 'at_home' | 'remote';
    companies: {
        company_name: string;
    };
};

export default function BookServiceScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<number | null>(null);

    const { session } = useAuth();
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
    const [showAddressModal, setShowAddressModal] = useState(false);

    useEffect(() => {
        async function fetchService() {
            try {
                const { data, error } = await supabase
                    .from('services')
                    .select('*, companies(company_name)')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setService(data as unknown as Service);
            } catch (error) {
                logger.error('Error fetching service:', error);
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchService();
    }, [id]);

    useEffect(() => {
        async function fetchAddresses() {
            if (!session?.user?.id || !service || service.location_type !== 'at_home') return;
            try {
                const { data, error } = await supabase
                    .from('user_addresses')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('is_default', { ascending: false });

                if (data && data.length > 0) {
                    setAddresses(data);
                    setSelectedAddress(data.find((d: any) => d.is_default) || data[0]);
                }
            } catch (err) {
                logger.error('Error fetching addresses:', err);
            }
        }
        fetchAddresses();
    }, [session, service]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} aria-label="Agendar">
                <View style={styles.navHeader}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <Skeleton width={120} height={20} />
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.scrollContent}>
                    <Skeleton width="100%" height={100} borderRadius={16} style={{ marginBottom: 24 }} />
                    <Skeleton width={200} height={24} style={{ marginBottom: 8 }} />
                    <Skeleton width={150} height={16} style={{ marginBottom: 16 }} />
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} width={70} height={80} borderRadius={16} />)}
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    if (!service) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
                <Text style={styles.errorText}>Serviço não encontrado.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonFallback}>
                    <Text style={styles.backButtonFallbackText}>Voltar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const isBudget = service.requires_quote;

    const getSelectedDateISO = () => {
        if (selectedDate === null) return null;
        const date = new Date();
        date.setDate(date.getDate() + selectedDate);
        date.setHours(10, 0, 0, 0);
        return date.toISOString();
    };

    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const scheduledDate = getSelectedDateISO();

        if (service?.location_type === 'at_home' && !selectedAddress) {
            Alert.alert('Endereço Obrigatório', 'Selecione ou adicione um endereço para que o profissional possa ir até você.');
            return;
        }

        let navUrl = `/company/checkout/${service.id}?scheduledFor=${encodeURIComponent(scheduledDate || '')}`;
        if (selectedAddress) {
            const addressString = `${selectedAddress.street}, ${selectedAddress.number} - ${selectedAddress.neighborhood}, ${selectedAddress.city}/${selectedAddress.state}`;
            navUrl += `&addressRef=${encodeURIComponent(addressString)}`;
        }
        router.push(navUrl as any);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']} aria-label="Agendar">
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Agendamento</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <FadeInView translateY={20} delay={100}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.serviceTitle}>{service.title}</Text>
                        <Text style={styles.companyName}>com {service.companies?.company_name}</Text>
                    </View>
                </FadeInView>

                <FadeInView translateY={20} delay={200}>
                    {/* Seleção de Data (Mockada para UI/UX visual) */}
                    <Text style={styles.sectionTitle}>Escolha uma Data sugerida</Text>
                    <Text style={styles.sectionSubtitle}>Você poderá negociar isso via chat depois.</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateSelector} contentContainerStyle={{ paddingBottom: 10 }}>
                        {[1, 2, 3, 4, 5, 6, 7].map((day, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                style={[styles.dateBox, selectedDate === index && styles.dateBoxSelected]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelectedDate(index);
                                }}
                            >
                                <Text style={[styles.dateLabel, selectedDate === index && styles.textSelected]}>
                                    {index === 0 ? 'Hoje' : index === 1 ? 'Amanhã' : 'Próx'}
                                </Text>
                                <Text style={[styles.dateNumber, selectedDate === index && styles.textSelected]}>
                                    {new Date().getDate() + index}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </FadeInView>

                {service.location_type === 'at_home' && (
                    <FadeInView translateY={20} delay={300}>
                        <View style={styles.addressBox}>
                            <View style={styles.addressHeaderRow}>
                                <Ionicons name="location" size={18} color={Colors.primary} />
                                <Text style={styles.addressTitle}>Endereço de Atendimento</Text>
                            </View>

                            {selectedAddress ? (
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={[styles.addressDesc, { color: Colors.text, fontWeight: '600', marginBottom: 4 }]}>
                                        {selectedAddress.label}
                                    </Text>
                                    <Text style={styles.addressDesc}>
                                        {selectedAddress.street}, {selectedAddress.number} - {selectedAddress.neighborhood}
                                    </Text>
                                    <Text style={styles.addressDesc}>
                                        {selectedAddress.city}/{selectedAddress.state} - {selectedAddress.zip}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.addressDesc}>O Profissional irá até a sua localização. Selecione o endereço para continuar.</Text>
                            )}

                            <TouchableOpacity
                                style={styles.selectAddressBtn}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    if (addresses.length === 0) {
                                        router.push('/profile/addresses');
                                    } else {
                                        setShowAddressModal(true);
                                    }
                                }}
                            >
                                <Text style={styles.selectAddressText}>
                                    {addresses.length === 0 ? 'Adicionar Endereço' : 'Trocar Endereço'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </FadeInView>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Action Area */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomPrice}>
                    <Text style={styles.bottomLabel}>Total (Estimativa)</Text>
                    <Text style={styles.bottomValue}>{isBudget ? 'Orçamento' : `R$ ${Number(service.price).toFixed(2).replace('.', ',')}`}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.actionButton, (selectedDate === null || (service.location_type === 'at_home' && !selectedAddress)) && { opacity: 0.5 }]}
                    disabled={selectedDate === null || (service.location_type === 'at_home' && !selectedAddress)}
                    onPress={handleContinue}
                >
                    <Text style={styles.actionButtonText}>Continuar</Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.white} />
                </TouchableOpacity>
            </View>

            {/* Modal de Seleção de Endereço */}
            {showAddressModal && (
                <View style={StyleSheet.absoluteFill}>
                    <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setShowAddressModal(false)} />
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Selecione o Endereço</Text>
                            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                                <Ionicons name="close-circle" size={28} color={Colors.textTertiary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                            {addresses.map((addr) => (
                                <TouchableOpacity
                                    key={addr.id}
                                    style={[styles.addressItem, selectedAddress?.id === addr.id && styles.addressItemSelected]}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setSelectedAddress(addr);
                                        setShowAddressModal(false);
                                    }}
                                >
                                    <View style={styles.addressItemIcon}>
                                        <Ionicons name={addr.label.toLowerCase().includes('casa') ? 'home' : 'location'} size={24} color={selectedAddress?.id === addr.id ? Colors.primary : Colors.textSecondary} />
                                    </View>
                                    <View style={styles.addressItemBody}>
                                        <Text style={[styles.addressItemLabel, selectedAddress?.id === addr.id && { color: Colors.primary }]}>{addr.label}</Text>
                                        <Text style={styles.addressItemText}>{addr.street}, {addr.number}</Text>
                                    </View>
                                    {selectedAddress?.id === addr.id && (
                                        <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={styles.addressAddBtn} onPress={() => {
                                setShowAddressModal(false);
                                router.push('/profile/addresses');
                            }}>
                                <Ionicons name="add" size={20} color={Colors.white} />
                                <Text style={styles.addressAddText}>Adicionar Novo Endereço</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface
    },
    container: {
        flex: 1,
        backgroundColor: Colors.surface
    },
    navHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: Colors.white,
        ...Shadows.sm
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: {
        ...Typography.h4,
        color: Colors.text
    },
    errorText: {
        ...Typography.h4,
        color: Colors.text,
        marginTop: 16,
    },
    backButtonFallback: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md
    },
    backButtonFallbackText: {
        ...Typography.button,
        color: Colors.white,
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20
    },

    summaryCard: {
        backgroundColor: Colors.white,
        padding: 24,
        borderRadius: BorderRadius.lg,
        marginBottom: 32,
        ...Shadows.md,
        borderWidth: 1,
        borderColor: Colors.borderLight
    },
    serviceTitle: {
        ...Typography.h3,
        color: Colors.text,
        marginBottom: 4
    },
    companyName: {
        ...Typography.bodySmall,
        color: Colors.textSecondary
    },

    sectionTitle: {
        ...Typography.h4,
        color: Colors.text,
        marginBottom: 4
    },
    sectionSubtitle: {
        ...Typography.caption,
        color: Colors.textSecondary,
        marginBottom: 16
    },

    dateSelector: {
        flexDirection: 'row',
        marginBottom: 32
    },
    dateBox: {
        width: 70,
        height: 85,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        ...Shadows.sm
    },
    dateBoxSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        ...Shadows.md
    },
    dateLabel: {
        ...Typography.caption,
        color: Colors.textSecondary,
        marginBottom: 4
    },
    dateNumber: {
        ...Typography.h3,
        color: Colors.text
    },
    textSelected: {
        color: Colors.white
    },

    addressBox: {
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
        marginTop: 10
    },
    addressHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    addressTitle: {
        ...Typography.bodySmall,
        fontWeight: '700',
        color: Colors.text,
        marginLeft: 8
    },
    addressDesc: {
        ...Typography.caption,
        color: Colors.textSecondary,
        marginBottom: 20
    },
    selectAddressBtn: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.primary,
        paddingVertical: 12,
        borderRadius: BorderRadius.md,
        alignItems: 'center'
    },
    selectAddressText: {
        ...Typography.buttonSmall,
        color: Colors.primary,
    },

    bottomBar: {
        flexDirection: 'row',
        padding: 24,
        paddingBottom: 32,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        alignItems: 'center',
        ...Shadows.xl
    },
    bottomPrice: {
        flex: 1
    },
    bottomLabel: {
        ...Typography.caption,
        color: Colors.textSecondary,
        marginBottom: 2
    },
    bottomValue: {
        ...Typography.h3,
        color: Colors.text
    },

    actionButton: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        gap: 8,
        ...Shadows.md
    },
    actionButtonText: {
        ...Typography.button,
        color: Colors.white,
    },

    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        ...Shadows.lg,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    sheetTitle: {
        ...Typography.h3,
        color: Colors.text,
    },
    addressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.white,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.sm
    },
    addressItemSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    addressItemIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    addressItemBody: {
        flex: 1,
    },
    addressItemLabel: {
        ...Typography.bodySmall,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    addressItemText: {
        ...Typography.caption,
        color: Colors.textSecondary,
    },
    addressAddBtn: {
        flexDirection: 'row',
        backgroundColor: Colors.text,
        paddingVertical: 14,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 20,
        gap: 8,
    },
    addressAddText: {
        ...Typography.buttonSmall,
        color: Colors.white,
    }
});

