import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../utils/supabase';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadows, AnimationConfig } from '../../../utils/theme';
import { Skeleton } from '../../../components/ui/SkeletonLoader';
import FadeInView from '../../../components/ui/FadeInView';
import { logger } from '../../../utils/logger';

type Service = {
    id: string;
    company_id: string;
    title: string;
    description: string;
    price: number;
    requires_quote: boolean;
    location_type: 'in_store' | 'at_home' | 'remote';
    estimated_duration?: number;
    image_url?: string;
};

const { width } = Dimensions.get('window');

export default function ServiceDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchServiceData() {
            try {
                const { data, error } = await supabase
                    .from('services')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setService(data);
            } catch (error) {
                logger.error('Error fetching service details:', error);
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchServiceData();
        }
    }, [id]);

    if (loading) {
        return (
            <View style={styles.container} aria-label="Carregando">
                <View style={styles.heroContainer}>
                    <Skeleton width="100%" height={320} borderRadius={0} />
                </View>
                <View style={styles.contentSheet}>
                    <View style={styles.titleRow}>
                        <Skeleton width="60%" height={32} />
                        <Skeleton width={100} height={40} borderRadius={12} />
                    </View>
                    <View style={styles.metaCardsContainer}>
                        <Skeleton width="48%" height={64} borderRadius={16} />
                        <Skeleton width="48%" height={64} borderRadius={16} />
                    </View>
                    <Skeleton width={150} height={24} style={{ marginBottom: 16 }} />
                    <Skeleton width="100%" height={100} />
                </View>
            </View>
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

    const handleBookPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (service.requires_quote) {
            router.push(`/company/form/${service.id}`);
        } else {
            router.push(`/company/book/${service.id}`);
        }
    };

    return (
        <View style={styles.container} aria-label="Detalhes do Serviço">
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

                {/* Hero Image Section */}
                <View style={styles.heroContainer}>
                    <Image
                        source={{ uri: service.image_url || 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80' }}
                        style={styles.heroImage}
                    />
                    <View style={styles.heroOverlay} />

                    <SafeAreaView edges={['top']} style={styles.floatingNav}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.navButton} activeOpacity={0.8}>
                            <Ionicons name="arrow-back" size={24} color={Colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.navButton}
                            activeOpacity={0.8}
                            onPress={async () => {
                                Haptics.selectionAsync();
                                try {
                                    await Share.share({
                                        message: `Confira "${service.title}" no CONTRATTO! Preço: ${service.requires_quote ? 'Sob orçamento' : `R$ ${service.price.toFixed(2)}`}`,
                                    });
                                } catch (e) {
                                    logger.error('Share error:', e);
                                }
                            }}
                        >
                            <Ionicons name="share-social-outline" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>

                {/* Content Sheet */}
                <FadeInView translateY={40} duration={AnimationConfig.duration.slow}>
                    <View style={styles.contentSheet}>
                        <View style={styles.titleRow}>
                            <Text style={styles.title}>{service.title}</Text>
                            <View style={styles.priceTag}>
                                {service.requires_quote ? (
                                    <Text style={styles.priceTagText}>Orçamento</Text>
                                ) : (
                                    <Text style={styles.priceTagText}>R$ {service.price}</Text>
                                )}
                            </View>
                        </View>

                        {/* Meta Information Cards */}
                        <View style={styles.metaCardsContainer}>
                            <View style={styles.metaCard}>
                                <View style={[styles.metaIconBox, { backgroundColor: Colors.primaryLight }]}>
                                    <Ionicons
                                        name={service.location_type === 'in_store' ? 'business' : service.location_type === 'at_home' ? 'home' : 'laptop'}
                                        size={20}
                                        color={Colors.primary}
                                    />
                                </View>
                                <View>
                                    <Text style={styles.metaLabel}>Agendamento</Text>
                                    <Text style={styles.metaValue}>
                                        {service.location_type === 'in_store' ? 'Ir até o local' : service.location_type === 'at_home' ? 'Em domicílio' : 'Remoto'}
                                    </Text>
                                </View>
                            </View>

                            {service.estimated_duration && (
                                <View style={styles.metaCard}>
                                    <View style={[styles.metaIconBox, { backgroundColor: Colors.errorLight }]}>
                                        <Ionicons name="time-outline" size={20} color={Colors.error} />
                                    </View>
                                    <View>
                                        <Text style={styles.metaLabel}>Duração</Text>
                                        <Text style={styles.metaValue}>Aprox. {service.estimated_duration} min</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* About Service Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Sobre o Serviço</Text>
                            <Text style={styles.description}>
                                {service.description || 'Nenhuma descrição detalhada fornecida para este serviço.'}
                            </Text>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* How it Works / Perks */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>O que está incluso?</Text>
                            <View style={styles.perkRow}>
                                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                                <Text style={styles.perkText}>Profissional verificado pela plataforma</Text>
                            </View>
                            <View style={styles.perkRow}>
                                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                                <Text style={styles.perkText}>Garantia de 30 dias após conclusão</Text>
                            </View>
                            <View style={styles.perkRow}>
                                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                                <Text style={styles.perkText}>Pagamento seguro 100% online</Text>
                            </View>
                        </View>

                    </View>
                </FadeInView>

                {/* Spacer for Bottom Bar */}
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.bottomPriceInfo}>
                    <Text style={styles.bottomPriceLabel}>Total Estimado</Text>
                    <Text style={styles.bottomPriceValue}>
                        {service.requires_quote ? 'Sob Consulta' : `R$ ${service.price}`}
                    </Text>
                </View>
                <TouchableOpacity style={styles.bookButton} activeOpacity={0.8} onPress={handleBookPress}>
                    <Text style={styles.bookButtonText}>
                        {service.requires_quote ? 'Solicitar Orçamento' : 'Agendar Agora'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white
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

    heroContainer: {
        width: width,
        height: 320,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    floatingNav: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    navButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.md,
    },

    contentSheet: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: BorderRadius.xxl,
        borderTopRightRadius: BorderRadius.xxl,
        marginTop: -40,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 24,
        ...Shadows.lg,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    title: {
        flex: 1,
        ...Typography.h2,
        color: Colors.text,
        marginRight: 16,
    },
    priceTag: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: BorderRadius.md,
    },
    priceTagText: {
        ...Typography.label,
        color: Colors.white,
    },

    metaCardsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    metaCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: BorderRadius.lg,
        padding: 12,
        gap: 12,
    },
    metaIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    metaLabel: {
        ...Typography.caption,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    metaValue: {
        ...Typography.bodySmall,
        color: Colors.text,
        fontWeight: '800',
    },

    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        ...Typography.h3,
        color: Colors.text,
        marginBottom: 16,
    },
    description: {
        ...Typography.body,
        color: Colors.textSecondary,
    },

    divider: {
        height: 1,
        backgroundColor: Colors.borderLight,
        marginBottom: 32,
    },

    perkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    perkText: {
        ...Typography.bodySmall,
        color: Colors.text,
    },

    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingVertical: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        alignItems: 'center',
        justifyContent: 'space-between',
        ...Shadows.xl,
    },
    bottomPriceInfo: {
        justifyContent: 'center',
    },
    bottomPriceLabel: {
        ...Typography.caption,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    bottomPriceValue: {
        ...Typography.h2,
        color: Colors.text,
    },
    bookButton: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        gap: 8,
        ...Shadows.md,
    },
    bookButtonText: {
        ...Typography.button,
        color: Colors.white,
    }
});

