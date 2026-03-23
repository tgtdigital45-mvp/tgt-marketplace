import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, Shadows } from '../../utils/theme';

const FAQS = [
    {
        q: 'Como funciona o pagamento?',
        a: 'Os pagamentos são processados com segurança pela Stripe. O valor só é repassado ao profissional após a conclusão do serviço.'
    },
    {
        q: 'O que acontece se o profissional não comparecer?',
        a: 'Você pode cancelar o agendamento através da tela do Chat/Pedido e receberá o reembolso integral.'
    },
    {
        q: 'Como envio dinheiro pelo orçamento?',
        a: 'Quando o profissional envia o orçamento pelo chat, um botão de "Aceitar e Agendar" será exibido pra você fechar a contratação.'
    },
    {
        q: 'Posso cobrar uma taxa extra por fora?',
        a: 'Todos os valores devem ser inseridos dentro da plataforma para garantir a segurança de ambas as partes e o suporte em caso de disputas.'
    }
];

export default function SupportScreen() {
    const router = useRouter();
    const [expanded, setExpanded] = useState<number | null>(null);

    const toggleFaq = (idx: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpanded(expanded === idx ? null : idx);
    };

    const handleContactSupport = () => {
        Alert.alert(
            "Falar com Suporte",
            "Nossa central funciona via WhatsApp. Deseja abrir o app?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Abrir WhatsApp", onPress: () => Linking.openURL('https://wa.me/5511999999999?text=Preciso+de+ajuda+no+app') }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']} aria-label="Suporte">
            <View style={styles.navHeader}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Central de Ajuda</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.hero}>
                    <Ionicons name="help-buoy-outline" size={48} color={Colors.primary} />
                    <Text style={styles.heroTitle}>Como podemos ajudar?</Text>
                    <Text style={styles.heroSub}>Tire suas dúvidas ou fale diretamente com a nossa equipe.</Text>
                </View>

                <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>
                <View style={styles.faqList}>
                    {FAQS.map((faq, idx) => (
                        <TouchableOpacity key={idx} style={styles.faqCard} onPress={() => toggleFaq(idx)} activeOpacity={0.7}>
                            <View style={styles.faqHeader}>
                                <Text style={styles.faqQ}>{faq.q}</Text>
                                <Ionicons name={expanded === idx ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
                            </View>
                            {expanded === idx && (
                                <Text style={styles.faqA}>{faq.a}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Ainda Precisa de Ajuda?</Text>

                <TouchableOpacity style={styles.contactBtn} onPress={handleContactSupport}>
                    <View style={styles.contactIcon}>
                        <Ionicons name="logo-whatsapp" size={22} color={Colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.contactBtnTitle}>Suporte via WhatsApp</Text>
                        <Text style={styles.contactBtnSub}>Atendimento seg a sex, 09h às 18h</Text>
                    </View>
                    <Ionicons name="open-outline" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.contactBtn, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2', marginTop: 12 }]}
                    onPress={() => {
                        Linking.openURL('mailto:suporte@contratto.app?subject=Problema%20Técnico&body=Descreva%20o%20problema%20encontrado:');
                    }}
                >
                    <View style={[styles.contactIcon, { backgroundColor: Colors.error }]}>
                        <Ionicons name="warning-outline" size={22} color={Colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.contactBtnTitle, { color: '#991B1B' }]}>Reportar Problema Técnico</Text>
                        <Text style={[styles.contactBtnSub, { color: '#B91C1C' }]}>Erro em tela, lentidão, bugs</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.error} />
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },

    scroll: { padding: 24, paddingBottom: 60 },

    hero: { alignItems: 'center', marginBottom: 32, paddingTop: 16 },
    heroTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, marginTop: 12, marginBottom: 4 },
    heroSub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 },

    sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 16, marginTop: 16 },

    faqList: { gap: 12, marginBottom: 24 },
    faqCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    faqQ: { fontSize: 15, fontWeight: '600', color: Colors.text, flex: 1, paddingRight: 16 },
    faqA: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12 },

    contactBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.borderLight },
    contactIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    contactBtnTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
    contactBtnSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

    footerLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 40 },
    footerLinkText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', textDecorationLine: 'underline' }
});
