import React, { lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { LoadingSpinner, PageTransition, ErrorBoundary } from '@tgt/shared';
import ProDashboardLayout from './components/layout/ProDashboardLayout';

// Public Pages for Pro Platform
const ProLandingPage = lazy(() => import('./pages/ProLandingPage'));

// Dashboard Pages
const DashboardOverviewPage = lazy(() => import('./pages/dashboard/DashboardOverviewPage'));
const DashboardOrcamentosPage = lazy(() => import('./pages/dashboard/DashboardOrcamentosPage'));
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

const ProRoutes = () => {
  const location = useLocation();

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<LoadingSpinner />}>
        <AnimatePresence mode="wait">
          <Routes location={location}>
            {/* Root Landing Page for Partners */}
            <Route path="/" element={<AnimatedElement><ProLandingPage /></AnimatedElement>} />
            <Route path="/como-funciona" element={<AnimatedElement><ProLandingPage /></AnimatedElement>} />

            {/* Shared legal/plan pages */}
            <Route path="/assinatura" element={<AnimatedElement><PlansPage /></AnimatedElement>} />
            <Route path="/ajuda" element={<AnimatedElement><HelpPage /></AnimatedElement>} />
            <Route path="/contato" element={<AnimatedElement><ContactPage /></AnimatedElement>} />
            <Route path="/privacidade" element={<AnimatedElement><PrivacyPage /></AnimatedElement>} />
            <Route path="/termos" element={<AnimatedElement><TermsPage /></AnimatedElement>} />

            {/* Novo Dashboard Profissional */}
            <Route path="/dashboard/empresa/:slug" element={<ProDashboardLayout />}>
              <Route index element={<AnimatedElement><DashboardOverviewPage /></AnimatedElement>} />
              <Route path="orcamentos" element={<AnimatedElement><DashboardOrcamentosPage /></AnimatedElement>} />
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

            {/* Compatibility Redirects */}
            <Route path="/login/empresa" element={<Navigate to="/" replace />} />

            {/* Anything else → 404/NotFound */}
            <Route path="*" element={<AnimatedElement><NotFoundPage /></AnimatedElement>} />
          </Routes>
        </AnimatePresence>
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default ProRoutes;

