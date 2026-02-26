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
import { Mail, ArrowLeft } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const router = useRouter();

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

            setSent(true);
        } catch (error: any) {
            Alert.alert(
                'Erro',
                error.message || 'Não foi possível enviar o e-mail de recuperação.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <View className="flex-1 bg-brand-background justify-center items-center px-6">
                <View className="w-20 h-20 bg-brand-success/10 rounded-full items-center justify-center mb-6">
                    <Mail size={40} color="#10b981" />
                </View>
                <Text className="text-brand-primary text-2xl font-bold text-center mb-3">
                    E-mail enviado!
                </Text>
                <Text className="text-brand-secondary text-center text-base mb-8">
                    Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </Text>
                <TouchableOpacity
                    onPress={() => router.replace('/(auth)/login')}
                    className="bg-brand-primary rounded-xl py-4 px-10 shadow-md"
                >
                    <Text className="text-white font-bold text-lg">Voltar ao Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-brand-background"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
                <View className="flex-1 justify-center py-12">
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="flex-row items-center mb-10"
                    >
                        <ArrowLeft size={20} color="#334155" />
                        <Text className="text-brand-secondary font-medium ml-2">Voltar</Text>
                    </TouchableOpacity>

                    {/* Header */}
                    <View className="mb-8">
                        <Text className="text-brand-primary text-3xl font-bold mb-2">
                            Recuperar Senha
                        </Text>
                        <Text className="text-brand-secondary text-base">
                            Informe seu e-mail e enviaremos um link para redefinir sua senha.
                        </Text>
                    </View>

                    {/* Form */}
                    <View>
                        <View className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex-row items-center">
                            <Mail size={20} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-3 text-brand-primary h-6"
                                placeholder="E-mail cadastrado"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>

                        <TouchableOpacity
                            onPress={handleResetPassword}
                            disabled={loading}
                            className={`bg-brand-primary rounded-xl py-4 items-center mt-8 shadow-md ${loading ? 'opacity-70' : ''}`}
                        >
                            <Text className="text-white font-bold text-lg">
                                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
