import React, { lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { LoadingSpinner, PageTransition, ErrorBoundary } from '@tgt/shared';

import AuthGuard from './components/AuthGuard';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
const CompanyLoginPage = lazy(() => import('@/pages/auth/CompanyLoginPage'));
const CompanyRegistrationPage = lazy(() => import('@/pages/CompanyRegistrationPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));

// Landing Page
const PortalLandingPage = lazy(() => import('@/pages/PortalLandingPage'));

// Dashboard Pages
const DashboardOverviewPage = lazy(() => import('@/pages/pro/DashboardOverviewPage'));
const ProFindJobsPage = lazy(() => import('@/pages/pro/ProFindJobsPage'));
const ProJobDetailsPage = lazy(() => import('@/pages/pro/ProJobDetailsPage'));
const DashboardPerfilPage = lazy(() => import('@/pages/pro/DashboardPerfilPage'));
const DashboardAdministradoresPage = lazy(() => import('@/pages/pro/DashboardAdministradoresPage'));
const DashboardServicosPage = lazy(() => import('@/pages/pro/DashboardServicosPage'));
const DashboardPortfolioPage = lazy(() => import('@/pages/pro/DashboardPortfolioPage'));
const DashboardAvaliacoesPage = lazy(() => import('@/pages/pro/DashboardAvaliacoesPage'));
const DashboardAgendamentosPage = lazy(() => import('@/pages/pro/DashboardAgendamentosPage'));
const DashboardAgendaPage = lazy(() => import('@/pages/pro/DashboardAgendaPage'));
const DashboardMensagensPage = lazy(() => import('@/pages/pro/DashboardMensagensPage'));
const DashboardSubscriptionPage = lazy(() => import('@/pages/pro/DashboardSubscriptionPage'));
const DashboardConfiguracoesPage = lazy(() => import('@/pages/pro/DashboardConfiguracoesPage'));
const DashboardSupportPage = lazy(() => import('@/pages/pro/DashboardSupportPage'));
const DashboardEquipePage = lazy(() => import('@/pages/pro/DashboardEquipePage'));
const DashboardFaturamentoPage = lazy(() => import('@/pages/pro/DashboardFaturamentoPage'));
const DashboardOrcamentosPage = lazy(() => import('@/pages/pro/DashboardOrcamentosPage'));
const DashboardVerificacaoPage = lazy(() => import('@/pages/pro/DashboardVerificacaoPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const AnimatedElement = ({ children }: { children: React.ReactNode }) => (
  <PageTransition>{children}</PageTransition>
);

const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  const { company, isLoading: companyLoading } = useCompany();

  if (loading || companyLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ error: 'Acesso restrito a empresas parceiras.' }} />;
  if (user.type !== 'company') return <Navigate to="/login" replace state={{ error: 'Esta área é exclusiva para empresas parceiras CONTRATTO.' }} />;

  if (company?.slug) return <Navigate to={`/dashboard/empresa/${company.slug}`} replace />;
  if (user.companySlug) return <Navigate to={`/dashboard/empresa/${user.companySlug}`} replace />;

  return <Navigate to="/cadastro" replace />;
};

const PortalRoutes = () => {
  const location = useLocation();

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<LoadingSpinner />}>
        <AnimatePresence mode="wait">
          <Routes location={location}>
            {/* Public Landing — handles auth redirect internally */}
            <Route path="/" element={<AnimatedElement><PortalLandingPage /></AnimatedElement>} />

            {/* Public Auth Routes */}
            <Route path="/login" element={<AnimatedElement><CompanyLoginPage /></AnimatedElement>} />
            <Route path="/cadastro" element={<AnimatedElement><CompanyRegistrationPage /></AnimatedElement>} />
            <Route path="/esqueci-senha" element={<AnimatedElement><ForgotPasswordPage /></AnimatedElement>} />
            <Route path="/redefinir-senha" element={<AnimatedElement><ResetPasswordPage /></AnimatedElement>} />

            {/* Protected Routes */}
            <Route element={<AuthGuard />}>
              <Route path="/dashboard" element={<DashboardRedirect />} />
              
              <Route path="/dashboard/empresa/:slug" element={<DashboardLayout />}>
                <Route index element={<AnimatedElement><DashboardOverviewPage /></AnimatedElement>} />
                <Route path="perfil" element={<AnimatedElement><DashboardPerfilPage /></AnimatedElement>} />
                <Route path="administradores" element={<AnimatedElement><DashboardAdministradoresPage /></AnimatedElement>} />
                <Route path="servicos" element={<AnimatedElement><DashboardServicosPage /></AnimatedElement>} />
                <Route path="portfolio" element={<AnimatedElement><DashboardPortfolioPage /></AnimatedElement>} />
                <Route path="avaliacoes" element={<AnimatedElement><DashboardAvaliacoesPage /></AnimatedElement>} />
                <Route path="agenda" element={<AnimatedElement><DashboardAgendaPage /></AnimatedElement>} />
                <Route path="agendamentos" element={<AnimatedElement><DashboardAgendamentosPage /></AnimatedElement>} />
                <Route path="mensagens" element={<AnimatedElement><DashboardMensagensPage /></AnimatedElement>} />
                <Route path="orcamentos" element={<AnimatedElement><DashboardOrcamentosPage /></AnimatedElement>} />
                <Route path="faturamento" element={<AnimatedElement><DashboardFaturamentoPage /></AnimatedElement>} />
                <Route path="assinatura" element={<AnimatedElement><DashboardSubscriptionPage /></AnimatedElement>} />
                <Route path="equipe" element={<AnimatedElement><DashboardEquipePage /></AnimatedElement>} />
                <Route path="configuracoes" element={<AnimatedElement><DashboardConfiguracoesPage /></AnimatedElement>} />
                <Route path="suporte" element={<AnimatedElement><DashboardSupportPage /></AnimatedElement>} />
                <Route path="verificacao" element={<AnimatedElement><DashboardVerificacaoPage /></AnimatedElement>} />
                <Route path="vagas" element={<AnimatedElement><ProFindJobsPage /></AnimatedElement>} />
                <Route path="vagas/:id" element={<AnimatedElement><ProJobDetailsPage /></AnimatedElement>} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<AnimatedElement><NotFoundPage /></AnimatedElement>} />
          </Routes>
        </AnimatePresence>
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default PortalRoutes;
