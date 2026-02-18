import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@tgt/shared';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SocialButton from '@/components/ui/SocialButton';
import { useToast } from '@/contexts/ToastContext';
import { Store, Briefcase } from 'lucide-react';

const ClientLoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [portalError, setPortalError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { signInWithGoogle } = useAuth();
    const [isMounted, setIsMounted] = useState(true);

    React.useEffect(() => {
        return () => setIsMounted(false);
    }, []);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (err) {
            const error = err as Error;
            console.error('Google login error:', error);
            addToast(error.message || "Erro ao conectar com Google. Tente novamente.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setPortalError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                const metadataType = data.session.user.user_metadata.type as string;

                if (metadataType === 'company') {
                    await supabase.auth.signOut();
                    setPortalError('WRONG_PORTAL_TYPE');
                } else {
                    addToast('Login realizado com sucesso!', 'success');
                    navigate('/');
                }
            }
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Login error:', error);
            addToast('Credenciais inválidas. Verifique seu e-mail e senha.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Form (40%) */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-[480px] xl:w-[560px] lg:px-20 xl:px-24 bg-white z-10 relative">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-10">
                        {/* Mobile Logo View is handled by header usually, but if this is full page */}
                        <div className="h-10 w-10 bg-brand-primary rounded-lg flex items-center justify-center mb-6 lg:hidden">
                            <span className="text-white font-bold text-xl">T</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                            Bem-vindo de volta!
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Acesse sua conta para gerenciar pedidos e contratar serviços.
                        </p>
                    </div>

                    {/* Account Type Toggle */}
                    <div className="bg-gray-100 p-1 rounded-xl flex mb-8">
                        <button
                            className="flex-1 flex items-center justify-center py-2 px-4 text-sm font-medium rounded-lg bg-white text-gray-900 shadow-sm transition-all"
                        >
                            <Store className="w-4 h-4 mr-2 text-brand-primary" />
                            Sou Cliente
                        </button>
                        <Link
                            to="/login/empresa"
                            className="flex-1 flex items-center justify-center py-2 px-4 text-sm font-medium rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
                        >
                            <Briefcase className="w-4 h-4 mr-2" />
                            Sou Empresa
                        </Link>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                label="E-mail"
                                placeholder="seu@email.com"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                label="Senha"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <div className="flex items-center justify-end mt-1">
                                <Link to="/auth/forgot-password" className="text-sm font-medium text-brand-primary hover:text-brand-primary/80">
                                    Esqueceu a senha?
                                </Link>
                            </div>
                        </div>

                        {portalError === 'WRONG_PORTAL_TYPE' && (
                            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-medium text-amber-800">
                                            Conta de empresa detectada.
                                        </p>
                                        <div className="mt-2">
                                            <Link
                                                to="/login/empresa"
                                                className="text-sm font-bold text-amber-900 hover:text-amber-800 underline"
                                            >
                                                Ir para login de empresas &rarr;
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                            Entrar
                        </Button>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">ou</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center gap-4">
                            <SocialButton
                                provider="facebook"
                                mode="icon"
                                onClick={() => addToast('Login com Facebook em breve!', 'info')}
                                title="Facebook"
                            />
                            <SocialButton
                                provider="apple"
                                mode="icon"
                                onClick={() => addToast('Login com Apple em breve!', 'info')}
                                title="Apple"
                            />
                            <SocialButton
                                provider="google"
                                mode="icon"
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                title="Google"
                            />
                        </div>
                    </div>

                    <p className="mt-8 text-center text-sm text-gray-600">
                        Não tem uma conta?{' '}
                        <Link to="/cadastro/cliente" className="font-bold text-brand-primary hover:text-brand-primary/80 transition-colors">
                            Cadastre-se grátis
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Brand (60%) */}
            <div className="hidden lg:block relative w-0 flex-1 bg-[#004E89]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#004E89] to-[#003B66]" />
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
                    }}
                />

                <div className="relative h-full flex flex-col items-center justify-center p-12 text-white">
                    <div className="w-24 h-24 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
                        <span className="text-4xl font-bold tracking-tight">TGT</span>
                    </div>

                    <h1 className="text-4xl font-bold text-center mb-4 leading-tight">
                        Conectando Clientes a <br />
                        <span className="text-[#FF6B35]">Empresas de Confiança</span>
                    </h1>

                    <p className="text-lg text-blue-100/80 text-center max-w-lg mb-12">
                        A plataforma mais segura para contratar serviços e realizar projetos com tranquilidade.
                    </p>

                    {/* Floating Cards Illustration Placeholder */}
                    <div className="relative w-full max-w-md aspect-video bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm p-6 shadow-2xl transform rotate-1 hover:rotate-0 transition-all duration-500">
                        <div className="space-y-4">
                            <div className="h-2 w-1/3 bg-white/20 rounded"></div>
                            <div className="h-2 w-2/3 bg-white/10 rounded"></div>
                            <div className="h-2 w-1/2 bg-white/10 rounded"></div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#FF6B35] rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                            <Store className="w-10 h-10 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientLoginPage;
