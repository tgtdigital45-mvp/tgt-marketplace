import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Keyboard,
    Alert,
    Platform,
    TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { Colors, BorderRadius, Spacing, Shadows } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import PasswordInput from '../../components/ui/PasswordInput';
import { LEGAL_URLS } from '../../utils/version';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    async function signInWithEmail() {
        if (!email || !password) {
            setErrorMsg('Por favor, preencha e-mail e senha.');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    setErrorMsg('E-mail ou senha incorretos.');
                } else {
                    setErrorMsg(error.message);
                }
            }
        } catch (e: any) {
            setErrorMsg(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleForgotPassword() {
        if (!email.trim()) {
            Alert.alert('Aviso', 'Digite seu e-mail primeiro para receber o link de recuperação.');
            return;
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: Linking.createURL('/(auth)/login'),
            });
            if (error) throw error;
            Alert.alert(
                'Link enviado!',
                'Verifique sua caixa de entrada para redefinir sua senha.'
            );
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Não foi possível enviar o link de recuperação.');
        }
    }

    async function signInWithGoogle() {
        setLoading(true);
        try {
            const redirectTo = Linking.createURL('/(tabs)');
            
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            const res = await WebBrowser.openAuthSessionAsync(
                data.url,
                redirectTo
            );

            if (res.type === 'success') {
                const { url } = res;
                const params = url.split('#')[1] || url.split('?')[1];
                if (!params) throw new Error('Dados de autenticação não encontrados na URL.');

                const parts = params.split('&');
                const accessToken = parts.find(p => p.startsWith('access_token='))?.split('=')[1];
                const refreshToken = parts.find(p => p.startsWith('refresh_token='))?.split('=')[1];

                if (accessToken && refreshToken) {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                    if (sessionError) throw sessionError;
                }
            }
        } catch (e: any) {
            console.error('Erro Google Auth:', e);
            Alert.alert('Erro', e.message || 'Não foi possível entrar com o Google.');
        } finally {
            setLoading(false);
        }
    }

    async function signInWithApple() {
        setLoading(true);
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (!credential.identityToken) throw new Error('Token Apple inválido.');

            const { error } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: credential.identityToken,
            });

            if (error) throw error;
        } catch (e: any) {
            if (e.code !== 'ERR_REQUEST_CANCELED') {
                Alert.alert('Erro', 'Não foi possível entrar com o Apple ID.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <SafeAreaView style={styles.inner}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.title}>Bem-vindo ao{'\n'}CONTRATTO.</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <TextInput
                                style={styles.input}
                                onChangeText={(text: string) => {
                                    setEmail(text);
                                    if (errorMsg) setErrorMsg('');
                                }}
                                value={email}
                                placeholder="Digite seu e-mail"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                placeholderTextColor={Colors.textTertiary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <PasswordInput
                                onChangeText={(text: string) => {
                                    setPassword(text);
                                    if (errorMsg) setErrorMsg('');
                                }}
                                value={password}
                                placeholder="Digite sua senha"
                                autoCapitalize="none"
                                placeholderTextColor={Colors.textTertiary}
                            />
                        </View>

                        <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                            <Text style={styles.forgotText}>Esqueceu a senha?</Text>
                        </TouchableOpacity>

                        {errorMsg ? (
                            <Text style={styles.errorText}>{errorMsg}</Text>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            disabled={loading}
                            onPress={signInWithEmail}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <Text style={styles.buttonText}>Entrar</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>Ou entre com</Text>
                            <View style={styles.divider} />
                        </View>

                        <View style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialBtn} onPress={signInWithGoogle}>
                                <Ionicons name="logo-google" size={24} color="#EA4335" />
                            </TouchableOpacity>
                            {Platform.OS === 'ios' && (
                                <AppleAuthentication.AppleAuthenticationButton
                                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                                    cornerRadius={30}
                                    style={styles.appleBtn}
                                    onPress={signInWithApple}
                                />
                            )}
                        </View>
                    </View>

                    <View style={styles.registerContainer}>
                        <Text style={styles.registerText}>Não tem uma conta? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                            <Text style={styles.registerLink}>Cadastre-se</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.legalNotice}>
                        <Text style={styles.legalNoticeText}>
                            Ao entrar, você concorda com nossos{' '}
                            <Text style={styles.legalLink} onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.TERMS_OF_USE)}>Termos</Text>
                            {' '}e{' '}
                            <Text style={styles.legalLink} onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.PRIVACY_POLICY)}>Privacidade</Text>.
                        </Text>
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
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xxl,
    },
    headerContainer: {
        marginTop: Spacing.xxl,
        marginBottom: 48,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.brand,
        lineHeight: 40,
        letterSpacing: -1,
    },
    formContainer: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: Spacing.md,
    },
    input: {
        height: 60,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        paddingHorizontal: 20,
        fontSize: 16,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: Spacing.xl,
    },
    forgotText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    button: {
        backgroundColor: Colors.brand,
        height: 60,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.md,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '800',
    },
    errorText: {
        color: Colors.error,
        fontSize: 14,
        marginBottom: Spacing.md,
        textAlign: 'center',
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.xl,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },
    dividerText: {
        marginHorizontal: Spacing.md,
        color: Colors.textTertiary,
        fontSize: 14,
        fontWeight: '500',
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    socialBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
    },
    appleBtn: {
        width: 60,
        height: 60,
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
    },
    registerText: {
        color: Colors.textSecondary,
        fontSize: 15,
        fontWeight: '500',
    },
    registerLink: {
        color: Colors.brand,
        fontSize: 15,
        fontWeight: '800',
    },
    legalNotice: {
        position: 'absolute',
        bottom: 15,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    legalNoticeText: {
        fontSize: 11,
        color: Colors.textTertiary,
        textAlign: 'center',
    },
    legalLink: {
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});
