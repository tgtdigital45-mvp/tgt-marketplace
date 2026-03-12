import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@tgt/shared';

export const AuthGuard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Se não estiver logado ou não for do tipo empresa, redireciona para o login do portal
  if (!user || user.type !== 'company') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default AuthGuard;
