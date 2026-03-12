import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Shadows, Typography } from '../../utils/theme';
import FadeInView from '../../components/ui/FadeInView';
import { logger } from '../../utils/logger';

type DocumentType = 'identity_front' | 'identity_back' | 'address_proof' | 'business_license';

interface DocItem {
    type: DocumentType;
    label: string;
    description: string;
    icon: string;
    required: boolean;
}

const DOCUMENTS: DocItem[] = [
    { type: 'identity_front', label: 'RG/CNH (Frente)', description: 'Foto nítida da frente do seu documento de identidade.', icon: 'person-outline', required: true },
    { type: 'identity_back', label: 'RG/CNH (Verso)', description: 'Foto nítida do verso do seu documento.', icon: 'card-outline', required: true },
    { type: 'address_proof', label: 'Comp. de Residência', description: 'Conta de luz, água ou internet dos últimos 3 meses.', icon: 'home-outline', required: true },
    { type: 'business_license', label: 'Cartão CNPJ / MEI', description: 'Opcional para autônomos, obrigatório para empresas.', icon: 'business-outline', required: false },
];

export default function ComplianceScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [company, setCompany] = useState<any>(null);
    const [uploads, setUploads] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function fetchKYC() {
            if (!user) return;
            try {
                const { data } = await supabase
                    .from('companies')
                    .select('id, kyc_status, kyc_documents')
                    .eq('profile_id', user.id)
                    .single();

                if (data) {
                    setCompany(data);
                    const docs = data.kyc_documents || [];
                    const initialUploads: Record<string, string> = {};
                    docs.forEach((d: any) => {
                        initialUploads[d.type] = d.url;
                    });
                    setUploads(initialUploads);
                }
            } catch (e) {
                logger.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchKYC();
    }, [user]);

    const handlePickImage = async (type: DocumentType) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão Negada', 'Precisamos de acesso às suas fotos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0] && company) {
            const asset = result.assets[0];
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            try {
                setUploads(prev => ({ ...prev, [type]: 'uploading' }));

                const ext = asset.uri.split('.').pop() || 'jpg';
                const fileName = `compliance/${company.id}/${type}_${Date.now()}.${ext}`;

                const response = await fetch(asset.uri);
                const blob = await response.blob();
                const arrayBuffer = await new Response(blob).arrayBuffer();

                const { error: uploadError } = await supabase.storage
                    .from('marketplace')
                    .upload(fileName, arrayBuffer, {
                        contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('marketplace').getPublicUrl(fileName);
                setUploads(prev => ({ ...prev, [type]: urlData.publicUrl }));

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
                logger.error(e);
                setUploads(prev => {
                    const newUploads = { ...prev };
                    delete newUploads[type];
                    return newUploads;
                });
                Alert.alert('Erro', 'Falha ao carregar documento.');
            }
        }
    };

    const handleSubmit = async () => {
        const missing = DOCUMENTS.filter(d => d.required && !uploads[d.type]);
        if (missing.length > 0) {
            Alert.alert('Documentos pendentes', 'Por favor, carregue todos os documentos obrigatórios.');
            return;
        }

        setSubmitting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        try {
            const kycDocs = Object.keys(uploads).map(type => ({
                type,
                url: uploads[type],
                uploaded_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('companies')
                .update({
                    kyc_status: 'in_review',
                    kyc_documents: kycDocs
                })
                .eq('id', company.id);

            if (error) throw error;

            Alert.alert(
                'Sucesso!',
                'Seus documentos foram enviados para análise. O prazo de verificação é de até 48 horas.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (e) {
            logger.error(e);
            Alert.alert('Erro', 'Não foi possível enviar os documentos.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />
            </SafeAreaView>
        );
    }

    const isLocked = company?.kyc_status === 'in_review' || company?.kyc_status === 'approved';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Verificação (KYC)</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <FadeInView delay={100}>
                    <View style={styles.statusBanner}>
                        <Ionicons
                            name={company?.kyc_status === 'approved' ? 'checkmark-circle' : 'time'}
                            size={24}
                            color={company?.kyc_status === 'approved' ? Colors.success : Colors.warning}
                        />
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.statusTitle}>
                                {company?.kyc_status === 'approved' ? 'Identidade Verificada' :
                                    company?.kyc_status === 'in_review' ? 'Análise em andamento' : 'Submissão Pendente'}
                            </Text>
                            <Text style={styles.statusDesc}>
                                {company?.kyc_status === 'approved' ? 'Sua conta está liberada para qualquer plano.' :
                                    'Documentos necessários para liberar os planos Pro e Scale.'}
                            </Text>
                        </View>
                    </View>
                </FadeInView>

                {DOCUMENTS.map((doc, index) => (
                    <FadeInView key={doc.type} delay={200 + index * 50}>
                        <TouchableOpacity
                            style={[styles.docCard, uploads[doc.type] && styles.docCardActive, isLocked && { opacity: 0.8 }]}
                            onPress={() => !isLocked && handlePickImage(doc.type)}
                            disabled={isLocked}
                        >
                            <View style={styles.docIconBox}>
                                <Ionicons name={doc.icon as any} size={24} color={uploads[doc.type] ? Colors.primary : Colors.textTertiary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.docLabel}>{doc.label} {doc.required && <Text style={{ color: Colors.error }}>*</Text>}</Text>
                                <Text style={styles.docDesc}>{doc.description}</Text>
                            </View>
                            <View style={styles.actionBox}>
                                {uploads[doc.type] === 'uploading' ? (
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                ) : uploads[doc.type] ? (
                                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                                ) : (
                                    <Ionicons name="camera-outline" size={24} color={Colors.border} />
                                )}
                            </View>
                        </TouchableOpacity>
                    </FadeInView>
                ))}

                {!isLocked && (
                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Enviar para Análise</Text>}
                    </TouchableOpacity>
                )}

                <View style={styles.securityNote}>
                    <Ionicons name="lock-closed-outline" size={14} color={Colors.textTertiary} />
                    <Text style={styles.securityText}>Seus dados são criptografados e usados apenas para fins de conformidade financeira.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: Colors.white, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, ...Shadows.sm },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...Typography.h4, color: Colors.text, fontWeight: '900' },
    scroll: { padding: 24, paddingBottom: 60 },

    statusBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: 20, borderRadius: 24, marginBottom: 24, ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight },
    statusTitle: { fontSize: 16, fontWeight: '900', color: Colors.text },
    statusDesc: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },

    docCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.borderLight, gap: 16 },
    docCardActive: { borderColor: Colors.primary, borderWidth: 2 },
    docIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    docLabel: { fontSize: 14, fontWeight: '900', color: Colors.text },
    docDesc: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary, marginTop: 2, lineHeight: 16 },
    actionBox: { width: 40, alignItems: 'center' },

    submitBtn: { backgroundColor: Colors.primary, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 24, ...Shadows.lg },
    submitBtnText: { color: Colors.white, fontSize: 17, fontWeight: '900' },

    securityNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32, paddingHorizontal: 20 },
    securityText: { fontSize: 11, fontWeight: '700', color: Colors.textTertiary, textAlign: 'center' }
});
