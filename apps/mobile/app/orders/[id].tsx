import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '../../utils/theme';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import { logger } from '../../utils/logger';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';

type OrderDetail = {
    id: string;
    status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'canceled' | 'disputed';
    scheduled_for: string;
    price: number;
    created_at: string;
    address_reference?: string;
    // description: string; // Coluna não existe no DB
    services: {
        title: string;
        description: string;
        price: number;
        requires_quote: boolean;
        companies: {
            company_name: string;
            logo_url: string;
        };
    };
    profiles: {
        full_name: string;
    };
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'Aguardando', color: Colors.warning, icon: 'time-outline' },
    accepted: { label: 'Aceito', color: Colors.primary, icon: 'checkmark-circle-outline' },
    rejected: { label: 'Recusado', color: Colors.error, icon: 'close-outline' },
    in_progress: { label: 'Em andamento', color: '#0EA5E9', icon: 'construct-outline' },
    completed: { label: 'Finalizado', color: Colors.success, icon: 'ribbon-outline' },
    canceled: { label: 'Cancelado', color: Colors.textSecondary, icon: 'close-circle-outline' },
    draft: { label: 'Rascunho', color: Colors.textSecondary, icon: 'document-outline' },
    disputed: { label: 'Em Disputa', color: '#F43F5E', icon: 'alert-circle-outline' },
};

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { profile } = useAuth();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);

    const [isCanceling, setIsCanceling] = useState(false);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const [permission, requestPermission] = useCameraPermissions();
    const [showScanner, setShowScanner] = useState(false);
    const [scannedAction, setScannedAction] = useState<'in_progress' | 'completed' | null>(null);

    const handleScanResult = (result: any) => {
        if (scannedAction && result.data === order?.id) {
            setShowScanner(false);
            handleUpdateStatus(scannedAction);
            setScannedAction(null);
        } else if (result.data !== order?.id) {
            Alert.alert('Código Inválido', 'Este QR Code não pertence a este pedido.');
            setShowScanner(false);
            setScannedAction(null);
        }
    };

    const openScanner = async (action: 'in_progress' | 'completed') => {
        if (!permission?.granted) {
            const { granted } = await requestPermission();
            if (!granted) {
                Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para ler o QR Code.');
                return;
            }
        }
        setScannedAction(action);
        setShowScanner(true);
    };

    const fetchOrderDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id, status, scheduled_for:booking_date, price:service_price, created_at, address_reference,
                    service_title, 
                    companies(company_name, logo_url),
                    profiles:client_id(full_name)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            
            // Map the data to match the UI's expected OrderDetail structure
            const mappedData = {
                ...data,
                // Harmonize status (cancelled in DB vs canceled in app)
                status: data.status === 'cancelled' ? 'canceled' : data.status,
                services: {
                    title: data.service_title,
                    description: '', // bookings don't have description, usually it's in the service
                    price: data.price,
                    companies: data.companies
                }
            };
            
            setOrder(mappedData as any);
        } catch (error) {
            logger.error('Error fetching order details:', error);
            Alert.alert('Erro', 'Não foi possível carregar os detalhes do pedido.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchOrderDetails();
    }, [id]);

    const handleCancelOrder = async () => {
        if (!order) return;

        setIsCanceling(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const { data, error } = await supabase.functions.invoke('cancel-order', {
                body: { order_id: order.id, cancel_reason: cancelReason.trim() }
            });

            if (error) {
                logger.error("Supabase edge function error:", error);
                throw error;
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            Alert.alert('Sucesso', 'O pedido foi cancelado e o reembolso processado (se aplicável).');
            setCancelModalVisible(false);
            fetchOrderDetails(); // Recarrega os dados com o novo status
        } catch (error: any) {
            logger.error('Error canceling order:', error);
            let errorMessage = 'Não foi possível cancelar o pedido. Tente novamente mais tarde.';
            if (error.message && error.message.includes('Acesso negado')) {
                errorMessage = error.message;
            } else if (error.message) {
                errorMessage = `Erro: ${error.message}`;
            }
            Alert.alert('Erro', errorMessage);
        } finally {
            setIsCanceling(false);
        }
    };

    const handleUpdateStatus = async (newStatus: 'accepted' | 'rejected' | 'in_progress' | 'completed') => {
        if (!order || isUpdatingStatus) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const statusLabels: Record<string, string> = {
            accepted: 'aceitar este pedido',
            in_progress: 'iniciar o serviço',
            completed: 'marcar como concluído',
        };

        const successMessages: Record<string, string> = {
            accepted: 'Pedido aceito com sucesso! O cliente será notificado.',
            rejected: 'Pedido recusado.',
            in_progress: 'Serviço iniciado! O cliente será notificado.',
            completed: 'Serviço finalizado com sucesso!',
        };

        Alert.alert(
            'Confirmar Ação',
            `Tem certeza que deseja ${statusLabels[newStatus]}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setIsUpdatingStatus(true);
                        try {
                            const { error } = await supabase
                                .from('bookings')
                                .update({ status: newStatus })
                                .eq('id', order.id);

                            if (error) throw error;

                            Alert.alert('Sucesso', successMessages[newStatus]);
                            fetchOrderDetails();
                        } catch (error) {
                            logger.error('Error updating status:', error);
                            Alert.alert('Erro', 'Não foi possível atualizar o status do pedido.');
                        } finally {
                            setIsUpdatingStatus(false);
                        }
                    },
                },
            ]
        );
    };

    const confirmCancelPrompt = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCancelReason('');
        setCancelModalVisible(true);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']} aria-label="Detalhes">
                <View style={styles.header}>
                    <Skeleton width={40} height={40} borderRadius={20} />
                    <Skeleton width={150} height={20} />
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.content}>
                    <Skeleton width="100%" height={80} borderRadius={24} style={{ marginBottom: 24 }} />
                    <Skeleton width={150} height={16} style={{ marginBottom: 10 }} />
                    <Skeleton width="100%" height={120} borderRadius={20} style={{ marginBottom: 24 }} />
                    <Skeleton width={150} height={16} style={{ marginBottom: 10 }} />
                    <Skeleton width="100%" height={80} borderRadius={20} style={{ marginBottom: 24 }} />
                </View>
            </SafeAreaView>
        );
    }

    if (!order) return null;

    const statusStyle = STATUS_MAP[order.status] || { label: order.status, color: Colors.textSecondary, icon: 'help-circle-outline' };
    const isProvider = profile?.user_type === 'company';

    // Se pendente e for provedor, é recusar. Caso contrário, se for pending ou accepted, é cancelar.
    const canCancel = order.status === 'pending' || order.status === 'accepted';
    const cancelText = isProvider && order.status === 'pending' ? 'Recusar Pedido' : 'Cancelar Pedido';

    return (
        <SafeAreaView style={styles.container} edges={['top']} aria-label="Detalhes">
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalhes do Pedido</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.statusCard, { backgroundColor: statusStyle.color + '10' }]}>
                    <Ionicons name={statusStyle.icon as any} size={32} color={statusStyle.color} />
                    <View style={styles.statusInfo}>
                        <Text style={[styles.statusLabel, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                        <Text style={styles.statusDate}>Pedido em {new Date(order.created_at).toLocaleDateString('pt-BR')}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Serviço Contratado</Text>
                    <View style={styles.card}>
                        <Text style={styles.serviceTitle}>{order.services.title}</Text>
                        <Text style={styles.serviceDesc}>{order.services.description}</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Valor Total</Text>
                            <Text style={styles.priceValue}>
                                {order.price != null 
                                    ? order.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                    : 'A combinar'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{isProvider ? 'Cliente' : 'Profissional'}</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
                            <Text style={styles.infoText}>
                                {isProvider
                                    ? order.profiles.full_name
                                    : order.services.companies.company_name}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.row, { marginTop: 12 }]}
                            onPress={() => {
                                logger.log(order.id);
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push(`/orders/chat?orderId=${order.id}`);
                            }}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.primary} />
                            <Text style={[styles.infoText, { color: Colors.primary, fontWeight: '700' }]}>Abrir Chat</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Agendamento e Local</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                            <Text style={styles.infoText}>
                                {order.scheduled_for 
                                    ? new Date(order.scheduled_for).toLocaleString('pt-BR', {
                                        day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
                                      })
                                    : 'Data a combinar'}
                            </Text>
                        </View>
                        {order.address_reference && (
                            <View style={[styles.row, { marginTop: 12 }]}>
                                <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
                                <Text style={styles.infoText}>{order.address_reference}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {(order as any).description && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Observações</Text>
                        <View style={styles.card}>
                            <Text style={styles.infoText}>{(order as any).description}</Text>
                        </View>
                    </View>
                )}

                {order.status === 'pending' && isProvider && (
                    <TouchableOpacity
                        style={[
                            styles.primaryBtn, 
                            order.services?.requires_quote && { backgroundColor: '#F59E0B' },
                            isUpdatingStatus && { opacity: 0.6 }
                        ]}
                        onPress={() => {
                            if (order.services?.requires_quote) {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push(`/orders/chat?orderId=${order.id}`);
                            } else {
                                handleUpdateStatus('accepted');
                            }
                        }}
                        disabled={isUpdatingStatus}
                    >
                        {isUpdatingStatus ? (
                            <ActivityIndicator color={Colors.white} size="small" />
                        ) : (
                            <Text style={styles.primaryBtnText}>
                                {order.services?.requires_quote ? 'Enviar Orçamento' : 'Aceitar Pedido'}
                            </Text>
                        )}
                    </TouchableOpacity>
                )}

                {order.status === 'accepted' && isProvider && (
                    <TouchableOpacity
                        style={[styles.primaryBtn, isUpdatingStatus && { opacity: 0.6 }]}
                        onPress={() => openScanner('in_progress')}
                        disabled={isUpdatingStatus}
                    >
                        {isUpdatingStatus ? (
                            <ActivityIndicator color={Colors.white} size="small" />
                        ) : (
                            <>
                                <Ionicons name="qr-code-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                                <Text style={styles.primaryBtnText}>Ler QR Code e Iniciar</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {order.status === 'in_progress' && isProvider && (
                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: Colors.success }, isUpdatingStatus && { opacity: 0.6 }]}
                        onPress={() => openScanner('completed')}
                        disabled={isUpdatingStatus}
                    >
                        {isUpdatingStatus ? (
                            <ActivityIndicator color={Colors.white} size="small" />
                        ) : (
                            <>
                                <Ionicons name="qr-code-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                                <Text style={styles.primaryBtnText}>Ler QR Code e Concluir</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {!isProvider && order.status === 'completed' && (
                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: '#F59E0B' }]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push(`/orders/review?orderId=${order.id}`);
                        }}
                    >
                        <Ionicons name="star" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                        <Text style={styles.primaryBtnText}>Avaliar Serviço</Text>
                    </TouchableOpacity>
                )}

                {!isProvider && (order.status === 'accepted' || order.status === 'in_progress') && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Código de Segurança / Check-in</Text>
                        <View style={[styles.card, { alignItems: 'center', paddingVertical: 32 }]}>
                            <QRCode
                                value={order.id}
                                size={200}
                                color={Colors.text}
                                backgroundColor={Colors.white}
                            />
                            <Text style={[styles.infoText, { marginTop: 16, textAlign: 'center', flex: 0 }]}>
                                Mostre este código para o profissional ao {order.status === 'accepted' ? 'iniciar' : 'concluir'} o serviço.
                            </Text>
                        </View>
                    </View>
                )}

                {canCancel && (
                    <TouchableOpacity
                        style={[styles.secondaryBtn, { marginTop: order.status === 'pending' && isProvider ? 16 : 8 }, isCanceling && { opacity: 0.6 }]}
                        onPress={confirmCancelPrompt}
                        disabled={isCanceling}
                    >
                        {isCanceling ? (
                            <ActivityIndicator color={Colors.error} size="small" />
                        ) : (
                            <Text style={styles.secondaryBtnText}>{cancelText}</Text>
                        )}
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Modal de Confirmação de Cancelamento */}
            <Modal
                visible={cancelModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => !isCanceling && setCancelModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
                            <Text style={styles.modalTitle}>{cancelText}</Text>
                            <Text style={styles.modalDesc}>
                                Tem certeza que deseja cancelar? O valor será totalmente estornado.
                                {isProvider ? " O cliente será notificado." : " O profissional será notificado."}
                            </Text>

                            <TextInput
                                style={styles.cancelInput}
                                placeholder="Motivo do cancelamento (opcional)"
                                value={cancelReason}
                                onChangeText={setCancelReason}
                                multiline
                                maxLength={200}
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.modalCancelBtn}
                                    onPress={() => setCancelModalVisible(false)}
                                    disabled={isCanceling}
                                >
                                    <Text style={styles.modalCancelText}>Voltar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalConfirmBtn}
                                    onPress={handleCancelOrder}
                                    disabled={isCanceling}
                                >
                                    {isCanceling ? (
                                        <ActivityIndicator color={Colors.white} size="small" />
                                    ) : (
                                        <Text style={styles.modalConfirmText}>Confirmar Cancelamento</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Modal do Scanner de QR Code */}
            <Modal
                visible={showScanner}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setShowScanner(false)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
                    <View style={{ flex: 1, position: 'relative' }}>
                        <CameraView
                            style={StyleSheet.absoluteFillObject}
                            facing="back"
                            barcodeScannerSettings={{
                                barcodeTypes: ['qr'],
                            }}
                            onBarcodeScanned={(result) => {
                                if (showScanner) {
                                  handleScanResult(result);
                                }
                            }}
                        />
                        <View style={styles.scannerOverlay}>
                            <View style={styles.scannerTopBar}>
                                <TouchableOpacity onPress={() => setShowScanner(false)} style={styles.scannerCloseBtn}>
                                    <Ionicons name="close" size={28} color={Colors.white} />
                                </TouchableOpacity>
                                <Text style={styles.scannerTitle}>Ler QR Code</Text>
                                <View style={{ width: 44 }} />
                            </View>
                            <View style={styles.scannerTarget}>
                                <View style={styles.scannerCornerTL} />
                                <View style={styles.scannerCornerTR} />
                                <View style={styles.scannerCornerBL} />
                                <View style={styles.scannerCornerBR} />
                            </View>
                            <Text style={styles.scannerInstruction}>Posicione o código do cliente na área demarcada</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
    content: { padding: 20, paddingBottom: 40 },

    statusCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 24, borderWidth: 1, borderColor: Colors.borderLight },
    statusInfo: { marginLeft: 16 },
    statusLabel: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
    statusDate: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, paddingLeft: 8 },
    card: { backgroundColor: Colors.white, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.borderLight },

    serviceTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 8 },
    serviceDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 16 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.surface, paddingTop: 16 },
    priceLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
    priceValue: { fontSize: 20, fontWeight: '900', color: Colors.success },

    row: { flexDirection: 'row', alignItems: 'center' },
    infoText: { fontSize: 15, color: Colors.text, fontWeight: '600', marginLeft: 12, flex: 1 },

    primaryBtn: { backgroundColor: Colors.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 8 },
    primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '800' },

    secondaryBtn: { backgroundColor: 'transparent', paddingVertical: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.error },
    secondaryBtnText: { color: Colors.error, fontSize: 16, fontWeight: '800' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', backgroundColor: Colors.white, borderRadius: 24, padding: 24, ...Shadows.lg },
    modalTitle: { ...Typography.h3, color: Colors.text, marginBottom: 12 },
    modalDesc: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: 20, lineHeight: 20 },
    cancelInput: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 12, padding: 16, minHeight: 100, textAlignVertical: 'top', ...Typography.body, marginBottom: 24 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalCancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, backgroundColor: Colors.surface, alignItems: 'center' },
    modalCancelText: { ...Typography.label, color: Colors.textSecondary, fontWeight: '700' },
    modalConfirmBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, backgroundColor: Colors.error, alignItems: 'center' },
    modalConfirmText: { ...Typography.label, color: Colors.white, fontWeight: '800' },
    
    scannerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'space-between', paddingVertical: 40 },
    scannerTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
    scannerCloseBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    scannerTitle: { color: Colors.white, fontSize: 18, fontWeight: '700' },
    scannerTarget: { alignSelf: 'center', width: 250, height: 250, backgroundColor: 'transparent' },
    scannerCornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderColor: Colors.primary, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
    scannerCornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderColor: Colors.primary, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
    scannerCornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderColor: Colors.primary, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
    scannerCornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderColor: Colors.primary, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },
    scannerInstruction: { color: Colors.white, textAlign: 'center', fontSize: 16, fontWeight: '600', paddingHorizontal: 40, marginBottom: 40 },
});
