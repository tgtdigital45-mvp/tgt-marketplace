import React, { lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageTransition from '@/components/PageTransition';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import AdminGuard from '@/components/AdminGuard';

// Public Pages for Pro Platform
const ProLandingPage = lazy(() => import('@/pages/ProLandingPage'));

// Auth Pages - Company only
const CompanyLoginPage = lazy(() => import('@/pages/auth/CompanyLoginPage'));
const CompanyRegistrationPage = lazy(() => import('@/pages/CompanyRegistrationPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));

// Company Dashboard Pages
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
const WalletPage = lazy(() => import('@/pages/dashboard/WalletPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminSecurityPage = lazy(() => import('@/pages/admin/AdminSecurityPage'));
const Verify2FAPage = lazy(() => import('@/pages/admin/Verify2FAPage'));
const AdminDisputesPage = lazy(() => import('@/pages/admin/AdminDisputesPage'));
const AdminModerationPage = lazy(() => import('@/pages/admin/AdminModerationPage'));

// Info pages relevant to pro (plans, terms, etc.)
const PlansPage = lazy(() => import('@/pages/PlansPage'));
const PrivacyPage = lazy(() => import('@/pages/info/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/info/TermsPage'));
const HelpPage = lazy(() => import('@/pages/info/HelpPage'));
const ContactPage = lazy(() => import('@/pages/info/ContactPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const AnimatedElement = ({ children }: { children: React.ReactElement }) => (
  <PageTransition>{children}</PageTransition>
);

/**
 * Redirects company user to their dashboard after login.
 * Deterministic: waits for both auth AND company data before navigating.
 */
const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  const { company, isLoading: companyLoading } = useCompany();

  if (loading || companyLoading) return <LoadingSpinner />;

  if (!user) return <Navigate to="/login/empresa" replace />;

  if (user.type !== 'company') {
    // A client accidentally on the pro app — send to company login or landing
    return <Navigate to="/login/empresa" replace />;
  }

  if (company?.slug) return <Navigate to={`/dashboard/empresa/${company.slug}`} replace />;
  if (user.companySlug) return <Navigate to={`/dashboard/empresa/${user.companySlug}`} replace />;

  console.warn('[web-pro] Empresa sem slug após carregamento completo. ID:', user.id);
  return <Navigate to="/empresa/cadastro" replace />;
};

const ProRoutes = () => {
  const location = useLocation();

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<LoadingSpinner />}>
        <AnimatePresence mode="wait">
          <Routes location={location}>
            {/* Root Landing Page for Partners */}
            <Route path="/" element={<AnimatedElement><ProLandingPage /></AnimatedElement>} />

            {/* Auth */}
            <Route path="/login/empresa" element={<AnimatedElement><CompanyLoginPage /></AnimatedElement>} />
            <Route path="/login/company" element={<Navigate to="/login/empresa" replace />} />
            <Route path="/empresa/cadastro" element={<AnimatedElement><CompanyRegistrationPage /></AnimatedElement>} />
            <Route path="/cadastro/empresa" element={<Navigate to="/empresa/cadastro" replace />} />
            <Route path="/esqueci-senha" element={<AnimatedElement><ForgotPasswordPage /></AnimatedElement>} />
            <Route path="/redefinir-senha" element={<AnimatedElement><ResetPasswordPage /></AnimatedElement>} />

            {/* Smart dashboard redirect */}
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/dashboard/empresa" element={<Navigate to="/dashboard" replace />} />

            {/* Company Dashboard — DashboardLayout handles auth guard internally */}
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

            <Route path="/dashboard/wallet" element={<AnimatedElement><WalletPage /></AnimatedElement>} />

            {/* Admin */}
            <Route path="/admin" element={<AdminGuard><AnimatedElement><AdminDashboard /></AnimatedElement></AdminGuard>} />
            <Route path="/admin/disputas" element={<AdminGuard><AnimatedElement><AdminDisputesPage /></AnimatedElement></AdminGuard>} />
            <Route path="/admin/moderacao" element={<AdminGuard><AnimatedElement><AdminModerationPage /></AnimatedElement></AdminGuard>} />
            <Route path="/admin/security" element={<AdminGuard><AnimatedElement><AdminSecurityPage /></AnimatedElement></AdminGuard>} />
            <Route path="/admin/verify-2fa" element={<AnimatedElement><Verify2FAPage /></AnimatedElement>} />

            {/* Shared legal/plan pages */}
            <Route path="/assinatura" element={<AnimatedElement><PlansPage /></AnimatedElement>} />
            <Route path="/como-funciona" element={<AnimatedElement><ProLandingPage /></AnimatedElement>} />
            <Route path="/ajuda" element={<AnimatedElement><HelpPage /></AnimatedElement>} />
            <Route path="/contato" element={<AnimatedElement><ContactPage /></AnimatedElement>} />
            <Route path="/privacidade" element={<AnimatedElement><PrivacyPage /></AnimatedElement>} />
            <Route path="/termos" element={<AnimatedElement><TermsPage /></AnimatedElement>} />

            {/* Anything else → 404/NotFound */}
            <Route path="*" element={<AnimatedElement><NotFoundPage /></AnimatedElement>} />
          </Routes>
        </AnimatePresence>
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default ProRoutes;

