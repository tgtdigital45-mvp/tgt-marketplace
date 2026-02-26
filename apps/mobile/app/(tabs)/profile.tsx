import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import {
    User,
    Settings,
    Shield,
    LogOut,
    ChevronRight,
    Pencil,
    Check,
    X,
    Phone,
    Mail,
    DollarSign,
    Landmark,
} from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useUserProfile, useUpdateProfile } from '@/hooks/useUserProfile';

export default function ProfileScreen() {
    const { signOut, profile: authProfile } = useAuth();
    const { data: profile, isLoading } = useUserProfile();
    const updateProfile = useUpdateProfile();

    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (profile) {
            setFullName(profile.fullName);
            setPhone(profile.phone);
        }
    }, [profile]);

    const handleSave = async () => {
        try {
            await updateProfile.mutateAsync({ fullName, phone });
            setIsEditing(false);
            Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Não foi possível atualizar o perfil.');
        }
    };

    const handleCancel = () => {
        setFullName(profile?.fullName ?? '');
        setPhone(profile?.phone ?? '');
        setIsEditing(false);
    };

    const handleSignOut = () => {
        Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sair', style: 'destructive', onPress: signOut },
        ]);
    };

    const [connectingStripe, setConnectingStripe] = useState(false);

    const handleConnectStripe = async () => {
        if (!authProfile?.company_id) return;
        try {
            setConnectingStripe(true);
            const { data, error } = await supabase.functions.invoke('create-connect-onboarding', {
                body: {
                    company_id: authProfile.company_id,
                    return_url: 'acme://', // Adjust based on your deep link scheme (e.g. tgt-contratto://)
                    refresh_url: 'acme://',
                }
            });

            if (error) throw error;
            if (data?.url) {
                await WebBrowser.openBrowserAsync(data.url);
                // When they return from browser, fetch profile again to update stripe_charges_enabled
            } else {
                Alert.alert('Erro', 'Não foi possível gerar o link de onboarding.');
            }
        } catch (err: any) {
            console.error('Stripe Connect error:', err);
            Alert.alert('Erro', err.message || 'Erro ao conectar com Stripe');
        } finally {
            setConnectingStripe(false);
        }
    };

    const menuItems = [
        { icon: <Shield size={20} color="#334155" />, label: 'Segurança' },
        { icon: <Settings size={20} color="#334155" />, label: 'Configurações' },
    ];

    if (isLoading) {
        return (
            <View className="flex-1 bg-brand-background justify-center items-center">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="text-brand-secondary mt-3">Carregando perfil...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView className="flex-1 bg-brand-background">
                {/* Profile Header */}
                <View className="items-center pt-14 pb-8 bg-white border-b border-slate-100">
                    <View className="w-24 h-24 bg-brand-accent/10 rounded-full items-center justify-center mb-4">
                        <User size={48} color="#2563eb" />
                    </View>

                    {isEditing ? (
                        <View className="w-full px-6 mt-2">
                            {/* Name Field */}
                            <View className="mb-4">
                                <Text className="text-brand-secondary text-xs font-bold uppercase tracking-wider mb-2">
                                    Nome completo
                                </Text>
                                <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4">
                                    <User size={16} color="#94a3b8" />
                                    <TextInput
                                        className="flex-1 py-3 ml-3 text-brand-primary text-base"
                                        value={fullName}
                                        onChangeText={setFullName}
                                        placeholder="Seu nome"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            </View>

                            {/* Phone Field */}
                            <View className="mb-4">
                                <Text className="text-brand-secondary text-xs font-bold uppercase tracking-wider mb-2">
                                    Telefone
                                </Text>
                                <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-200 px-4">
                                    <Phone size={16} color="#94a3b8" />
                                    <TextInput
                                        className="flex-1 py-3 ml-3 text-brand-primary text-base"
                                        value={phone}
                                        onChangeText={setPhone}
                                        placeholder="(00) 00000-0000"
                                        placeholderTextColor="#94a3b8"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="flex-row gap-3 mt-2">
                                <TouchableOpacity
                                    onPress={handleCancel}
                                    className="flex-1 flex-row items-center justify-center bg-slate-100 rounded-xl py-3"
                                >
                                    <X size={18} color="#64748b" />
                                    <Text className="text-brand-secondary font-bold ml-2">Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSave}
                                    disabled={updateProfile.isPending}
                                    className="flex-1 flex-row items-center justify-center bg-brand-accent rounded-xl py-3"
                                >
                                    {updateProfile.isPending ? (
                                        <ActivityIndicator color="#ffffff" size="small" />
                                    ) : (
                                        <>
                                            <Check size={18} color="#ffffff" />
                                            <Text className="text-white font-bold ml-2">Salvar</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <Text className="text-brand-primary text-xl font-bold">
                                {profile?.fullName || 'Usuário'}
                            </Text>
                            <View className="flex-row items-center mt-1">
                                <Mail size={14} color="#94a3b8" />
                                <Text className="text-brand-secondary ml-1">{profile?.email}</Text>
                            </View>
                            {profile?.phone ? (
                                <View className="flex-row items-center mt-1">
                                    <Phone size={14} color="#94a3b8" />
                                    <Text className="text-brand-secondary ml-1">{profile.phone}</Text>
                                </View>
                            ) : null}
                            <TouchableOpacity
                                onPress={() => setIsEditing(true)}
                                className="flex-row items-center bg-brand-accent/10 rounded-full px-4 py-2 mt-4"
                            >
                                <Pencil size={14} color="#2563eb" />
                                <Text className="text-brand-accent font-semibold ml-1.5 text-sm">Editar Perfil</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Stripe Connect Section (Only for Providers) */}
                {authProfile?.type === 'company' && (
                    <View className="mt-6 px-6">
                        <View className={`p-5 rounded-2xl border ${!authProfile.stripe_charges_enabled ? 'bg-amber-50 border-amber-100' : 'bg-brand-background border-slate-200'}`}>
                            <View className="flex-row items-center mb-3">
                                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${!authProfile.stripe_charges_enabled ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                                    {authProfile.stripe_charges_enabled ? (
                                        <Landmark size={20} color="#059669" />
                                    ) : (
                                        <DollarSign size={20} color="#d97706" />
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-brand-primary font-bold">
                                        {authProfile.stripe_charges_enabled ? 'Recebimentos Ativados' : 'Configurar Recebimentos'}
                                    </Text>
                                    <Text className="text-brand-secondary text-xs mt-0.5">
                                        {authProfile.stripe_charges_enabled
                                            ? 'Sua conta está conectada à Stripe.'
                                            : 'Conecte sua conta para começar a aceitar pagamentos.'}
                                    </Text>
                                </View>
                            </View>
                            {!authProfile.stripe_charges_enabled && (
                                <TouchableOpacity
                                    onPress={handleConnectStripe}
                                    disabled={connectingStripe}
                                    className="bg-brand-primary py-3 rounded-xl items-center flex-row justify-center mt-2"
                                >
                                    {connectingStripe ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text className="text-white font-bold">Conectar com Stripe</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {/* Menu Items */}
                <View className="mt-6 px-6">
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            className="flex-row items-center justify-between bg-white p-4 rounded-xl mb-3 border border-slate-50 shadow-sm"
                        >
                            <View className="flex-row items-center">
                                {item.icon}
                                <Text className="ml-3 text-brand-secondary font-medium">{item.label}</Text>
                            </View>
                            <ChevronRight size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    ))}

                    {/* Sign out */}
                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="flex-row items-center bg-red-50 p-4 rounded-xl mt-6 border border-red-100"
                    >
                        <LogOut size={20} color="#ef4444" />
                        <Text className="ml-3 text-red-500 font-bold">Sair da Conta</Text>
                    </TouchableOpacity>
                </View>

                <View className="h-10" />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
