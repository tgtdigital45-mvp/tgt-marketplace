import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, UserPlus } from 'lucide-react-native';

export default function SignUpScreen() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignUp = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        user_type: 'client',
                    },
                },
            });

            if (error) throw error;

            Alert.alert(
                'Conta criada!',
                'Verifique seu e-mail para confirmar o cadastro.',
                [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
            );
        } catch (error: any) {
            Alert.alert(
                'Erro no cadastro',
                error.message || 'Ocorreu um erro ao criar a conta.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-brand-background"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
                <View className="flex-1 justify-center py-12">
                    {/* Header */}
                    <View className="items-center mb-10">
                        <View className="w-20 h-20 bg-brand-accent rounded-2xl items-center justify-center mb-4 shadow-lg">
                            <UserPlus size={36} color="#ffffff" />
                        </View>
                        <Text className="text-brand-primary text-3xl font-bold">
                            Criar Conta
                        </Text>
                        <Text className="text-brand-secondary text-base mt-2">
                            Encontre os melhores profissionais
                        </Text>
                    </View>

                    {/* Form */}
                    <View className="space-y-4">
                        <View className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex-row items-center">
                            <UserPlus size={20} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-3 text-brand-primary h-6"
                                placeholder="Nome completo"
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize="words"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>

                        <View className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex-row items-center mt-4">
                            <Mail size={20} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-3 text-brand-primary h-6"
                                placeholder="E-mail"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>

                        <View className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex-row items-center mt-4">
                            <Lock size={20} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-3 text-brand-primary h-6"
                                placeholder="Senha"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                placeholderTextColor="#94a3b8"
                            />
                        </View>

                        <View className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex-row items-center mt-4">
                            <Lock size={20} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-3 text-brand-primary h-6"
                                placeholder="Confirmar senha"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                placeholderTextColor="#94a3b8"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleSignUp}
                            disabled={loading}
                            className={`bg-brand-accent rounded-xl py-4 items-center mt-8 shadow-md ${loading ? 'opacity-70' : ''}`}
                        >
                            <Text className="text-white font-bold text-lg">
                                {loading ? 'Criando conta...' : 'Cadastrar'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View className="flex-row justify-center mt-12">
                        <Text className="text-brand-secondary">Já tem conta?</Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <Text className="text-brand-accent font-bold ml-1">Entrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
