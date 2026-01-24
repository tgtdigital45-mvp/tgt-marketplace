import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import context, though we use direct supabase calls for login actions usually, or expose them in context.
import { supabase } from '../lib/supabase'; // Import supabase client
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';
import { User } from '../types';

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

const CertificateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);


const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'client' | 'company'>('client');
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

        // Redirect based on user type stored in metadata or default logic
        const metadataType = data.session.user.user_metadata.type as string;

        // If the user selected 'client' tab but is a 'company', we might want to warn or just redirect to company dashboard anyway.
        // For now, we trust the metadata from the account.
        if (metadataType === 'company') {
          navigate('/dashboard/empresa');
        } else {
          // Default to home for clients
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      addToast(err.message || 'Falha ao realizar login. Verifique suas credenciais.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/`, // Redirect back to home after login
          data: {
            type: 'client' // Assert google logins are clients by default? Or handle in callback.
          }
        },
      });
      if (error) throw error;
      // Note: This will redirect away from the page, so no need to stop loading or navigate manually.
    } catch (err: any) {
      console.error('Google login error:', err);
      addToast(err.message || 'Erro ao conectar com Google.', 'error');
      setIsLoading(false);
    }
  }

  const handleCertificateLogin = () => {
    // Certificate login is likely a custom flow or not supported by standard Supabase Auth out of the box in this tier.
    // Keeping mock or redirecting to specific logic.
    setIsLoading(true);
    setTimeout(() => {
      // Placeholder for certificate logic
      addToast('Login com Certificado ainda não implementado no backend Supabase.', 'info');
      setIsLoading(false);
    }, 1000);
  }

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-lg rounded-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Acesse sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link to="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">
              crie uma conta de cliente
            </Link>
          </p>
        </div>

        <div className="flex justify-center border border-gray-300 rounded-sharp p-1">
          <button
            onClick={() => setUserType('client')}
            className={`w-1/2 py-2 text-sm font-medium rounded-sharp transition-colors ${userType === 'client' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Sou Cliente
          </button>
          <button
            onClick={() => setUserType('company')}
            className={`w-1/2 py-2 text-sm font-medium rounded-sharp transition-colors ${userType === 'company' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Sou Empresa
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-sharp shadow-sm -space-y-px">
            <Input
              id="email"
              name="email"
              type="email"
              label="Endereço de e-mail"
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
            <div />
            <a href="#" className="font-medium text-brand-primary hover:text-brand-primary/80">
              Esqueceu sua senha?
            </a>
          </div>

          <div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Entrar
            </Button>
          </div>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-xs">ou</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <div className="space-y-4">
          {userType === 'client' && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              disabled={isLoading}
            >
              <GoogleIcon />
              Entrar com Google
            </button>
          )}
          {userType === 'company' && (
            <button
              type="button"
              onClick={handleCertificateLogin}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              disabled={isLoading}
            >
              <CertificateIcon />
              Acessar com Certificado Digital
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
