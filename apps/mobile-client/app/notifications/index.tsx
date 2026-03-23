import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, BorderRadius, Shadows } from '../../utils/theme';

type NotificationItem = {
    id: string;
    type: string;
    title: string;
    body: string | null;
    data: Record<string, any>;
    is_read: boolean;
    created_at: string;
};

const ICON_MAP: Record<string, { name: string; color: string; bg: string }> = {
    new_message: { name: 'chatbubble', color: Colors.primary, bg: Colors.primaryLight },
    order_status: { name: 'receipt', color: Colors.success, bg: '#ECFDF5' },
    budget_proposal: { name: 'document-text', color: Colors.warning, bg: '#FEF3C7' },
};

const DEFAULT_ICON = { name: 'notifications', color: Colors.textSecondary, bg: Colors.borderLight };

export default function NotificationsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async (silent = false) => {
        if (!user) return;
        if (!silent) setLoading(true);

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (!error && data) setNotifications(data as NotificationItem[]);
        setLoading(false);
        setRefreshing(false);
    }, [user]);

    useEffect(() => {
        fetchNotifications();

        if (!user) return;
        const channel = supabase
            .channel('realtime_notifications')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                () => fetchNotifications(true)
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, fetchNotifications]);

    const handlePress = async (notif: NotificationItem) => {
        if (!notif.is_read) {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notif.id);

            setNotifications(prev =>
                prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
            );
        }

        if (notif.data?.order_id) {
            router.push(`/orders/chat?orderId=${notif.data.order_id}`);
        }
    };

    const markAllRead = async () => {
        if (!user) return;
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const formatTimeAgo = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Agora';
        if (mins < 60) return `${mins}min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <SafeAreaView style={styles.center} aria-label="Notificações">
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']} aria-label="Notificações">
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificações</Text>
                {unreadCount > 0 ? (
                    <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
                        <Text style={styles.markAllText}>Ler todas</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 70 }} />
                )}
            </View>

            <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.list, notifications.length === 0 && styles.emptyList]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchNotifications(true); }}
                        tintColor={Colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={48} color={Colors.border} />
                        <Text style={styles.emptyTitle}>Sem notificações</Text>
                        <Text style={styles.emptySubtitle}>Você será notificado sobre pedidos e mensagens aqui.</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const icon = ICON_MAP[item.type] || DEFAULT_ICON;
                    return (
                        <TouchableOpacity
                            style={[styles.notifCard, !item.is_read && styles.notifUnread]}
                            onPress={() => handlePress(item)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.notifIcon, { backgroundColor: icon.bg }]}>
                                <Ionicons name={icon.name as any} size={20} color={icon.color} />
                            </View>
                            <View style={styles.notifContent}>
                                <View style={styles.notifTopRow}>
                                    <Text style={[styles.notifTitle, !item.is_read && { color: Colors.text }]} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    <Text style={styles.notifTime}>{formatTimeAgo(item.created_at)}</Text>
                                </View>
                                {item.body && (
                                    <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                                )}
                            </View>
                            {!item.is_read && <View style={styles.unreadDot} />}
                        </TouchableOpacity>
                    );
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
    markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.primaryLight },
    markAllText: { color: Colors.primary, fontSize: 13, fontWeight: '700' },

    list: { paddingHorizontal: 16, paddingTop: 12 },
    emptyList: { flex: 1 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: Colors.textTertiary, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },

    notifCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: 16, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.borderLight },
    notifUnread: { backgroundColor: '#FAFBFF', borderColor: '#DBEAFE' },
    notifIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    notifContent: { flex: 1 },
    notifTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    notifTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 8 },
    notifTime: { fontSize: 12, color: Colors.textTertiary, fontWeight: '500' },
    notifBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: 8 },
});
