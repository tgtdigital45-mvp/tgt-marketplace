import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@tgt/shared';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin, // Redirect to root, AuthContext handles the rest
            });

            if (error) throw error;

            addToast('Se o e-mail estiver cadastrado, você receberá um link de recuperação.', 'success');
        } catch (err: unknown) {
            const error = err as Error;
            console.error('Error sending reset password email:', error);
            addToast(error.message || 'Erro ao enviar e-mail de recuperação.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-lg rounded-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Recuperar Senha
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Digite seu e-mail para receber o link de redefinição.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        label="Endereço de e-mail"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <div>
                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            Enviar Link
                        </Button>
                    </div>

                    <div className="text-center">
                        <Link to="/auth/login" className="font-medium text-brand-primary hover:text-brand-primary/80">
                            Voltar para o Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
