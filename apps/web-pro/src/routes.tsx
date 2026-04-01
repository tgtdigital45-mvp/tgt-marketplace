import React, { lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { LoadingSpinner, PageTransition, ErrorBoundary } from '@tgt/ui-web';
import ProDashboardLayout from './components/layout/ProDashboardLayout';
import ProPublicLayout from './components/layout/ProPublicLayout';

// Public Pages for Pro Platform
const ProLandingPage = lazy(() => import('./pages/ProLandingPage'));
const ProPricingPage = lazy(() => import('./pages/ProPricingPage'));
const ProUpdatesPage = lazy(() => import('./pages/ProUpdatesPage'));
const ProCasesPage = lazy(() => import('./pages/ProCasesPage'));
const ProBlogPage = lazy(() => import('./pages/ProBlogPage'));
const ProContactPage = lazy(() => import('./pages/ProContactPage'));
const ProWaitlistPage = lazy(() => import('./pages/ProWaitlistPage'));

// Dashboard Pages
const DashboardOverviewPage = lazy(() => import('./pages/dashboard/DashboardOverviewPage'));
const DashboardMensagensPage = lazy(() => import('./pages/dashboard/DashboardMensagensPage'));
const DashboardAgendaPage = lazy(() => import('./pages/dashboard/DashboardAgendaPage'));
const DashboardServicosPage = lazy(() => import('./pages/dashboard/DashboardServicosPage'));
const DashboardFaturamentoPage = lazy(() => import('./pages/dashboard/DashboardFaturamentoPage'));
const DashboardPortfolioPage = lazy(() => import('./pages/dashboard/DashboardPortfolioPage'));
const DashboardEquipePage = lazy(() => import('./pages/dashboard/DashboardEquipePage'));
const DashboardPerfilPage = lazy(() => import('./pages/dashboard/DashboardPerfilPage'));
const DashboardConfiguracoesPage = lazy(() => import('./pages/dashboard/DashboardConfiguracoesPage'));
const DashboardVerificacaoPage = lazy(() => import('./pages/dashboard/DashboardVerificacaoPage'));
const DashboardSubscriptionPage = lazy(() => import('./pages/dashboard/DashboardSubscriptionPage'));
const DashboardSupportPage = lazy(() => import('./pages/dashboard/DashboardSupportPage'));

// Authentication Pages (Shared from @/pages/auth)
const CompanyLoginPage = lazy(() => import('@/pages/auth/CompanyLoginPage'));
const CompanyRegisterPage = lazy(() => import('@/pages/auth/CompanyRegisterPage'));

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://portal.ex.com';

/** Hard-redirects to a URL in another app (e.g., portal). Not an SPA navigate. */
const ExternalRedirect = ({ to }: { to: string }) => {
  React.useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return <LoadingSpinner />;
};

const ExternalRedirectWithParams = ({ to }: { to: string }) => {
  const { slug } = useParams();
  const resolvedTo = to.includes(':slug') && slug ? to.replace(':slug', slug) : to;
  React.useEffect(() => { window.location.replace(resolvedTo); }, [resolvedTo]);
  return <LoadingSpinner />;
};

// Info pages relevant to pro (plans, terms, etc.)
const PlansPage = lazy(() => import('@/pages/PlansPage'));
const PrivacyPage = lazy(() => import('@/pages/info/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/info/TermsPage'));
const HelpPage = lazy(() => import('@/pages/info/HelpPage'));
const ContactPage = lazy(() => import('@/pages/info/ContactPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const AnimatedElement = ({ children }: { children: any }) => (
  <PageTransition>{children}</PageTransition>
);

const ProRoutes = () => {
  const location = useLocation();

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<LoadingSpinner />}>
        <AnimatePresence mode="wait">
          <Routes location={location}>
            {/* Public Pages for Pro Platform */}
            <Route path="/" element={<AnimatedElement><ProPublicLayout><ProLandingPage /></ProPublicLayout></AnimatedElement>} />
            <Route path="/como-funciona" element={<Navigate to="/" replace />} />

            {/* Shared legal/plan pages */}
            <Route path="/assinatura" element={<Navigate to="/planos" replace />} />
            <Route path="/planos" element={<AnimatedElement><ProPublicLayout><ProPricingPage /></ProPublicLayout></AnimatedElement>} />
            <Route path="/updates" element={<AnimatedElement><ProPublicLayout><ProUpdatesPage /></ProPublicLayout></AnimatedElement>} />
            <Route path="/cases" element={<AnimatedElement><ProPublicLayout><ProCasesPage /></ProPublicLayout></AnimatedElement>} />
            <Route path="/blog" element={<AnimatedElement><ProPublicLayout><ProBlogPage /></ProPublicLayout></AnimatedElement>} />
            <Route path="/ajuda" element={<AnimatedElement><ProPublicLayout><HelpPage /></ProPublicLayout></AnimatedElement>} />
            <Route path="/contato" element={<AnimatedElement><ProPublicLayout><ProContactPage /></ProPublicLayout></AnimatedElement>} />
            <Route path="/waitlist" element={<AnimatedElement><ProPublicLayout><ProWaitlistPage /></ProPublicLayout></AnimatedElement>} />
            <Route path="/privacidade" element={<AnimatedElement><ProPublicLayout><PrivacyPage /></ProPublicLayout></AnimatedElement>} />
            <Route path="/termos" element={<AnimatedElement><ProPublicLayout><TermsPage /></ProPublicLayout></AnimatedElement>} />

            {/* Novo Dashboard Profissional */}
            <Route path="/dashboard/empresa/:slug" element={<ProDashboardLayout />}>
              <Route index element={<AnimatedElement><DashboardOverviewPage /></AnimatedElement>} />
              <Route path="orcamentos" element={<Navigate to="mensagens" replace />} />
              <Route path="mensagens" element={<AnimatedElement><DashboardMensagensPage /></AnimatedElement>} />
              <Route path="agenda" element={<AnimatedElement><DashboardAgendaPage /></AnimatedElement>} />
              <Route path="servicos" element={<AnimatedElement><DashboardServicosPage /></AnimatedElement>} />
              <Route path="faturamento" element={<AnimatedElement><DashboardFaturamentoPage /></AnimatedElement>} />
              <Route path="portfolio" element={<AnimatedElement><DashboardPortfolioPage /></AnimatedElement>} />
              <Route path="equipe" element={<AnimatedElement><DashboardEquipePage /></AnimatedElement>} />
              <Route path="perfil" element={<AnimatedElement><DashboardPerfilPage /></AnimatedElement>} />
              <Route path="configuracoes" element={<AnimatedElement><DashboardConfiguracoesPage /></AnimatedElement>} />
              <Route path="verificacao" element={<AnimatedElement><DashboardVerificacaoPage /></AnimatedElement>} />
              <Route path="assinatura" element={<AnimatedElement><DashboardSubscriptionPage /></AnimatedElement>} />
              <Route path="suporte" element={<AnimatedElement><DashboardSupportPage /></AnimatedElement>} />
            </Route>

            {/* Authentication Pages */}
            <Route path="/login" element={<AnimatedElement><ProPublicLayout><CompanyLoginPage /></ProPublicLayout></AnimatedElement>} />
            <Route path="/cadastro" element={<AnimatedElement><ProPublicLayout><CompanyRegisterPage /></ProPublicLayout></AnimatedElement>} />

            {/* Compatibility Redirects */}
            <Route path="/login/empresa" element={<Navigate to="/login" replace />} />
            <Route path="/cadastro/empresa" element={<Navigate to="/cadastro" replace />} />
            
            {/* Redirecionamento de Perfil Público para o Marketplace */}
            <Route path="/empresa/:slug" element={<ExternalRedirectWithParams to={`${((import.meta as any).env?.VITE_LANDING_URL || 'http://localhost:3001').replace(/\/+$/, '')}/empresa/:slug`} />} />

            {/* Anything else → 404/NotFound */}
            <Route path="*" element={<AnimatedElement><NotFoundPage /></AnimatedElement>} />
          </Routes>
        </AnimatePresence>
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default ProRoutes;

