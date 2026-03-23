import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '../utils/supabase';

export default function ScanScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.header, { backgroundColor: Colors.white }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeBtnLight}>
                        <Ionicons name="arrow-back" size={28} color={Colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.content}>
                    <View style={[styles.iconBox, { backgroundColor: Colors.primaryLight }]}>
                        <Ionicons name="camera-outline" size={80} color={Colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: Colors.text }]}>Permissão de Câmera</Text>
                    <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
                        Precisamos da sua permissão para acessar a câmera e escanear o QR Code de validação.
                    </Text>
                    <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.primary }]} onPress={requestPermission}>
                        <Text style={[styles.btnText, { color: Colors.white }]}>Permitir Acesso</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const validateOrder = async (orderId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('id, status, services(title), profiles!orders_buyer_id_fkey(full_name)')
                .eq('id', orderId)
                .maybeSingle();

            if (error || !data) {
                throw new Error('Pedido não encontrado ou inválido.');
            }

            // Exibir Detalhes e Rota para o Pedido
            Alert.alert(
                'Validação de Pedido',
                `Cliente: ${data.profiles?.full_name}\nServiço: ${data.services?.title}\nStatus: ${data.status}`,
                [
                    { text: 'Cancelar', style: 'cancel', onPress: () => setScanned(false) },
                    { text: 'Acessar Pedido', onPress: () => {
                        setScanned(false);
                        router.push(`/orders/${data.id}`);
                    } }
                ]
            );
        } catch (e: any) {
            Alert.alert(
                'Erro',
                e.message || 'Houve um erro ao validar o QR Code.',
                [{ text: 'Tentar Novamente', onPress: () => setScanned(false) }]
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
        if (scanned || loading) return;
        setScanned(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        let orderId = data;
        try {
            const parsed = JSON.parse(data);
            if (parsed.orderId) {
                orderId = parsed.orderId;
            }
        } catch (e) {
            // Non-JSON string, assume it's the raw ID
        }

        validateOrder(orderId);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <CameraView 
                style={{ flex: 1 }} 
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            >
                <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                            <Ionicons name="close" size={28} color={Colors.white} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Ler QR Code</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.scannerFrame}>
                        <View style={styles.frameCornerTopLeft} />
                        <View style={styles.frameCornerTopRight} />
                        <View style={styles.frameCornerBottomLeft} />
                        <View style={styles.frameCornerBottomRight} />
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.footerContainer}>
                            <Ionicons name="scan" size={24} color={Colors.white} />
                            <Text style={styles.footerText}>
                                Aponte a câmera para o QR Code do cliente para confirmar o andamento do pedido.
                            </Text>
                        </View>
                    </View>
                </SafeAreaView>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
    iconBox: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl },
    title: { ...Typography.h2, fontWeight: '900', marginBottom: Spacing.sm, textAlign: 'center' },
    subtitle: { ...Typography.body, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xxl },
    btn: { paddingHorizontal: 40, paddingVertical: 18, borderRadius: BorderRadius.xl, width: '100%', alignItems: 'center' },
    btnText: { fontSize: 18, fontWeight: '800' },
    
    // Scanner UI
    overlay: { flex: 1, backgroundColor: 'transparent' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    closeBtnLight: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { ...Typography.h3, color: Colors.white, fontWeight: '900' },
    
    scannerFrame: {
        flex: 1,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        width: 250,
        height: 250,
        position: 'relative',
        marginVertical: 'auto',
    },
    frameCornerTopLeft: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: Colors.white, borderTopLeftRadius: 20 },
    frameCornerTopRight: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: Colors.white, borderTopRightRadius: 20 },
    frameCornerBottomLeft: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: Colors.white, borderBottomLeftRadius: 20 },
    frameCornerBottomRight: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: Colors.white, borderBottomRightRadius: 20 },
    
    footer: { padding: 40, paddingBottom: 60, alignItems: 'center' },
    footerContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.7)', padding: 16, borderRadius: 16, alignItems: 'center', gap: 12 },
    footerText: { flex: 1, color: Colors.white, fontSize: 13, fontWeight: '600', lineHeight: 20 },
});
