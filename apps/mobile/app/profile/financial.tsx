import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import { Colors, BorderRadius, Shadows } from '../../utils/theme';
import { logger } from '../../utils/logger';

type OrderFinance = {
    id: string;
    price: number | null;
    created_at: string;
    services: { 
        title: string;
        companies: { company_name: string; profile_id: string } | null;
    } | null;
    profiles: { full_name: string } | null;
};

export default function FinancialScreen() {
    const router = useRouter();
    const { session, profile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<OrderFinance[]>([]);
    const [totalValue, setTotalValue] = useState(0);

    const isProvider = profile?.user_type === 'company';

    useEffect(() => {
        async function fetchFinancials() {
            if (!session?.user?.id) return;

            try {
                let query = supabase
                    .from('orders')
                    .select(`
                        id, price, created_at,
                        services (
                            title,
                            companies (company_name, profile_id)
                        ),
                        profiles:buyer_id (full_name)
                    `)
                    .eq('status', 'completed')
                    .not('price', 'is', null)
                    .order('created_at', { ascending: false });

                if (isProvider) {
                    query = query.eq('seller_id', session.user.id);
                } else {
                    query = query.eq('buyer_id', session.user.id);
                }

                const { data, error } = await query;
                if (error) throw error;

                const filteredData = (data as any[]) || [];
                setHistory(filteredData);

                const sum = filteredData.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
                setTotalValue(sum);

            } catch (error) {
                logger.error('Error fetching financials:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchFinancials();
    }, [session, isProvider]);

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']} aria-label="Financeiro">
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isProvider ? 'Meu Faturamento' : 'Meus Pagamentos'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={[styles.summaryCard, isProvider ? styles.summaryProvider : styles.summaryCustomer]}>
                    <Text style={styles.summaryLabel}>
                        {isProvider ? 'Total Recebido (Todos os tempos)' : 'Total Gasto no App'}
                    </Text>
                    <Text style={styles.summaryValue}>
                        R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                    {isProvider && <Text style={styles.summarySub}>Excluindo taxas da plataforma.</Text>}
                </View>

                <Text style={styles.sectionTitle}>Histórico de Pedidos Concluídos</Text>

                {history.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={48} color={Colors.border} />
                        <Text style={styles.emptyText}>Nenhuma transação concluída ainda.</Text>
                    </View>
                ) : (
                    history.map((item) => {
                        const dateStr = new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
                        const srvTitle = item.services?.title || 'Serviço';
                        const partnerName = isProvider
                            ? item.profiles?.full_name
                            : item.services?.companies?.company_name;

                        return (
                            <View key={item.id} style={styles.historyCard}>
                                <View style={styles.historyIcon}>
                                    <Ionicons name={isProvider ? 'arrow-down' : 'arrow-up'} size={20} color={isProvider ? Colors.success : Colors.error} />
                                </View>
                                <View style={styles.historyInfo}>
                                    <Text style={styles.historyTitle}>{srvTitle}</Text>
                                    <Text style={styles.historyPartner}>{isProvider ? 'Cliente:' : 'Empresa:'} {partnerName}</Text>
                                    <Text style={styles.historyDate}>{dateStr}</Text>
                                </View>
                                <Text style={[styles.historyValue, { color: isProvider ? Colors.success : Colors.text }]}>
                                    {isProvider ? '+' : ''}R$ {item.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                        );
                    })
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
    container: { flex: 1, backgroundColor: Colors.surface },
    navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },

    scroll: { padding: 20, paddingBottom: 40 },

    summaryCard: { padding: 24, borderRadius: 20, marginBottom: 30, ...Shadows.md },
    summaryProvider: { backgroundColor: Colors.success },
    summaryCustomer: { backgroundColor: Colors.text },

    summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
    summaryValue: { color: Colors.white, fontSize: 36, fontWeight: '800', letterSpacing: -1 },
    summarySub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 8 },

    sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 16 },

    emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.borderLight },
    emptyText: { color: Colors.textTertiary, marginTop: 12, fontWeight: '500' },

    historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: 16, borderRadius: 16, marginBottom: 12, ...Shadows.sm },
    historyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    historyInfo: { flex: 1 },
    historyTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
    historyPartner: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
    historyDate: { fontSize: 12, color: Colors.textTertiary },
    historyValue: { fontSize: 16, fontWeight: '800' }
});
