import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';
import { validatePassword } from '../utils/validators';
import { supabase } from '../lib/supabase';

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
        addToast('Conta criada com sucesso! Verifique seu email para confirmar.', 'success');
        // Optionally, sign them in explicitly if email confirm is disabled, or let them wait.
        // Usually with email confirm on, we redirect to login or a "verify email" page.
        // Assuming confirmation is required by default.
        navigate('/auth/login');
      }

    } catch (err: any) {
      console.error('Registration error:', err);
      addToast(err.message || 'Erro ao criar conta.', 'error');
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
