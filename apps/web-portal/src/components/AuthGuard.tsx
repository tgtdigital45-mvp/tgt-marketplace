import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { LoadingSpinner } from '@tgt/ui-web';;

export const AuthGuard: React.FC = () => {
  const { user, loading } = useAuth();
  const { company, isLoading: companyLoading } = useCompany();
  const location = useLocation();

  // Aguarda a verificação de autenticação terminar — nunca deixa piscar a rota protegida
  if (loading) {
    return <LoadingSpinner />;
  }

  // Usuário não autenticado: redireciona para login preservando o destino
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, error: 'Acesso restrito a empresas parceiras.' }}
      />
    );
  }

  // Usuário autenticado mas não é empresa: acesso negado
  if (user.type !== 'company') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, error: 'Esta área é exclusiva para empresas parceiras CONTRATTO.' }}
      />
    );
  }

  // Aguarda o carregamento dos dados da empresa para evitar flash de conteúdo sem dados
  if (companyLoading) {
    return <LoadingSpinner />;
  }

  return <Outlet />;
};

export default AuthGuard;
