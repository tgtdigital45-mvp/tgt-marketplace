import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Lock, Mail } from 'lucide-react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

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
            Alert.alert('Falha no Login', error.message || 'Ocorreu um erro ao tentar entrar.');
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
                    {/* Logo / Title Area */}
                    <View className="items-center mb-12">
                        <View className="w-20 h-20 bg-brand-primary rounded-2xl items-center justify-center mb-4 shadow-lg">
                            <Text className="text-white text-4xl font-black">TGT</Text>
                        </View>
                        <Text className="text-brand-primary text-3xl font-bold">Bem-vindo</Text>
                        <Text className="text-brand-secondary text-base mt-2">Acesse sua conta de cliente</Text>
                    </View>

                    {/* Form */}
                    <View className="space-y-4">
                        <View className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex-row items-center">
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

                        <TouchableOpacity className="items-end mt-2" onPress={() => router.push('/(auth)/forgot-password')}>
                            <Text className="text-brand-accent font-medium">Esqueceu a senha?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loading}
                            className={`bg-brand-primary rounded-xl py-4 items-center mt-8 shadow-md ${loading ? 'opacity-70' : ''}`}
                        >
                            <Text className="text-white font-bold text-lg">
                                {loading ? 'Entrando...' : 'Entrar'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View className="flex-row justify-center mt-12">
                        <Text className="text-brand-secondary">Ainda não tem conta?</Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                            <Text className="text-brand-accent font-bold ml-1">Cadastre-se</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
