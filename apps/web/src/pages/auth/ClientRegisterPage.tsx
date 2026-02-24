import React, { useState } from 'react';
import SEO from '@/components/SEO';
import { Link, useNavigate } from 'react-router-dom';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SocialButton from '@/components/ui/SocialButton';
import { useToast } from '@/contexts/ToastContext';
import { validatePassword } from '@/utils/validators';
import { supabase } from '@tgt/shared';
import { Store, Briefcase } from 'lucide-react';

const ClientRegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (formData.name.length < 2) newErrors.name = "Nome deve ter pelo menos 2 caracteres.";
        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = "Formato de email inválido.";
        if (!validatePassword(formData.password)) newErrors.password = "Senha deve conter ao menos 8 caracteres, incluindo letra e número.";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Senha e confirmação não conferem.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: formData.name,
                        type: 'client'
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                addToast('Cadastro realizado com sucesso!', 'success');
                navigate('/login/cliente');
            } else {
                addToast('Verifique seu e-mail para confirmar o cadastro ou tente fazer login.', 'success');
                navigate('/login/cliente');
            }

        } catch (err: unknown) {
            const error = err as Error;
            console.error('Registration error:', error);
            addToast(error.message || 'Erro ao criar conta.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative bg-gray-50 overflow-hidden">
            <SEO
                title="Cadastro de Cliente | CONTRATTO"
                description="Crie sua conta na CONTRATTO para contratar os melhores profissionais da sua região."
            />

            {/* Background Split */}
            <div className="absolute top-0 w-full h-[45vh] bg-[#004E89] rounded-b-[50px] z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#004E89] to-[#003B66]" />
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
                    }}
                />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        Junte-se à CONTRATTO
                    </h2>
                    <p className="mt-2 text-blue-100">
                        Comece a contratar profissionais qualificados hoje mesmo.
                    </p>
                </div>

                <div className="mx-auto w-full max-w-lg">
                    <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-gray-100">
                        <div className="mb-8">
                            {/* Account Type Toggle */}
                            <div className="bg-gray-100 p-1 rounded-xl flex mb-6">
                                <button
                                    className="flex-1 flex items-center justify-center py-2 px-4 text-sm font-medium rounded-lg bg-white text-gray-900 shadow-sm transition-all"
                                >
                                    <Store className="w-4 h-4 mr-2 text-brand-primary" />
                                    Cliente
                                </button>
                                <Link
                                    to="/empresa/cadastro"
                                    className="flex-1 flex items-center justify-center py-2 px-4 text-sm font-medium rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
                                >
                                    <Briefcase className="w-4 h-4 mr-2" />
                                    Empresa
                                </Link>
                            </div>

                            <p className="text-center text-sm text-gray-500 mb-6">Cadastre-se com</p>

                            <div className="flex justify-center gap-4">
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
                                    onClick={() => addToast('Login com Google em breve!', 'info')} // Or use handleGoogleLogin if available, but here it seems not imported or defined in this file yet? 
                                    title="Google"
                                />
                            </div>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">ou</span>
                                </div>
                            </div>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                label="Nome Completo"
                                placeholder="Seu nome"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                            />
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                label="E-mail"
                                placeholder="seu@email.com"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                error={errors.email}
                            />
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                label="Senha"
                                placeholder="Mínimo 8 caracteres"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                error={errors.password}
                            />
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                label="Confirmar Senha"
                                placeholder="Confirme sua senha"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                error={errors.confirmPassword}
                            />

                            <div className="flex items-center text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                                <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Seus dados estão protegidos e criptografados.
                            </div>

                            <div>
                                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                                    Criar Conta Grátis
                                </Button>
                            </div>
                        </form>

                        <div className="mt-8 text-center border-t border-gray-100 pt-6">
                            <p className="text-sm text-gray-600">
                                Já tem uma conta?{' '}
                                <Link to="/login/cliente" className="font-bold text-brand-primary hover:text-brand-primary/80">
                                    Fazer login
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientRegisterPage;
