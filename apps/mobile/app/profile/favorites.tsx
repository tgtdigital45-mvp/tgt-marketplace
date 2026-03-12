import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, Shadows } from '../../utils/theme';
import { logger } from '../../utils/logger';

type FavoriteCompany = {
    id: string;
    company_id: string;
    companies: {
        business_name: string;
        address_city: string;
        address_state: string;
        logo_url: string | null;
    };
};

export default function FavoritesScreen() {
    const router = useRouter();
    const { session } = useAuth();

    const [favorites, setFavorites] = useState<FavoriteCompany[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFavorites = async () => {
        if (!session?.user?.id) return;
        try {
            const { data, error } = await supabase
                .from('favorite_companies')
                .select(`
                    id, company_id,
                    companies (business_name, address_city, address_state, logo_url)
                `)
                .eq('client_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFavorites((data as unknown as FavoriteCompany[]) || []);
        } catch (error) {
            logger.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, [session]);

    const handleRemoveFavorite = async (favId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { error } = await supabase.from('favorite_companies').delete().eq('id', favId);
            if (error) throw error;
            setFavorites(prev => prev.filter(f => f.id !== favId));
        } catch (error) {
            logger.error('Error removing fav:', error);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']} aria-label="Favoritos">
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Empresas Favoritas</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={favorites}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.list, favorites.length === 0 && styles.emptyList]}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="heart-dislike-outline" size={48} color={Colors.border} />
                        <Text style={styles.emptyTitle}>Nenhum favorito salvo</Text>
                        <Text style={styles.emptySubtitle}>Quando gostar de uma empresa, clique no coração para salvá-la aqui.</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const c = Array.isArray(item.companies) ? item.companies[0] : item.companies;
                    return (
                        <TouchableOpacity style={styles.card} onPress={() => router.push(`/company/${item.company_id}`)} activeOpacity={0.8}>
                            <View style={styles.cardRow}>
                                <View style={styles.logoWrapper}>
                                    <Image
                                        source={{ uri: c?.logo_url || 'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=150&q=80' }}
                                        style={styles.logo}
                                    />
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.companyName} numberOfLines={1}>{c?.business_name || 'Empresa'}</Text>
                                    <Text style={styles.companyLocation}>{c?.address_city}, {c?.address_state}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleRemoveFavorite(item.id)} style={styles.removeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Ionicons name="heart" size={22} color={Colors.error} />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
    container: { flex: 1, backgroundColor: Colors.surface },
    navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },

    list: { padding: 20 },
    emptyList: { flex: 1, justifyContent: 'center' },

    emptyState: { alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 8 },
    emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

    card: { backgroundColor: Colors.white, padding: 16, borderRadius: 16, marginBottom: 16, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    logoWrapper: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.borderLight, overflow: 'hidden', marginRight: 16 },
    logo: { width: '100%', height: '100%' },
    cardInfo: { flex: 1 },
    companyName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
    companyLocation: { fontSize: 13, color: Colors.textSecondary },
    removeBtn: { padding: 4 }
});
