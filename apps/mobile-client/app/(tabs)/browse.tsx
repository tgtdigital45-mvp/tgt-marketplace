import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, TextInput, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../utils/theme';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import FadeInView from '../../components/ui/FadeInView';
import EmptyState from '../../components/ui/EmptyState';
import { searchCompanies, getRecentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches, type SearchResult } from '../../utils/search';
import { logger } from '../../utils/logger';
import { Modal, TouchableWithoutFeedback } from 'react-native';

const { width } = Dimensions.get('window');

type Category = {
    id: string;
    name: string;
};

export default function BrowseScreen() {
    const [companies, setCompanies] = useState<SearchResult[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [showRecent, setShowRecent] = useState(false);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const router = useRouter();

    const fetchCategories = useCallback(async () => {
        const { data } = await supabase.from('categories').select('*').order('name');
        if (data) setCategories(data);
    }, []);

    const fetchCities = useCallback(async () => {
        const { data } = await supabase.from('companies').select('city').not('city', 'is', null);
        if (data) {
            const uniqueCities = Array.from(new Set(data.map((item: { city: string }) => item.city))).sort() as string[];
            setAvailableCities(uniqueCities);
        }
    }, []);

    const fetchCompanies = useCallback(async (categoryId: string | null, search: string, city: string | null) => {
        setIsLoading(true);
        setError(false);
        try {
            if (search.trim()) {
                // Usa busca FTS otimizada
                const results = await searchCompanies(search, {
                    categoryId,
                    city,
                    limit: 30,
                });
                setCompanies(results);
            } else {
                // Sem busca textual, usa query direta
                let query = supabase.from('companies').select(`
                    id, company_name, description, logo_url, cover_image_url, city, state,
                    services(category_tag)
                `, { count: 'exact' });

                if (categoryId) {
                    query = query.eq('services.category_tag', categoryId);
                }

                if (city) {
                    query = query.eq('city', city);
                }

                const { data, error } = await query.limit(30);
                if (error) throw error;

                const unique = data ? (data as any[]).filter((c, i, a) => a.findIndex(x => x.id === c.id) === i) : [];
                setCompanies(unique);
            }
        } catch (e) {
            logger.error(e);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Carrega buscas recentes
    useEffect(() => {
        fetchCategories();
        getRecentSearches().then(setRecentSearches);
    }, [fetchCategories]);

    // Debounce da busca
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchCompanies(selectedCategory, searchQuery, selectedCity);
        }, 400);
        return () => clearTimeout(timeout);
    }, [selectedCategory, searchQuery, selectedCity, fetchCompanies]);

    const handleCategoryPress = (catId: string | null) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedCategory(catId);
    };

    const handleSearchSubmit = async () => {
        if (searchQuery.trim()) {
            await addRecentSearch(searchQuery.trim());
            const updated = await getRecentSearches();
            setRecentSearches(updated);
            setShowRecent(false);
        }
    };

    const handleRecentPress = (term: string) => {
        setSearchQuery(term);
        setShowRecent(false);
    };

    const handleRemoveRecent = async (term: string) => {
        await removeRecentSearch(term);
        const updated = await getRecentSearches();
        setRecentSearches(updated);
    };

    const handleClearRecent = async () => {
        await clearRecentSearches();
        setRecentSearches([]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Explorar</Text>
                <View style={styles.searchRow}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color={Colors.textTertiary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar serviços, empresas..."
                            value={searchQuery}
                            onChangeText={(text) => {
                                setSearchQuery(text);
                                setShowRecent(text.length === 0);
                            }}
                            onFocus={() => setShowRecent(searchQuery.length === 0 && recentSearches.length > 0)}
                            onSubmitEditing={handleSearchSubmit}
                            returnKeyType="search"
                            placeholderTextColor={Colors.textTertiary}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => { setSearchQuery(''); setShowRecent(false); }}>
                                <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[styles.filterBtn, selectedCity && styles.filterBtnActive]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            fetchCities();
                            setIsFilterModalVisible(true);
                        }}
                    >
                        <Ionicons name="options-outline" size={22} color={selectedCity ? Colors.white : Colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Buscas recentes */}
            {showRecent && recentSearches.length > 0 && (
                <View style={styles.recentContainer}>
                    <View style={styles.recentHeader}>
                        <Text style={styles.recentTitle}>Buscas Recentes</Text>
                        <TouchableOpacity onPress={handleClearRecent}>
                            <Text style={styles.recentClear}>Limpar</Text>
                        </TouchableOpacity>
                    </View>
                    {recentSearches.map((term, idx) => (
                        <TouchableOpacity key={idx} style={styles.recentItem} onPress={() => handleRecentPress(term)}>
                            <Ionicons name="time-outline" size={16} color={Colors.textTertiary} />
                            <Text style={styles.recentText}>{term}</Text>
                            <TouchableOpacity onPress={() => handleRemoveRecent(term)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close" size={16} color={Colors.textTertiary} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Filtros por categoria */}
            <View style={styles.filterBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
                    <TouchableOpacity
                        style={[styles.chip, !selectedCategory && styles.chipActive]}
                        onPress={() => handleCategoryPress(null)}
                    >
                        <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>Todos</Text>
                    </TouchableOpacity>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.chip, selectedCategory === cat.id && styles.chipActive]}
                            onPress={() => handleCategoryPress(cat.id)}
                        >
                            <Text style={[styles.chipText, selectedCategory === cat.id && styles.chipTextActive]}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {isLoading ? (
                <View style={styles.loadingList}>
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </View>
            ) : error ? (
                <EmptyState
                    icon="cloud-offline-outline"
                    title="Erro de Conexão"
                    subtitle="Não foi possível carregar os dados. Verifique a sua conexão com a internet."
                    actionLabel="Tentar Novamente"
                    onAction={() => fetchCompanies(selectedCategory, searchQuery, selectedCity)}
                />
            ) : companies.length === 0 ? (
                <EmptyState
                    icon="search-outline"
                    title="Ops! Nenhum resultado"
                    subtitle="Tente buscar por outros termos ou categorias."
                />
            ) : (
                <FlatList
                    data={companies}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => (
                        <FadeInView delay={index * 100}>
                            <TouchableOpacity
                                style={styles.card}
                                activeOpacity={0.9}
                                onPress={() => router.push(`/company/${item.id}`)}
                            >
                                <Image
                                    source={{ uri: item.cover_image_url || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800' }}
                                    style={styles.cardCover}
                                />
                                <View style={styles.cardOverlay} />
                                <View style={styles.cardContent}>
                                    <View style={styles.logoCircle}>
                                        <Image source={{ uri: item.logo_url || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400' }} style={styles.logoImg} />
                                    </View>
                                    <View style={styles.info}>
                                        <Text style={styles.companyName}>{item.company_name}</Text>
                                        <View style={styles.row}>
                                            <Ionicons name="star" size={12} color={Colors.warning} />
                                            <Text style={styles.ratingText}>{item.rating?.toFixed(1) || 'New'}</Text>
                                            <Text style={styles.locationText}>• {item.city}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.arrowCircle}>
                                        <Ionicons name="chevron-forward" size={16} color={Colors.white} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </FadeInView>
                    )}
                    ListFooterComponent={<View style={{ height: 100 }} />}
                />
            )}
            {/* Modal de Filtros */}
            <Modal
                visible={isFilterModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsFilterModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalDismissArea}
                        activeOpacity={1}
                        onPress={() => setIsFilterModalVisible(false)}
                    />
                    <View style={styles.filterModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filtros</Text>
                            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.filterLabel}>Cidade</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityList}>
                            <TouchableOpacity
                                style={[styles.cityChip, !selectedCity && styles.cityChipActive]}
                                onPress={() => setSelectedCity(null)}
                            >
                                <Text style={[styles.cityChipText, !selectedCity && styles.cityChipTextActive]}>Todas</Text>
                            </TouchableOpacity>
                            {availableCities.map(city => (
                                <TouchableOpacity
                                    key={city}
                                    style={[styles.cityChip, selectedCity === city && styles.cityChipActive]}
                                    onPress={() => setSelectedCity(city)}
                                >
                                    <Text style={[styles.cityChipText, selectedCity === city && styles.cityChipTextActive]}>{city}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.clearBtn}
                                onPress={() => {
                                    setSelectedCity(null);
                                    setSelectedCategory(null);
                                }}
                            >
                                <Text style={styles.clearBtnText}>Limpar Tudo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyBtn}
                                onPress={() => setIsFilterModalVisible(false)}
                            >
                                <Text style={styles.applyBtnText}>Aplicar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
    title: { ...Typography.h2, color: Colors.text, marginBottom: 16, fontWeight: '900' },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: 16,
        height: 52,
        borderRadius: 26,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.borderLight
    },
    searchInput: { flex: 1, ...Typography.bodySmall, color: Colors.text, fontWeight: '600' },
    filterBtn: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    filterBtnActive: {
        backgroundColor: Colors.text,
        borderColor: Colors.text,
    },

    // Buscas recentes
    recentContainer: { paddingHorizontal: 24, paddingBottom: 12, backgroundColor: Colors.white },
    recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    recentTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    recentClear: { fontSize: 13, fontWeight: '600', color: Colors.primary },
    recentItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    recentText: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text },

    filterBar: { marginBottom: 16 },
    filterList: { paddingHorizontal: 24, gap: 10 },
    chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight },
    chipActive: { backgroundColor: Colors.text, borderColor: Colors.text },
    chipText: { ...Typography.caption, fontWeight: '800', color: Colors.textSecondary },
    chipTextActive: { color: Colors.white },

    loadingList: { padding: 24, gap: 20 },
    list: { padding: 24, gap: 20 },

    card: { width: '100%', height: 180, borderRadius: 28, overflow: 'hidden', ...Shadows.md },
    cardCover: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
    cardContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24
    },
    logoCircle: { width: 44, height: 44, borderRadius: 16, backgroundColor: Colors.white, ...Shadows.sm, marginRight: 12, padding: 3 },
    logoImg: { width: '100%', height: '100%', borderRadius: 13 },
    info: { flex: 1 },
    companyName: { ...Typography.label, color: Colors.text, fontWeight: '900', marginBottom: 2 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: 11, fontWeight: '900', color: Colors.text },
    locationText: { fontSize: 11, fontWeight: '600', color: Colors.textTertiary },
    arrowCircle: { width: 32, height: 32, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalDismissArea: { flex: 1 },
    filterModal: { backgroundColor: Colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { ...Typography.h3, color: Colors.text },
    filterLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    cityList: { gap: 8, paddingBottom: 24 },
    cityChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight },
    cityChipActive: { backgroundColor: Colors.text, borderColor: Colors.text },
    cityChipText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
    cityChipTextActive: { color: Colors.white },
    modalFooter: { flexDirection: 'row', gap: 12, marginTop: 12 },
    clearBtn: { flex: 1, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    clearBtnText: { ...Typography.buttonSmall, color: Colors.textSecondary },
    applyBtn: { flex: 2, height: 52, borderRadius: 26, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
    applyBtnText: { ...Typography.buttonSmall, color: Colors.white }
});
