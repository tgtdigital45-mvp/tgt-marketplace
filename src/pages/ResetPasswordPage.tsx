import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';

const ResetPasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Check if user is actually in a recovery session or logged in (Supabase logs them in after clicking the email link)
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If no session, user might have clicked a link but session establishment failed or they navigated here directly
                // addToast('Sessão inválida ou expirada. Solicite uma nova redefinição de senha.', 'error');
                // navigate('/auth/forgot-password');
                // Note: Supabase handling of reset password links usually creates a session on valid link click.
            }
        });
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            addToast('As senhas não coincidem.', 'error');
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            addToast('Senha redefinida com sucesso!', 'success');
            navigate('/auth/login');
        } catch (error: any) {
            console.error('Error resetting password:', error);
            addToast(error.message || 'Erro ao redefinir senha.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-lg rounded-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Redefinir Senha
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Digite sua nova senha abaixo.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        label="Nova Senha"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        label="Confirmar Nova Senha"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    <div>
                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            Salvar Nova Senha
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
