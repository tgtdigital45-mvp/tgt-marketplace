import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { Colors, BorderRadius, Spacing, Shadows } from '../../utils/theme';
import { isValidEmail, isStrongPassword } from '../../utils/validators';
import PasswordInput from '../../components/ui/PasswordInput';

export default function SignupScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    async function signUpWithEmail() {
        if (!name || !email || !password) {
            setErrorMsg('Por favor, preencha todos os campos.');
            return;
        }

        if (!isValidEmail(email)) {
            setErrorMsg('Digite um e-mail válido.');
            return;
        }

        const pwCheck = isStrongPassword(password);
        if (!pwCheck.valid) {
            setErrorMsg(pwCheck.message);
            return;
        }

        setLoading(true);
        setErrorMsg('');

        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: {
                    full_name: name.trim(),
                },
            },
        });

        if (error) {
            if (error.message.includes('User already registered')) {
                setErrorMsg('Este e-mail já está cadastrado.');
            } else {
                setErrorMsg(error.message);
            }
            setLoading(false);
            return;
        }

        if (!session) {
            Alert.alert(
                'Conta Criada!',
                'Por favor verifique seu e-mail para confirmar o cadastro.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } else {
            router.replace('/(tabs)');
        }

        setLoading(false);
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <SafeAreaView style={styles.inner}>
                    <View style={styles.headerContainer}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        >
                            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Criar Conta</Text>
                        <Text style={styles.subtitle}>Junte-se ao CONTRATTO</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nome Completo</Text>
                            <TextInput
                                style={styles.input}
                                onChangeText={(text) => {
                                    setName(text);
                                    if (errorMsg) setErrorMsg('');
                                }}
                                value={name}
                                placeholder="João da Silva"
                                autoCapitalize="words"
                                placeholderTextColor={Colors.textTertiary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>E-mail</Text>
                            <TextInput
                                style={styles.input}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (errorMsg) setErrorMsg('');
                                }}
                                value={email}
                                placeholder="seu@email.com"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor={Colors.textTertiary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Senha</Text>
                            <PasswordInput
                                onChangeText={(text) => {
                                    setPassword(text);
                                    if (errorMsg) setErrorMsg('');
                                }}
                                value={password}
                                placeholder="Mín. 8 chars, maiúscula, número e especial"
                                autoCapitalize="none"
                                placeholderTextColor={Colors.textTertiary}
                            />
                        </View>

                        {errorMsg ? (
                            <Text style={styles.errorText}>{errorMsg}</Text>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            disabled={loading || !name || !email || !password}
                            onPress={signUpWithEmail}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <Text style={styles.buttonText}>Cadastrar</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    inner: {
        padding: Spacing.lg,
        flex: 1,
    },
    headerContainer: {
        marginBottom: 30,
    },
    backButton: {
        marginBottom: 20,
        alignSelf: 'flex-start',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: Spacing.sm,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    formContainer: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    input: {
        height: 56,
        borderColor: Colors.border,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        fontSize: 16,
        backgroundColor: Colors.surface,
        color: Colors.text,
    },
    button: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.sm,
        ...Shadows.md,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '800',
    },
    errorText: {
        color: Colors.error,
        fontSize: 14,
        marginBottom: Spacing.md,
        marginTop: -Spacing.sm,
        fontWeight: '600',
    },
});
