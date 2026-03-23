import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../utils/theme';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import FadeInView from '../../components/ui/FadeInView';
import EmptyState from '../../components/ui/EmptyState';
import { z } from 'zod';
import { logger } from '../../utils/logger';

type Service = {
    id: string;
    title: string;
    description: string | null;
    price: number;
    requires_quote: boolean;
    is_single_package: boolean;
    service_type: string;
    location_type: string;
    estimated_duration: number | null;
    duration_unit: 'minutes' | 'hours' | 'days';
    service_forms?: { id: string; questions: string[] }[];
    packages?: {
        basic: any;
        standard: any;
        premium: any;
    };
};

const LOCATION_OPTIONS = [
    { value: 'at_home', label: 'No domicílio', icon: 'home-outline' as const },
    { value: 'in_store', label: 'No estabelecimento', icon: 'business-outline' as const },
    { value: 'remote', label: 'Remoto / Online', icon: 'laptop-outline' as const },
];

export default function ServicesTabScreen() {
    const { user } = useAuth();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [priceType, setPriceType] = useState<'fixed' | 'budget' | 'packages'>('fixed');
    const [locationType, setLocationType] = useState('in_store');
    const [duration, setDuration] = useState('');
    const [durationUnit, setDurationUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');
    const [questions, setQuestions] = useState<string[]>([]);
    
    // Estado para Pacotes
    const [activePackageTab, setActivePackageTab] = useState<'basic' | 'standard' | 'premium'>('basic');
    const [packageData, setPackageData] = useState({
        basic: { name: 'Básico', price: '', delivery_time: '7', description: '' },
        standard: { name: 'Padrão', price: '', delivery_time: '14', description: '' },
        premium: { name: 'Premium', price: '', delivery_time: '21', description: '' }
    });

    const fetchServices = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(false);
        try {
            const { data: company, error: compError } = await supabase.from('companies').select('id').eq('profile_id', user.id).maybeSingle();
            if (compError) throw compError;
            if (!company) return;
            setCompanyId(company.id);
            const { data, error: servError } = await supabase.from('services').select('*, service_forms(id, questions)').eq('company_id', company.id).order('created_at', { ascending: false });
            if (servError) throw servError;
            if (data) {
                const mappedData = data.map((s: any) => ({
                    ...s,
                    price_type: s.requires_quote ? 'budget' : (s.is_single_package ? 'fixed' : 'packages')
                }));
                setServices(mappedData as any);
            }
        } catch (e) {
            logger.error('Fetch Services Error:', e);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    const resetForm = () => {
        setTitle(''); setDescription(''); setPrice('');
        setPriceType('fixed'); setLocationType('in_store');
        setDuration(''); setEditingId(null);
        setDurationUnit('minutes');
        setQuestions([]);
        setActivePackageTab('basic');
        setPackageData({
            basic: { name: 'Básico', price: '', delivery_time: '7', description: '' },
            standard: { name: 'Padrão', price: '', delivery_time: '14', description: '' },
            premium: { name: 'Premium', price: '', delivery_time: '21', description: '' }
        });
    };

    const openAddModal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (svc: Service) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setEditingId(svc.id);
        setTitle(svc.title);
        setDescription(svc.description || '');
        setPrice(String(svc.price));
        setPriceType(svc.requires_quote ? 'budget' : (svc.is_single_package ? 'fixed' : 'packages'));
        setDuration(svc.estimated_duration ? String(svc.estimated_duration) : '');
        setDurationUnit(svc.duration_unit || 'minutes');
        setLocationType(svc.location_type);
        setQuestions(svc.service_forms && svc.service_forms.length > 0 ? svc.service_forms[0].questions : []);
        
        if (svc.packages) {
            setPackageData({
                basic: { 
                    name: svc.packages.basic?.name || 'Básico', 
                    price: svc.packages.basic?.price ? String(svc.packages.basic.price) : '', 
                    delivery_time: svc.packages.basic?.delivery_time ? String(svc.packages.basic.delivery_time) : '7', 
                    description: svc.packages.basic?.description || '' 
                },
                standard: { 
                    name: svc.packages.standard?.name || 'Padrão', 
                    price: svc.packages.standard?.price ? String(svc.packages.standard.price) : '', 
                    delivery_time: svc.packages.standard?.delivery_time ? String(svc.packages.standard.delivery_time) : '14', 
                    description: svc.packages.standard?.description || '' 
                },
                premium: { 
                    name: svc.packages.premium?.name || 'Premium', 
                    price: svc.packages.premium?.price ? String(svc.packages.premium.price) : '', 
                    delivery_time: svc.packages.premium?.delivery_time ? String(svc.packages.premium.delivery_time) : '21', 
                    description: svc.packages.premium?.description || '' 
                }
            });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        const parsedPrice = price.replace(',', '.');

        const serviceSchema = z.object({
            title: z.string().min(3, 'O nome do serviço deve ter pelo menos 3 caracteres.'),
        }).superRefine((data, ctx) => {
            if (priceType === 'fixed') {
                const numericPrice = Number(parsedPrice);
                if (!parsedPrice || isNaN(numericPrice) || numericPrice <= 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: 'Insira um preço válido maior que zero.',
                        path: ['price'],
                    });
                }
            }
        });

        try {
            serviceSchema.parse({ title: title.trim() });
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                Alert.alert('Atenção', error.issues[0].message);
                return;
            }
        }

        if (!companyId) {
            Alert.alert('Erro', 'Empresa não encontrada.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                company_id: companyId,
                title: title.trim(),
                description: description.trim() || null,
                price: priceType === 'fixed' ? Number(parsedPrice) : 0,
                requires_quote: priceType === 'budget',
                is_single_package: priceType !== 'packages',
                service_type: priceType === 'budget' ? 'requires_quote' : (priceType === 'packages' ? 'single' : 'local_provider_fixed'),
                location_type: locationType,
                estimated_duration: duration ? Number(duration) : null,
                duration_unit: durationUnit,
                packages: priceType === 'packages' ? {
                    basic: { ...packageData.basic, price: Number(packageData.basic.price), delivery_time: Number(packageData.basic.delivery_time) },
                    standard: { ...packageData.standard, price: Number(packageData.standard.price), delivery_time: Number(packageData.standard.delivery_time) },
                    premium: { ...packageData.premium, price: Number(packageData.premium.price), delivery_time: Number(packageData.premium.delivery_time) }
                } : null
            };

            let serviceId = editingId;

            if (editingId) {
                await supabase.from('services').update(payload).eq('id', editingId);
            } else {
                const { data: newSvc, error: insErr } = await supabase.from('services').insert(payload).select('id').single();
                if (insErr) throw insErr;
                serviceId = newSvc.id;
            }

            if (priceType === 'budget') {
                const validQuestions = questions.map(q => q.trim()).filter(q => q.length > 0);
                const { data: existingForm } = await supabase.from('service_forms').select('id').eq('service_id', serviceId).maybeSingle();
                
                if (existingForm) {
                    await supabase.from('service_forms').update({ questions: validQuestions }).eq('id', existingForm.id);
                } else {
                    await supabase.from('service_forms').insert({ service_id: serviceId, questions: validQuestions });
                }
            } else {
                await supabase.from('service_forms').delete().eq('service_id', serviceId);
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowModal(false);
            fetchServices();
        } catch (e) {
            logger.error(e);
            Alert.alert('Erro', 'Ocorreu um erro ao salvar o serviço.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (svc: Service) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert('Excluir Serviço', `Deseja remover "${svc.title}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir', style: 'destructive', onPress: async () => {
                    await supabase.from('services').delete().eq('id', svc.id);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    fetchServices();
                }
            }
        ]);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={[styles.navHeader, { borderBottomWidth: 0 }]}>
                    <Skeleton width={180} height={28} />
                    <Skeleton width={40} height={40} borderRadius={20} />
                </View>
                <View style={{ padding: 24, gap: 16 }}>
                    <Skeleton width="100%" height={100} borderRadius={24} />
                    <Skeleton width="100%" height={100} borderRadius={24} />
                    <Skeleton width="100%" height={100} borderRadius={24} />
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <View style={styles.navHeader}>
                    <Text style={styles.headerTitle}>Seus Serviços</Text>
                    <View style={{ width: 44 }} />
                </View>
                <EmptyState
                    icon="alert-circle-outline"
                    title="Erro ao carregar serviços"
                    subtitle="Não foi possível obter sua lista de serviços. Tente novamente."
                    actionLabel="Tentar Novamente"
                    onAction={fetchServices}
                    isError={true}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.navHeader}>
                <Text style={styles.headerTitle}>Seus Serviços</Text>
                <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
                    <Ionicons name="add" size={24} color={Colors.white} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={services}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <EmptyState
                        icon="construct-outline"
                        title="Sem serviços ainda"
                        subtitle="Cadastre o que você faz para que clientes te encontrem."
                        actionLabel="Cadastrar Serviço"
                        onAction={openAddModal}
                    />
                }
                renderItem={({ item, index }) => (
                    <FadeInView delay={index * 100} translateY={10}>
                        <TouchableOpacity
                            style={styles.card}
                            activeOpacity={0.8}
                            onPress={() => openEditModal(item)}
                        >
                            <View style={styles.cardTop}>
                                <View style={styles.titleInfo}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <Text style={styles.cardDesc} numberOfLines={1}>
                                        {item.description || 'Sem descrição definida'}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.trashBtn}>
                                    <Ionicons name="trash-outline" size={18} color={Colors.error} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.cardBottom}>
                                <View style={styles.metaBadge}>
                                    <Ionicons name="location-outline" size={14} color={Colors.textTertiary} />
                                    <Text style={styles.metaText}>
                                        {LOCATION_OPTIONS.find(o => o.value === item.location_type)?.label || 'No Local'}
                                    </Text>
                                </View>
                                <Text style={styles.priceText}>
                                    {item.requires_quote ? 'Sob Orçamento' : 
                                     (!item.is_single_package ? `Pacotes` : 
                                     formatCurrency(item.price))}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </FadeInView>
                )}
            />

            <Modal visible={showModal} animationType="slide" transparent>
                <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalDrag} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingId ? 'Editar' : 'Novo'} Serviço</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            <Text style={styles.inputLabel}>NOME DO SERVIÇO</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Pintura Residencial, Manutenção..."
                                placeholderTextColor={Colors.textTertiary}
                            />

                            <Text style={styles.inputLabel}>DESCRIÇÃO</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                placeholder="O que está incluso neste serviço?"
                                placeholderTextColor={Colors.textTertiary}
                            />

                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>TIPO DE PREÇO</Text>
                                    <View style={styles.priceTypeRow}>
                                        <TouchableOpacity
                                            style={[styles.typeBtn, priceType === 'fixed' && styles.typeBtnActive]}
                                            onPress={() => setPriceType('fixed')}
                                        >
                                            <Text style={[styles.typeBtnText, priceType === 'fixed' && styles.typeBtnTextActive]}>Fixo</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.typeBtn, priceType === 'budget' && styles.typeBtnActive]}
                                            onPress={() => setPriceType('budget')}
                                        >
                                            <Text style={[styles.typeBtnText, priceType === 'budget' && styles.typeBtnTextActive]}>Orçamento</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.typeBtn, priceType === 'packages' && styles.typeBtnActive]}
                                            onPress={() => setPriceType('packages')}
                                        >
                                            <Text style={[styles.typeBtnText, priceType === 'packages' && styles.typeBtnTextActive]}>Pacotes</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {priceType === 'fixed' && (
                                    <View style={{ flex: 1, marginLeft: 16 }}>
                                        <Text style={styles.inputLabel}>VALOR (R$)</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={price}
                                            onChangeText={setPrice}
                                            keyboardType="numeric"
                                            placeholder="120,00"
                                        />
                                    </View>
                                )}
                            </View>

                            {priceType === 'packages' && (
                                <View style={styles.packagesContainer}>
                                    <View style={styles.packageTabs}>
                                        {(['basic', 'standard', 'premium'] as const).map(tab => (
                                            <TouchableOpacity 
                                                key={tab}
                                                style={[styles.packageTab, activePackageTab === tab && styles.packageTabActive]}
                                                onPress={() => setActivePackageTab(tab)}
                                            >
                                                <Text style={[styles.packageTabText, activePackageTab === tab && styles.packageTabTextActive]}>
                                                    {tab === 'basic' ? 'Básico' : tab === 'standard' ? 'Padrão' : 'Premium'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={styles.packageForm}>
                                        <Text style={styles.inputLabel}>NOME DO PACOTE</Text>
                                        <TextInput
                                            style={styles.packageInput}
                                            value={packageData[activePackageTab].name}
                                            onChangeText={(text) => setPackageData({...packageData, [activePackageTab]: {...packageData[activePackageTab], name: text}})}
                                        />

                                        <View style={styles.row}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.inputLabel}>PREÇO (R$)</Text>
                                                <TextInput
                                                    style={styles.packageInput}
                                                    value={packageData[activePackageTab].price}
                                                    onChangeText={(text) => setPackageData({...packageData, [activePackageTab]: {...packageData[activePackageTab], price: text}})}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={styles.inputLabel}>PRAZO (DIAS)</Text>
                                                <TextInput
                                                    style={styles.packageInput}
                                                    value={packageData[activePackageTab].delivery_time}
                                                    onChangeText={(text) => setPackageData({...packageData, [activePackageTab]: {...packageData[activePackageTab], delivery_time: text}})}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                        </View>

                                        <Text style={styles.inputLabel}>O QUE ESTÁ INCLUSO?</Text>
                                        <TextInput
                                            style={[styles.packageInput, {height: 80}]}
                                            value={packageData[activePackageTab].description}
                                            onChangeText={(text) => setPackageData({...packageData, [activePackageTab]: {...packageData[activePackageTab], description: text}})}
                                            multiline
                                            placeholder="Detalhes deste pacote..."
                                        />
                                    </View>
                                </View>
                            )}

                            {priceType === 'budget' && (
                                <View style={styles.questionsContainer}>
                                    <View style={styles.questionsHeader}>
                                        <Text style={styles.inputLabel}>PERGUNTAS PARA O ORÇAMENTO</Text>
                                        <TouchableOpacity 
                                            style={styles.addQuestionBtn}
                                            onPress={() => setQuestions([...questions, ''])}
                                        >
                                            <Ionicons name="add" size={16} color={Colors.primary} />
                                            <Text style={styles.addQuestionText}>Adicionar</Text>
                                        </TouchableOpacity>
                                    </View>
                                    
                                    {questions.length === 0 ? (
                                        <Text style={styles.questionsHint}>
                                            Adicione perguntas para o cliente responder ao pedir um orçamento (ex: Qual o tamanho em m²?).
                                        </Text>
                                    ) : (
                                        questions.map((q, index) => (
                                            <View key={index} style={styles.questionRow}>
                                                <TextInput
                                                    style={styles.questionInput}
                                                    value={q}
                                                    onChangeText={(text) => {
                                                        const newQ = [...questions];
                                                        newQ[index] = text;
                                                        setQuestions(newQ);
                                                    }}
                                                    placeholder={`Pergunta ${index + 1}`}
                                                />
                                                <TouchableOpacity 
                                                    style={styles.removeQuestionBtn}
                                                    onPress={() => setQuestions(questions.filter((_, i) => i !== index))}
                                                >
                                                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                                                </TouchableOpacity>
                                            </View>
                                        ))
                                    )}
                                </View>
                            )}

                            <Text style={styles.inputLabel}>LOCAL DO ATENDIMENTO</Text>
                            <View style={styles.locationGrid}>
                                {LOCATION_OPTIONS.map(o => (
                                    <TouchableOpacity
                                        key={o.value}
                                        style={[styles.locBtn, locationType === o.value && styles.locBtnActive]}
                                        onPress={() => setLocationType(o.value)}
                                    >
                                        <Ionicons name={o.icon} size={20} color={locationType === o.value ? Colors.white : Colors.textTertiary} />
                                        <Text style={[styles.locBtnText, locationType === o.value && styles.locBtnTextActive]}>{o.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Salvar Serviço</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    navHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        backgroundColor: Colors.white,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        ...Shadows.sm
    },
    headerTitle: { ...Typography.h4, color: Colors.text, fontWeight: '900' },
    addBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadows.md },

    list: { padding: 24, gap: 16, paddingBottom: 100 },
    card: { backgroundColor: Colors.white, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    titleInfo: { flex: 1 },
    cardTitle: { ...Typography.label, color: Colors.text, fontWeight: '900', marginBottom: 4 },
    cardDesc: { ...Typography.caption, color: Colors.textTertiary, fontWeight: '600' },
    trashBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center' },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight },
    metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    metaText: { fontSize: 11, fontWeight: '800', color: Colors.textTertiary },
    priceText: { ...Typography.label, color: Colors.success, fontWeight: '900' },

    emptyBox: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
    emptyIconCircle: { width: 100, height: 100, borderRadius: 40, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', ...Shadows.md, marginBottom: 24 },
    emptyTitle: { ...Typography.h3, color: Colors.text, fontWeight: '900', marginBottom: 12 },
    emptyText: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    emptyBtn: { backgroundColor: Colors.text, paddingHorizontal: 32, paddingVertical: 18, borderRadius: 24, ...Shadows.md },
    emptyBtnText: { color: Colors.white, fontWeight: '900', fontSize: 15 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 24, maxHeight: '90%' },
    modalDrag: { width: 40, height: 5, backgroundColor: Colors.borderLight, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    modalTitle: { ...Typography.h3, color: Colors.text, fontWeight: '900' },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },

    inputLabel: { fontSize: 11, fontWeight: '900', color: Colors.textTertiary, marginBottom: 10, paddingLeft: 4, letterSpacing: 1 },
    input: { backgroundColor: Colors.surface, borderRadius: 20, padding: 18, marginBottom: 24, ...Typography.bodySmall, color: Colors.text, fontWeight: '700', borderWidth: 1, borderColor: Colors.borderLight },
    textArea: { height: 100, textAlignVertical: 'top' },

    row: { flexDirection: 'row', marginBottom: 24 },
    priceTypeRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 20, padding: 6, borderWidth: 1, borderColor: Colors.borderLight },
    typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 16 },
    typeBtnActive: { backgroundColor: Colors.white, ...Shadows.sm },
    typeBtnText: { fontSize: 13, fontWeight: '800', color: Colors.textTertiary },
    typeBtnTextActive: { color: Colors.primary },

    locationGrid: { gap: 12, marginBottom: 32 },
    locBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: Colors.borderLight },
    locBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    locBtnText: { ...Typography.bodySmall, fontWeight: '800', color: Colors.textTertiary },
    locBtnTextActive: { color: Colors.white },

    questionsContainer: { marginBottom: 24, padding: 16, backgroundColor: '#F8F9FA', borderRadius: 20, borderWidth: 1, borderColor: Colors.borderLight },
    questionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    addQuestionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#E0E7FF', borderRadius: 8 },
    addQuestionText: { fontSize: 12, fontWeight: '800', color: Colors.primary },
    questionsHint: { ...Typography.bodySmall, color: Colors.textTertiary, fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 },
    questionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    questionInput: { flex: 1, backgroundColor: Colors.white, borderRadius: 16, padding: 14, ...Typography.bodySmall, color: Colors.text, fontWeight: '600', borderWidth: 1, borderColor: Colors.borderLight },
    removeQuestionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center' },

    saveBtn: { backgroundColor: Colors.primary, paddingVertical: 20, borderRadius: 24, alignItems: 'center', ...Shadows.lg },
    saveBtnText: { color: Colors.white, fontWeight: '900', fontSize: 17 },

    packagesContainer: { marginBottom: 24, backgroundColor: Colors.surface, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight },
    packageTabs: { flexDirection: 'row', backgroundColor: Colors.borderLight + '40', padding: 4 },
    packageTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 20 },
    packageTabActive: { backgroundColor: Colors.white, ...Shadows.sm },
    packageTabText: { fontSize: 12, fontWeight: '800', color: Colors.textTertiary },
    packageTabTextActive: { color: Colors.primary },
    packageForm: { padding: 20 },
    packageInput: { backgroundColor: Colors.white, borderRadius: 16, padding: 14, marginBottom: 16, ...Typography.bodySmall, color: Colors.text, fontWeight: '700', borderWidth: 1, borderColor: Colors.borderLight },
});
