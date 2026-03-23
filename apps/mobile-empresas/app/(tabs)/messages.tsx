import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../utils/theme';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import FadeInView from '../../components/ui/FadeInView';
import EmptyState from '../../components/ui/EmptyState';
import * as Haptics from 'expo-haptics';
import { logger } from '../../utils/logger';

type ChatOrder = {
    id: string;
    status: string;
    created_at: string;
    updated_at: string;
    profiles: { first_name: string; last_name: string | null; avatar_url: string | null } | null;
    services: { title: string } | null;
};

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function MessagesTabScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [chats, setChats] = useState<ChatOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchChats = useCallback(async (silent = false) => {
        if (!user) return;
        if (!silent) setIsLoading(true);

        try {
            const { data, error } = await supabase
                .from('orders')
                .select('id, status, created_at, updated_at, profiles!orders_buyer_id_fkey(first_name, last_name, avatar_url), services(title)')
                .eq('seller_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setChats((data as unknown as ChatOrder[]) || []);
        } catch (e) {
            logger.error('Error fetching chat orders:', e);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    const handleRefresh = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsRefreshing(true);
        fetchChats(true);
    };

    const StatusBadge = ({ status }: { status: string }) => {
        if (status === 'pending') return <View style={[styles.statusDot, { backgroundColor: Colors.warning }]} />;
        if (status === 'accepted') return <View style={[styles.statusDot, { backgroundColor: Colors.primary }]} />;
        if (status === 'in_progress') return <View style={[styles.statusDot, { backgroundColor: '#0EA5E9' }]} />;
        return <View style={[styles.statusDot, { backgroundColor: Colors.textTertiary }]} />;
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Mensagens</Text>
                </View>
                <View style={styles.list}>
                    {[1, 2, 3, 4].map(i => (
                        <View key={i} style={styles.skeletonRow}>
                            <Skeleton width={56} height={56} borderRadius={28} />
                            <View style={{ flex: 1, marginLeft: 16, gap: 8 }}>
                                <Skeleton width="50%" height={20} borderRadius={4} />
                                <Skeleton width="80%" height={16} borderRadius={4} />
                            </View>
                        </View>
                    ))}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']} aria-label="Mensagens">
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mensagens</Text>
                <TouchableOpacity onPress={handleRefresh}>
                    <Ionicons name="refresh" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={chats}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
                ListEmptyComponent={
                    <FadeInView delay={300} style={{ marginTop: 60 }}>
                        <EmptyState
                            icon="chatbubbles-outline"
                            title="Nenhuma conversa"
                            subtitle="Quando os clientes enviarem mensagens sobre serviços, elas aparecerão aqui."
                        />
                    </FadeInView>
                }
                renderItem={({ item, index }) => (
                    <FadeInView delay={index * 50} translateY={10}>
                        <TouchableOpacity
                            style={styles.chatRow}
                            activeOpacity={0.7}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push(`/orders/chat?orderId=${item.id}`);
                            }}
                        >
                            <View style={styles.avatarContainer}>
                                {item.profiles?.avatar_url ? (
                                    <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarInitials}>
                                            {(item.profiles?.first_name?.[0] || 'C').toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.statusIndicator}>
                                    <StatusBadge status={item.status} />
                                </View>
                            </View>

                            <View style={styles.chatInfo}>
                                <View style={styles.chatHeader}>
                                    <Text style={styles.clientName} numberOfLines={1}>
                                        {item.profiles?.first_name} {item.profiles?.last_name || ''}
                                    </Text>
                                    <Text style={styles.dateText}>{formatDate(item.updated_at || item.created_at)}</Text>
                                </View>
                                <Text style={styles.serviceName} numberOfLines={1}>
                                    Orçamento: {item.services?.title}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </FadeInView>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        backgroundColor: Colors.white,
    },
    headerTitle: { ...Typography.h2, color: Colors.text, fontWeight: '900' },
    
    list: { paddingHorizontal: Spacing.lg, paddingTop: 8, paddingBottom: 100 },
    
    skeletonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    
    chatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    avatarContainer: { position: 'relative', marginRight: 16 },
    avatar: { width: 56, height: 56, borderRadius: 28 },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: { ...Typography.h3, color: Colors.textTertiary, fontWeight: '800' },
    statusIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.white,
        padding: 2,
        borderRadius: 10,
    },
    statusDot: { width: 12, height: 12, borderRadius: 6 },
    
    chatInfo: { flex: 1, justifyContent: 'center' },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
    clientName: { ...Typography.body, fontWeight: '800', color: Colors.text, flex: 1, paddingRight: 8 },
    dateText: { fontSize: 11, fontWeight: '600', color: Colors.textTertiary },
    serviceName: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
});
