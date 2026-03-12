import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../utils/theme';
import { logger } from '../../utils/logger';
import FadeInView from '../../components/ui/FadeInView';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import * as Haptics from 'expo-haptics';

type Report = {
    id: string;
    reporter_id: string;
    reported_id: string;
    type: 'company' | 'user' | 'chat';
    reason: string;
    details: string;
    status: 'pending' | 'resolved' | 'dismissed';
    created_at: string;
    reporter: { first_name: string; last_name: string } | null;
};

export default function ModerationScreen() {
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReports = async () => {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*, reporter:reporter_id(first_name, last_name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data as unknown as Report[]);
        } catch (e) {
            logger.error('Error fetching reports:', e);
            Alert.alert('Erro', 'Não foi possível carregar as denúncias.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleAction = async (reportId: string, status: 'resolved' | 'dismissed') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { error } = await supabase
                .from('reports')
                .update({ status })
                .eq('id', reportId);

            if (error) throw error;

            setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            logger.error('Error updating report:', e);
            Alert.alert('Erro', 'Operação falhou.');
        }
    };

    const renderItem = ({ item }: { item: Report }) => (
        <View style={[styles.reportCard, item.status !== 'pending' && styles.resolvedCard]}>
            <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: item.type === 'company' ? Colors.primaryLight : Colors.warningLight }]}>
                    <Text style={[styles.typeText, { color: item.type === 'company' ? Colors.primary : Colors.warning }]}>
                        {item.type.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString('pt-BR')}</Text>
            </View>

            <Text style={styles.reasonText}>{item.reason}</Text>
            <Text style={styles.detailsText}>{item.details}</Text>

            <View style={styles.reporterBox}>
                <Ionicons name="person-circle-outline" size={16} color={Colors.textTertiary} />
                <Text style={styles.reporterName}>
                    Por: {item.reporter?.first_name || 'Desconhecido'} {item.reporter?.last_name || ''}
                </Text>
            </View>

            {item.status === 'pending' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.dismissBtn]}
                        onPress={() => handleAction(item.id, 'dismissed')}
                    >
                        <Ionicons name="close-circle-outline" size={18} color={Colors.textSecondary} />
                        <Text style={styles.dismissText}>Descartar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.resolveBtn]}
                        onPress={() => handleAction(item.id, 'resolved')}
                    >
                        <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
                        <Text style={styles.resolveText}>Resolver</Text>
                    </TouchableOpacity>
                </View>
            )}

            {item.status !== 'pending' && (
                <View style={styles.statusBadge}>
                    <Ionicons
                        name={item.status === 'resolved' ? "checkmark-circle" : "close-circle"}
                        size={14}
                        color={item.status === 'resolved' ? Colors.success : Colors.textTertiary}
                    />
                    <Text style={[styles.statusText, { color: item.status === 'resolved' ? Colors.success : Colors.textTertiary }]}>
                        {item.status === 'resolved' ? 'Resolvido' : 'Descartado'}
                    </Text>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Moderação</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={reports}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                onRefresh={() => {
                    setRefreshing(true);
                    fetchReports();
                }}
                refreshing={refreshing}
                ListEmptyComponent={() => !loading ? (
                    <View style={styles.empty}>
                        <Ionicons name="shield-outline" size={64} color={Colors.border} />
                        <Text style={styles.emptyText}>Nenhuma denúncia pendente</Text>
                    </View>
                ) : null}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    navHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.white,
        borderBottomWidth: 1, borderBottomColor: Colors.borderLight
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...Typography.h4, color: Colors.text },

    list: { padding: 20, paddingBottom: 40 },
    reportCard: {
        backgroundColor: Colors.white, borderRadius: 20, padding: 20,
        marginBottom: 16, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm
    },
    resolvedCard: { opacity: 0.6 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    typeText: { fontSize: 10, fontWeight: '900' },
    dateText: { fontSize: 12, color: Colors.textTertiary, fontWeight: '500' },

    reasonText: { ...Typography.label, color: Colors.text, marginBottom: 8 },
    detailsText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 16 },

    reporterBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
    reporterName: { fontSize: 12, color: Colors.textTertiary, fontWeight: '600' },

    actions: { flexDirection: 'row', gap: 12 },
    actionBtn: { flex: 1, height: 48, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    dismissBtn: { borderWidth: 1, borderColor: Colors.border },
    resolveBtn: { backgroundColor: Colors.success },
    dismissText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
    resolveText: { fontSize: 14, fontWeight: '700', color: Colors.white },

    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },

    empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { marginTop: 16, color: Colors.textTertiary, fontWeight: '700' }
});
