import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { validatePassword } from '@/utils/validators';
import { supabase } from '@tgt/shared';

const RegisterPage: React.FC = () => {
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
        addToast('Conta criada com sucesso! Redirecionando para login...', 'success');
        // Redireciona para login imediatamente já que confirmação de e-mail está desativada
        navigate('/auth/login');
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
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-lg rounded-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crie sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
              Faça login
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <Input
            id="name"
            name="name"
            type="text"
            label="Nome Completo"
            required
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
          />
          <Input
            id="email"
            name="email"
            type="email"
            label="Endereço de e-mail"
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
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Seus dados estão protegidos e criptografados.
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Registrar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
