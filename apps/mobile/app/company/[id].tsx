import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../utils/theme';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import FadeInView from '../../components/ui/FadeInView';
import { logger } from '../../utils/logger';

type PortfolioItem = {
    id: string;
    type: 'image' | 'video';
    url: string;
    title?: string;
};

type Company = {
    id: string;
    business_name: string;
    bio: string;
    address_city: string;
    address_state: string;
    rating?: number;
    cover_url?: string;
    logo_url?: string;
    portfolio?: PortfolioItem[];
    address_street?: string;
    address_number?: string;
    address_neighborhood?: string;
    address_zip?: string;
    instagram_url?: string;
    linkedin_url?: string;
    facebook_url?: string;
};

type Service = {
    id: string;
    title: string;
    description: string;
    price: number;
    price_type: 'fixed' | 'budget';
    location_type: 'at_home' | 'at_provider' | 'remote';
    estimated_duration?: number;
    duration_unit?: 'minutes' | 'hours' | 'days';
};

type Review = {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    profiles: { first_name: string | null; last_name: string | null } | null;
};

const { width } = Dimensions.get('window');

export default function CompanyProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user, profile } = useAuth();

    const [company, setCompany] = useState<Company | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchCompanyData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [{ data: compData, error: compErr }, { data: srvData }, { data: revData }] = await Promise.all([
                supabase.from('companies').select('id, business_name, bio, address_city, address_state, cover_url, logo_url, address_street, address_number, address_neighborhood, address_zip, instagram_url, linkedin_url, facebook_url').eq('id', id).single(),
                supabase.from('services').select('*').eq('company_id', id).eq('is_active', true),
                supabase.from('reviews').select('id, rating, comment, created_at, profiles:reviewer_id(first_name, last_name)').eq('company_id', id).order('created_at', { ascending: false }).limit(5)
            ]);

            if (compErr) throw compErr;
            setCompany(compData);
            setServices(srvData || []);
            setReviews((revData as unknown as Review[]) || []);

            if (user?.id) {
                const { data: favData } = await supabase
                    .from('favorite_companies')
                    .select('id')
                    .eq('client_id', user.id)
                    .eq('company_id', id)
                    .maybeSingle();
                if (favData) setIsFavorite(true);
            }
        } catch (error) {
            logger.error('Error fetching company details:', error);
        } finally {
            setLoading(false);
        }
    }, [id, user?.id]);

    useEffect(() => {
        fetchCompanyData();
    }, [fetchCompanyData]);

    const toggleFavorite = async () => {
        if (!id) return;
        if (!user?.id) {
            Alert.alert(
                'Acesso Restrito',
                'Faça login para salvar empresas favoritas.',
                [
                    { text: 'Agora não', style: 'cancel' },
                    { text: 'Entrar', onPress: () => router.push('/(auth)/login') }
                ]
            );
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            if (isFavorite) {
                await supabase.from('favorite_companies').delete().eq('client_id', user.id).eq('company_id', id);
                setIsFavorite(false);
            } else {
                await supabase.from('favorite_companies').insert({ client_id: user.id, company_id: id });
                setIsFavorite(true);
            }
        } catch (error) {
            logger.error('Error toggling favorite:', error);
        }
    };

    const openSocial = (url: string) => {
        if (!url) return;
        Haptics.selectionAsync();
        const formattedUrl = url.startsWith('http') ? url : `https://${url.replace('@', 'instagram.com/')}`;
        Linking.openURL(formattedUrl);
    };

    const handleReport = () => {
        if (!id || !company) return;

        Alert.alert(
            'Denunciar Empresa',
            'Esta empresa violou nossas diretrizes? Relate qualquer problema para análise de nossa equipe.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Denunciar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('reports')
                                .insert({
                                    reporter_id: user?.id,
                                    reported_id: id,
                                    type: 'company',
                                    reason: 'UGC Policy Violation',
                                    details: `Report from company profile screen`
                                });
                            if (error) throw error;
                            Alert.alert('Sucesso', 'Relato enviado. Analisaremos em até 24h.');
                        } catch (e) {
                            logger.error('Error reporting company:', e);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.container} aria-label="Carregando">
                <Skeleton width="100%" height={280} borderRadius={0} />
                <View style={[styles.infoSheet, { marginTop: -32 }]}>
                    <View style={styles.logoWrapper}>
                        <Skeleton width={92} height={92} borderRadius={46} />
                    </View>
                    <Skeleton width={200} height={24} style={{ marginTop: 16 }} />
                    <Skeleton width={150} height={16} style={{ marginTop: 12 }} />
                    <Skeleton width="90%" height={60} style={{ marginTop: 24 }} />
                </View>
            </View>
        );
    }

    if (!company) return null;

    const isOwnProfile = profile?.user_type === 'company' && id === company.id;

    return (
        <View style={styles.container} aria-label="Perfil da Empresa">
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

                <View style={styles.headerContainer}>
                    <Image
                        source={{ uri: company.cover_url || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200' }}
                        style={styles.coverImage}
                    />
                    <View style={styles.coverOverlay} />

                    <SafeAreaView edges={['top']} style={styles.navBar}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
                            <Ionicons name="arrow-back" size={22} color={Colors.text} />
                        </TouchableOpacity>
                        {!isOwnProfile && (
                            <TouchableOpacity onPress={toggleFavorite} style={styles.navBtn}>
                                <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? Colors.error : Colors.text} />
                            </TouchableOpacity>
                        )}
                        {isOwnProfile && (
                            <TouchableOpacity onPress={() => router.push('/company/storefront')} style={styles.navBtn}>
                                <Ionicons name="create-outline" size={22} color={Colors.primary} />
                            </TouchableOpacity>
                        )}
                    </SafeAreaView>
                </View>

                <View style={styles.infoSheet}>
                    <View style={styles.logoWrapper}>
                        {company.logo_url ? (
                            <Image source={{ uri: company.logo_url }} style={styles.logoImg} />
                        ) : (
                            <View style={[styles.logoImg, styles.logoPlaceholder]}>
                                <Text style={styles.logoPlaceholderText}>{company.business_name?.[0]}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.headerInfo}>
                        <Text style={styles.businessName}>{company.business_name}</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={12} color={Colors.white} />
                                <Text style={styles.ratingValue}>{company.rating?.toFixed(1) || '0.0'}</Text>
                            </View>
                            <Text style={styles.reviewsCount}>
                                {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
                            </Text>
                            <View style={styles.dot} />
                            <Text style={styles.locationText}>{company.address_city}, {company.address_state}</Text>
                        </View>
                    </View>

                    <Text style={styles.bioText}>{company.bio || 'Bem-vindo ao nosso perfil profissional.'}</Text>

                    {(company.instagram_url || company.linkedin_url || company.facebook_url) && (
                        <View style={styles.socialRow}>
                            {company.instagram_url && (
                                <TouchableOpacity onPress={() => openSocial(company.instagram_url!)} style={styles.socialBtn}>
                                    <Ionicons name="logo-instagram" size={20} color={Colors.text} />
                                </TouchableOpacity>
                            )}
                            {company.linkedin_url && (
                                <TouchableOpacity onPress={() => openSocial(company.linkedin_url!)} style={styles.socialBtn}>
                                    <Ionicons name="logo-linkedin" size={20} color={Colors.text} />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <TouchableOpacity style={styles.reportBtn} onPress={handleReport}>
                        <Ionicons name="flag-outline" size={14} color={Colors.textTertiary} />
                        <Text style={styles.reportBtnText}>Denunciar Perfil</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Serviços</Text>
                    {services.length === 0 ? (
                        <Text style={styles.emptyText}>Nenhum serviço disponível no momento.</Text>
                    ) : (
                        services.map(service => (
                            <TouchableOpacity
                                key={service.id}
                                style={styles.serviceCard}
                                activeOpacity={0.7}
                                onPress={() => {
                                    if (!user?.id) {
                                        Alert.alert(
                                            'Faça Login',
                                            'Para contratar ou ver detalhes do serviço, você precisa estar logado.',
                                            [
                                                { text: 'Agora não', style: 'cancel' },
                                                { text: 'Entrar', onPress: () => router.push('/(auth)/login') }
                                            ]
                                        );
                                        return;
                                    }
                                    router.push(`/company/service/${service.id}`);
                                }}
                            >
                                <View style={styles.serviceLeft}>
                                    <Text style={styles.serviceName}>{service.title}</Text>
                                    <Text style={styles.serviceDesc} numberOfLines={2}>{service.description}</Text>
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceLabel}>A partir de</Text>
                                        <Text style={styles.priceValue}>R$ {service.price}</Text>
                                    </View>
                                </View>
                                <View style={styles.serviceBtn}>
                                    <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {reviews.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Avaliações</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAll}>Ver tudo</Text>
                            </TouchableOpacity>
                        </View>
                        {reviews.map(review => (
                            <View key={review.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewerName}>
                                        {review.profiles?.first_name || 'Usuário'} {review.profiles?.last_name || ''}
                                    </Text>
                                    <View style={styles.reviewStars}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Ionicons key={s} name="star" size={10} color={s <= review.rating ? Colors.warning : Colors.border} />
                                        ))}
                                    </View>
                                </View>
                                {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    headerContainer: { height: 280, width: '100%', position: 'relative' },
    coverImage: { width: '100%', height: '100%' },
    coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
    navBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 },
    navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', ...Shadows.sm },

    infoSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, paddingBottom: 24, alignItems: 'center' },
    logoWrapper: { marginTop: -46, width: 92, height: 92, borderRadius: 46, backgroundColor: Colors.white, padding: 4, ...Shadows.md },
    logoImg: { width: '100%', height: '100%', borderRadius: 42 },
    logoPlaceholder: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
    logoPlaceholderText: { color: Colors.white, fontSize: 36, fontWeight: '900' },

    headerInfo: { paddingHorizontal: 24, marginTop: 12, alignItems: 'center' },
    businessName: { ...Typography.h2, color: Colors.text, marginBottom: 8, textAlign: 'center' },

    statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warning, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4, marginRight: 8 },
    ratingValue: { fontSize: 12, fontWeight: '700', color: Colors.white },
    reviewsCount: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginHorizontal: 8 },
    locationText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

    bioText: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 24, marginVertical: 16, lineHeight: 20 },
    socialRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    socialBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },

    reportBtn: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.6 },
    reportBtnText: { fontSize: 12, color: Colors.textTertiary, fontWeight: '500', textDecorationLine: 'underline' },

    section: { paddingHorizontal: 24, marginTop: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { ...Typography.h4, color: Colors.text },
    seeAll: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
    emptyText: { color: Colors.textTertiary, fontStyle: 'italic' },

    serviceCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 24, padding: 20, marginBottom: 12, ...Shadows.md, borderWidth: 1, borderColor: Colors.borderLight },
    serviceLeft: { flex: 1 },
    serviceName: { ...Typography.label, color: Colors.text, marginBottom: 4 },
    serviceDesc: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18, marginBottom: 12 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    priceLabel: { fontSize: 10, color: Colors.textTertiary, fontWeight: '600', textTransform: 'uppercase' },
    priceValue: { fontSize: 16, fontWeight: '900', color: Colors.primary },
    serviceBtn: { justifyContent: 'center', paddingLeft: 12 },

    reviewCard: { backgroundColor: Colors.surface, padding: 16, borderRadius: 16, marginBottom: 12 },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    reviewerName: { fontSize: 14, fontWeight: '700', color: Colors.text },
    reviewStars: { flexDirection: 'row', gap: 2 },
    reviewComment: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 }
});
