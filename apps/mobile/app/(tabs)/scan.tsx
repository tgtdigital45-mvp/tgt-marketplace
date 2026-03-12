import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ScanScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconBox}>
                    <Ionicons name="qr-code-outline" size={80} color={Colors.primary} />
                </View>
                <Text style={styles.title}>Scanner de Serviço</Text>
                <Text style={styles.subtitle}>
                    Aponte para o QR Code do profissional para iniciar o atendimento ou confirmar a chegada.
                </Text>

                <TouchableOpacity style={styles.btn}>
                    <Text style={styles.btnText}>Abrir Câmera</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    iconBox: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: Spacing.xxl,
        fontWeight: '500',
    },
    btn: {
        backgroundColor: Colors.text,
        paddingHorizontal: 40,
        paddingVertical: 18,
        borderRadius: BorderRadius.xl,
        width: '100%',
        alignItems: 'center',
    },
    btnText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '800',
    },
});
