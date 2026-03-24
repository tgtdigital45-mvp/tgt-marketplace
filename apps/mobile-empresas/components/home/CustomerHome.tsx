import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Profile, useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../../utils/supabase';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../../utils/theme';
import { Skeleton } from '../../../components/ui/SkeletonLoader';
import FadeInView from '../../../components/ui/FadeInView';
import { ServiceSearchResult, searchServices } from '../../../utils/search';
import { useDebounce } from '../../../hooks/useDebounce';

const { width } = Dimensions.get('window');

const CATEGORIES = [
    { id: '1', name: 'Limpeza', icon: 'sparkles', color: '#8BE3FF' },
    { id: '2', name: 'Reformas', icon: 'build', color: '#FFD58B' },
    { id: '3', name: 'Beleza', icon: 'color-palette', color: '#FFB8D1' },
    { id: '4', name: 'Eventos', icon: 'calendar', color: '#B8FFC8' },
    { id: '5', name: 'Aulas', icon: 'school', color: '#B8C8FF' },
    { id: '6', name: 'Outros', icon: 'grid', color: '#E0E0E0' },
];

type CustomerHomeProps = { profile: Profile | null };

export default function CustomerHome({ profile }: CustomerHomeProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [services, setServices] = useState<ServiceSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const { user } = useAuth();
    const router = useRouter();

    const debouncedSearch = useDebounce(searchQuery, 400);

    const fetchAllData = useCallback(async (search = '') => {
        setIsLoading(true);
        try {
            const results = await searchServices(search, 20);
            setServices(results);
        } catch {
            // silencioso
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchFavorites = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('favorite_companies')
            .select('company_id')
            .eq('client_id', user.id);
        if (data) setFavoriteIds(new Set(data.map((f: any) => f.company_id)));
    }, [user]);

    useEffect(() => {
        fetchAllData(debouncedSearch);
    }, [debouncedSearch, fetchAllData]);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const handleSearch = (text: string) => {
        setSearchQuery(text);
    };

    const toggleFavorite = async (companyId: string) => {
        if (!user) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const isFav = favoriteIds.has(companyId);
        const newFavs = new Set(favoriteIds);

        if (isFav) {
            newFavs.delete(companyId);
            setFavoriteIds(newFavs);
            await supabase.from('favorite_companies').delete().eq('client_id', user.id).eq('company_id', companyId);
        } else {
            newFavs.add(companyId);
            setFavoriteIds(newFavs);
            await supabase.from('favorite_companies').insert({ client_id: user.id, company_id: companyId });
        }
    };

    const navigateToProfile = () => {
        Haptics.selectionAsync();
        router.push('/(tabs)/profile');
    };

    if (isLoading && !refreshing) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} aria-label="Dashboard">
                <View style={styles.header}>
                    <Skeleton width={150} height={32} />
                    <Skeleton width={44} height={44} borderRadius={22} />
                </View>
                <View style={{ padding: 24 }}>
                    <Skeleton width="100%" height={60} borderRadius={30} style={{ marginBottom: 32 }} />
                    <Skeleton width={200} height={24} style={{ marginBottom: 16 }} />
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <Skeleton width={160} height={200} borderRadius={24} />
                        <Skeleton width={160} height={200} borderRadius={24} />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']} aria-label="Dashboard">
            <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>

                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Olá, {profile?.full_name?.split(' ')[0] || 'Explorador'}</Text>
                        <Text style={styles.headerTitle}>O que você precisa hoje?</Text>
                    </View>
                    <TouchableOpacity onPress={navigateToProfile} style={styles.profileBtn}>
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitial}>{(profile?.full_name || 'C')[0]}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color={Colors.textTertiary} />
                        <TextInput
                            placeholder="Buscar serviço ou profissional..."
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={handleSearch}
                            placeholderTextColor={Colors.textTertiary}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => handleSearch('')}>
                                <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Categorias</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
                        {CATEGORIES.map((cat, idx) => (
                            <FadeInView key={cat.id} delay={idx * 50} translateY={0}>
                                <TouchableOpacity
                                    style={styles.categoryItem}
                                    onPress={() => router.push({ pathname: '/(tabs)/browse', params: { category: cat.name } })}
                                >
                                    <View style={[styles.categoryIcon, { backgroundColor: cat.color + '40' }]}>
                                        <Ionicons name={cat.icon as any} size={24} color={Colors.text} />
                                    </View>
                                    <Text style={styles.categoryLabel}>{cat.name}</Text>
                                </TouchableOpacity>
                            </FadeInView>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Destaques</Text>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/browse')}>
                            <Text style={styles.seeAll}>Ver todos</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
                        {services.map((service, idx) => (
                            <FadeInView key={service.id} delay={idx * 100} translateY={0}>
                                <TouchableOpacity
                                    style={styles.featuredCard}
                                    activeOpacity={0.9}
                                    onPress={() => router.push(`/company/${service.company.id}`)}
                                >
                                    <Image
                                        source={{ uri: service.company.cover_image_url || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400' }}
                                        style={styles.featuredCover}
                                    />
                                    <View style={styles.featuredLogoBox}>
                                        {service.company.logo_url ? (
                                            <Image source={{ uri: service.company.logo_url }} style={styles.featuredLogo} />
                                        ) : (
                                            <View style={[styles.featuredLogo, { backgroundColor: Colors.primary }]}>
                                                <Text style={{ color: Colors.white, fontWeight: '900' }}>{service.company.company_name[0]}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <TouchableOpacity
                                        style={styles.favBtn}
                                        onPress={() => toggleFavorite(service.company.id)}
                                    >
                                        <Ionicons
                                            name={favoriteIds.has(service.company.id) ? "heart" : "heart-outline"}
                                            size={18}
                                            color={favoriteIds.has(service.company.id) ? Colors.error : Colors.white}
                                        />
                                    </TouchableOpacity>
                                    <View style={styles.featuredInfo}>
                                        <Text style={styles.featuredName} numberOfLines={1}>{service.title}</Text>
                                        <Text style={styles.featuredCompany} numberOfLines={1}>{service.company.company_name}</Text>
                                        <View style={styles.featuredMeta}>
                                            <Text style={styles.featuredPrice}>
                                                {!service.requires_quote ? `R$ ${service.price}` : 'Sob orçamento'}
                                            </Text>
                                            <View style={styles.dot} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </FadeInView>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Serviços perto de você</Text>
                    {services.map((service, idx) => (
                        <FadeInView key={service.id + '_list'} delay={idx * 80}>
                            <TouchableOpacity
                                style={styles.providerRow}
                                onPress={() => router.push(`/company/${service.company.id}`)}
                            >
                                <Image source={{ uri: service.company.logo_url || 'https://images.unsplash.com/photo-1628157588553-5eeea00af15c?auto=format&fit=crop&w=100' }} style={styles.providerLogo} />
                                <View style={styles.providerInfo}>
                                    <Text style={styles.providerName}>{service.title}</Text>
                                    <Text style={styles.providerBio} numberOfLines={1}>{service.company.company_name}</Text>
                                    <View style={styles.providerMeta}>
                                        <Text style={styles.providerTag}>{service.company.city}</Text>
                                        <Text style={[styles.providerTag, { color: Colors.primary, fontWeight: '800' }]}>
                                            • {!service.requires_quote ? `R$ ${service.price}` : 'Orçamento'}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={Colors.border} />
                            </TouchableOpacity>
                        </FadeInView>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20 },
    greeting: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '700' },
    headerTitle: { ...Typography.h3, color: Colors.text, fontWeight: '900', letterSpacing: -0.5 },
    profileBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', ...Shadows.sm },
    avatar: { width: '100%', height: '100%' },
    avatarPlaceholder: { flex: 1, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { ...Typography.label, color: Colors.text, fontWeight: '800' },

    searchContainer: { paddingHorizontal: 24, paddingBottom: 16, backgroundColor: Colors.white },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: 16,
        height: 56,
        borderRadius: 28,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.borderLight
    },
    searchInput: { flex: 1, ...Typography.bodySmall, color: Colors.text, fontWeight: '600' },

    section: { marginTop: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
    sectionTitle: { ...Typography.h4, color: Colors.text, paddingHorizontal: 24, marginBottom: 16 },
    seeAll: { ...Typography.caption, color: Colors.primary, fontWeight: '800' },

    categoryList: { paddingHorizontal: 16, gap: 8 },
    categoryItem: { alignItems: 'center', width: 85 },
    categoryIcon: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    categoryLabel: { fontSize: 11, fontWeight: '800', color: Colors.text },

    featuredList: { paddingHorizontal: 24, gap: 16 },
    featuredCard: { width: 220, height: 260, borderRadius: 32, overflow: 'hidden', backgroundColor: Colors.white, ...Shadows.md, borderWidth: 1, borderColor: Colors.borderLight },
    featuredCover: { width: '100%', height: '65%', resizeMode: 'cover' },
    featuredLogoBox: { position: 'absolute', top: '55%', left: 20, width: 44, height: 44, borderRadius: 16, backgroundColor: Colors.white, padding: 3, ...Shadows.sm },
    featuredLogo: { width: '100%', height: '100%', borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    favBtn: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
    featuredInfo: { padding: 16, paddingTop: 28 },
    featuredName: { ...Typography.label, color: Colors.text, fontWeight: '900' },
    featuredCompany: { fontSize: 11, color: Colors.textTertiary, fontWeight: '700', marginBottom: 4 },
    featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    featuredPrice: { fontSize: 11, fontWeight: '900', color: Colors.primary },
    featuredRating: { fontSize: 11, fontWeight: '900', color: Colors.text },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.border, marginHorizontal: 2 },
    featuredCity: { fontSize: 11, fontWeight: '600', color: Colors.textTertiary },

    providerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: Colors.white,
        marginHorizontal: 24,
        borderRadius: 24,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Shadows.sm
    },
    providerLogo: { width: 56, height: 56, borderRadius: 18, marginRight: 16 },
    providerInfo: { flex: 1 },
    providerName: { ...Typography.label, color: Colors.text, fontWeight: '800', marginBottom: 2 },
    providerBio: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 },
    providerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    providerTag: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary },
});
