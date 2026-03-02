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
import { User, Mail, Lock, Phone, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

export default function RegisterScreen() {
    const router = useRouter();
    const [type, setType] = useState<'client' | 'company'>('client');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!fullName || !email || !password) {
            Alert.alert('Erro', 'Preencha os campos obrigatórios.');
            return;
        }

        setLoading(true);
        try {
            const { data: { user }, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        type: type,
                    },
                },
            });

            if (signUpError) throw signUpError;

            if (user) {
                Alert.alert('Sucesso', 'Conta criada! Verifique seu e-mail para confirmar.', [
                    { text: 'OK', onPress: () => router.replace('/(auth)/login') }
                ]);
            }
        } catch (error: any) {
            Alert.alert('Erro no Cadastro', error.message || 'Ocorreu um erro.');
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
                    <Text style={styles.title}>Crie sua conta</Text>
                    <Text style={styles.subtitle}>Junte-se à maior rede de serviços.</Text>
                </View>

                {/* Account Type Selector */}
                <View style={styles.typeSelector}>
                    <TouchableOpacity
                        style={[styles.typeOption, type === 'client' && styles.typeActive]}
                        onPress={() => setType('client')}
                    >
                        <User size={24} color={type === 'client' ? '#fff' : '#94a3b8'} />
                        <Text style={[styles.typeText, type === 'client' && styles.typeTextActive]}>Sou Cliente</Text>
                        {type === 'client' && <CheckCircle2 size={16} color="#fff" style={styles.checkIcon} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.typeOption, type === 'company' && styles.typeActive]}
                        onPress={() => setType('company')}
                    >
                        <Lock size={24} color={type === 'company' ? '#fff' : '#94a3b8'} />
                        <Text style={[styles.typeText, type === 'company' && styles.typeTextActive]}>Sou Profissional</Text>
                        {type === 'company' && <CheckCircle2 size={16} color="#fff" style={styles.checkIcon} />}
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Nome Completo</Text>
                        <View style={styles.inputWrapper}>
                            <User size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.input}
                                placeholder="Seu nome"
                                placeholderTextColor="#94a3b8"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>
                    </View>

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

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Senha</Text>
                        <View style={styles.inputWrapper}>
                            <Lock size={20} color="#94a3b8" />
                            <TextInput
                                style={styles.input}
                                placeholder="Mínimo 6 caracteres"
                                placeholderTextColor="#94a3b8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.registerButtonText}>Criar Conta</Text>
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
        paddingTop: 120,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        color: '#f8fafc',
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 4,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    typeOption: {
        flex: 1,
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
        position: 'relative',
    },
    typeActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    typeText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    typeTextActive: {
        color: '#fff',
    },
    checkIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    form: {
        gap: 20,
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
    registerButton: {
        backgroundColor: '#2563eb',
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
