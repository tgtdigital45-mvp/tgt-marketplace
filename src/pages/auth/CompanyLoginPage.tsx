import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useToast } from '../../contexts/ToastContext';

const CertificateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const CompanyLoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                addToast('Login realizado com sucesso!', 'success');

                // Force check for company profile
                const { data: companyData } = await supabase
                    .from('companies')
                    .select('slug')
                    .eq('profile_id', data.session.user.id)
                    .eq('profile_id', data.session.user.id)
                    .limit(1)
                    .maybeSingle();

                if (companyData?.slug) {
                    navigate(`/dashboard/empresa/${companyData.slug}`);
                } else {
                    // If they don't have a company profile yet, send them to onboarding
                    navigate('/empresa/cadastro');
                }
            }
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Login error:', error);
            addToast(error.message || 'Falha ao realizar login. Verifique suas credenciais.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCertificateLogin = () => {
        setIsLoading(true);
        setTimeout(() => {
            addToast('Login com Certificado ainda não implementado no backend Supabase.', 'info');
            setIsLoading(false);
        }, 1000);
    }

    return (
        <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-lg rounded-lg border-t-4 border-brand-primary">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Área da Empresa
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Ainda não cadastrou seu negócio?{' '}
                        <Link to="/cadastro/empresa" className="font-medium text-brand-primary hover:text-brand-primary/80">
                            Começar agora
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-sharp shadow-sm -space-y-px">
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            label="E-mail Corporativo"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="rounded-t-sharp"
                        />
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            label="Senha"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="rounded-b-sharp"
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <Link to="/auth/forgot-password" className="font-medium text-brand-primary hover:text-brand-primary/80">
                            Esqueceu a senha?
                        </Link>
                    </div>

                    <div>
                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            Acessar Painel
                        </Button>
                    </div>
                </form>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-xs">ou</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <button
                    type="button"
                    onClick={handleCertificateLogin}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
                    disabled={isLoading}
                >
                    <CertificateIcon />
                    Acessar com Certificado Digital
                </button>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Você está procurando serviços?{' '}
                        <Link to="/login/cliente" className="font-medium text-brand-primary hover:text-brand-primary/80">
                            Entrar como Cliente
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CompanyLoginPage;
