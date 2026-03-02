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
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Erro de Login', error.message || 'Ocorreu um erro ao entrar.');
        } finally {
            setLoading(true); // Keep loading until redirect
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar style="light" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Bem-vindo ao</Text>
                    <Text style={styles.brand}>CONTRATO</Text>
                    <Text style={styles.subtitle}>Conectando você aos melhores profissionais.</Text>
                </View>

                <View style={styles.form}>
                    {/* Email Field */}
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

                    {/* Password Field */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Senha</Text>
                        <View style={styles.inputWrapper}>
                            <Lock size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.input}
                                placeholder="Sua senha"
                                placeholderTextColor="#94a3b8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                {showPassword ? (
                                    <EyeOff size={20} color="#94a3b8" />
                                ) : (
                                    <Eye size={20} color="#94a3b8" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.forgotPassword}
                        onPress={() => router.push('/(auth)/forgot-password')}
                    >
                        <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.loginButtonText}>Entrar</Text>
                                <ArrowRight size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Não tem uma conta?</Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                        <Text style={styles.registerText}>Cadastre-se</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 80,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 48,
    },
    title: {
        fontSize: 24,
        color: '#f8fafc',
        fontWeight: '400',
    },
    brand: {
        fontSize: 48,
        color: '#2563eb',
        fontWeight: '900',
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 8,
    },
    form: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        color: '#f8fafc',
        marginBottom: 8,
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 32,
    },
    forgotPasswordText: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: '#2563eb',
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 40,
    },
    footerText: {
        color: '#94a3b8',
        fontSize: 15,
    },
    registerText: {
        color: '#2563eb',
        fontSize: 15,
        fontWeight: '700',
    },
});
