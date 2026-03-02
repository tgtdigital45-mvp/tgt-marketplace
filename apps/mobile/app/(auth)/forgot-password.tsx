import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Mail, ArrowLeft, Send } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Erro', 'Por favor, informe seu e-mail.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'tgt-cliente://reset-password',
            });

            if (error) throw error;

            Alert.alert('Sucesso', 'E-mail de recuperação enviado! Verifique sua caixa de entrada.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Ocorreu um erro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <ArrowLeft size={24} color="#f8fafc" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Recupere sua senha</Text>
                    <Text style={styles.subtitle}>Enviaremos um link de recuperação para o seu e-mail.</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>E-mail</Text>
                        <View style={styles.inputWrapper}>
                            <Mail size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.input}
                                placeholder="seu@email.com"
                                placeholderTextColor="#94a3b8"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.resetButtonText}>Enviar Link</Text>
                                <Send size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        zIndex: 10,
        padding: 8,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 140,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        color: '#f8fafc',
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 8,
        lineHeight: 24,
    },
    form: {
        gap: 32,
    },
    inputContainer: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        color: '#f8fafc',
        fontWeight: '600',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    input: {
        flex: 1,
        height: 56,
        color: '#f8fafc',
        marginLeft: 12,
        fontSize: 16,
    },
    resetButton: {
        backgroundColor: '#2563eb',
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
