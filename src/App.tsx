import React from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CompanyProvider } from './contexts/CompanyContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ClientLandingPage from './pages/ClientLandingPage';
import CompaniesListPage from './pages/LandingPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardOverviewPage from './pages/pro/DashboardOverviewPage';
import DashboardPerfilPage from './pages/pro/DashboardPerfilPage';
import DashboardServicosPage from './pages/pro/DashboardServicosPage';
import DashboardPortfolioPage from './pages/pro/DashboardPortfolioPage';
import DashboardMensagensPage from './pages/pro/DashboardMensagensPage';
import DashboardConfiguracoesPage from './pages/pro/DashboardConfiguracoesPage';
import DashboardAdministradoresPage from './pages/pro/DashboardAdministradoresPage';
import DashboardAvaliacoesPage from './pages/pro/DashboardAvaliacoesPage';
import DashboardAgendamentosPage from './pages/pro/DashboardAgendamentosPage';
import DashboardAgendaPage from './pages/pro/DashboardAgendaPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import ClientProfilePage from './pages/client/ClientProfilePage';
import ClientMessagesPage from './pages/client/ClientMessagesPage';
import ClientOrdersPage from './pages/client/ClientOrdersPage';
import FavoritesPage from './pages/client/FavoritesPage';
import { ToastProvider } from './contexts/ToastContext';
import CompanyRegistrationPage from './pages/CompanyRegistrationPage';
import NotFoundPage from './pages/NotFoundPage';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { MockProvider } from './contexts/MockContext';
import ClientPostJobPage from './pages/client/ClientPostJobPage';
import ProFindJobsPage from './pages/pro/ProFindJobsPage';
import ProJobDetailsPage from './pages/pro/ProJobDetailsPage';


// Info Pages
import ForCompaniesPage from './pages/info/ForCompaniesPage';
import ForClientsPage from './pages/info/ForClientsPage';
import HelpPage from './pages/info/HelpPage';
import ContactPage from './pages/info/ContactPage';
import AboutPage from './pages/info/AboutPage';
import CareersPage from './pages/info/CareersPage';
import PrivacyPage from './pages/info/PrivacyPage';
import TermsPage from './pages/info/TermsPage';

import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import PageTransition from './components/PageTransition';
import ScrollToTop from './components/ScrollToTop';
import { lazy, Suspense } from 'react'; // Ensure lazy/Suspense are imported
import LoadingSpinner from './components/ui/LoadingSpinner'; // Assuming this exists or using simple fallback

// Auth Pages
import ClientLoginPage from './pages/auth/ClientLoginPage';
import CompanyLoginPage from './pages/auth/CompanyLoginPage';
import ClientRegisterPage from './pages/auth/ClientRegisterPage';
import CompanyRegisterPage from './pages/auth/CompanyRegisterPage';

const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

// Wrapper for animated routes
const AnimatedElement = ({ children }: { children: React.ReactElement }) => (
  <PageTransition>{children}</PageTransition>
);

const MainRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {/* @ts-expect-error - key is needed for AnimatePresence to restart animations on route change */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AnimatedElement><ClientLandingPage /></AnimatedElement>} />
        <Route path="/empresas" element={<AnimatedElement><CompaniesListPage /></AnimatedElement>} />
        <Route path="/empresa/:slug" element={<AnimatedElement><CompanyProfilePage /></AnimatedElement>} />

        {/* Auth Routes - Clients */}
        <Route path="/login/cliente" element={<AnimatedElement><ClientLoginPage /></AnimatedElement>} />
        <Route path="/cadastro/cliente" element={<AnimatedElement><ClientRegisterPage /></AnimatedElement>} />

        {/* Auth Routes - Companies */}
        <Route path="/login/empresa" element={<AnimatedElement><CompanyLoginPage /></AnimatedElement>} />
        <Route path="/cadastro/empresa" element={<AnimatedElement><CompanyRegisterPage /></AnimatedElement>} />

        {/* Legacy redirects */}
        <Route path="/auth/login" element={<Navigate to="/login/cliente" replace />} />
        <Route path="/auth/register" element={<Navigate to="/cadastro/cliente" replace />} />
        <Route path="/client/dashboard" element={<Navigate to="/perfil/cliente" replace />} />
        <Route path="/professional/dashboard" element={<Navigate to="/login/empresa" replace />} />

        {/* Common Auth */}
        <Route path="/auth/forgot-password" element={<AnimatedElement><Suspense fallback={<LoadingSpinner />}><ForgotPasswordPage /></Suspense></AnimatedElement>} />
        <Route path="/auth/reset-password" element={<AnimatedElement><Suspense fallback={<LoadingSpinner />}><ResetPasswordPage /></Suspense></AnimatedElement>} />
        <Route path="/empresa/cadastro" element={<AnimatedElement><CompanyRegistrationPage /></AnimatedElement>} />
        <Route path="/agendamento/confirmacao" element={<AnimatedElement><BookingConfirmationPage /></AnimatedElement>} />

        {/* Client Routes */}
        <Route path="/perfil/cliente" element={<ProtectedRoute userType="client" element={<AnimatedElement><ClientProfilePage /></AnimatedElement>} />} />
        <Route path="/perfil/pedidos" element={<ProtectedRoute userType="client" element={<AnimatedElement><ClientOrdersPage /></AnimatedElement>} />} />
        <Route path="/minhas-mensagens" element={<ProtectedRoute userType="client" element={<AnimatedElement><ClientMessagesPage /></AnimatedElement>} />} />
        <Route path="/favoritos" element={<ProtectedRoute userType="client" element={<AnimatedElement><FavoritesPage /></AnimatedElement>} />} />
        <Route path="/cliente/novo-pedido" element={<ProtectedRoute userType="client" element={<AnimatedElement><ClientPostJobPage /></AnimatedElement>} />} />

        {/* Company Dashboard Routes - DashboardLayout handles its own outlet, maybe animate layout entry? */}
        <Route path="/dashboard/empresa/:slug" element={<DashboardLayout />}>
          <Route index element={<AnimatedElement><DashboardOverviewPage /></AnimatedElement>} />
          <Route path="oportunidades" element={<AnimatedElement><ProFindJobsPage /></AnimatedElement>} />
          <Route path="oportunidades/:id" element={<AnimatedElement><ProJobDetailsPage /></AnimatedElement>} /> {/* [NEW] */}
          <Route path="perfil" element={<AnimatedElement><DashboardPerfilPage /></AnimatedElement>} />
          <Route path="administradores" element={<AnimatedElement><DashboardAdministradoresPage /></AnimatedElement>} />
          <Route path="servicos" element={<AnimatedElement><DashboardServicosPage /></AnimatedElement>} />
          <Route path="portfolio" element={<AnimatedElement><DashboardPortfolioPage /></AnimatedElement>} />
          <Route path="avaliacoes" element={<AnimatedElement><DashboardAvaliacoesPage /></AnimatedElement>} />
          <Route path="agendamentos" element={<AnimatedElement><DashboardAgendamentosPage /></AnimatedElement>} />
          <Route path="agenda" element={<AnimatedElement><DashboardAgendaPage /></AnimatedElement>} />
          <Route path="mensagens" element={<AnimatedElement><DashboardMensagensPage /></AnimatedElement>} />
          <Route path="configuracoes" element={<AnimatedElement><DashboardConfiguracoesPage /></AnimatedElement>} />
        </Route>

        {/* Redirect old dashboard route to new slug-based route */}
        <Route path="/dashboard/empresa" element={<Navigate to="/" replace />} />

        {/* Info Pages Routes */}
        <Route path="/para-empresas" element={<AnimatedElement><ForCompaniesPage /></AnimatedElement>} />
        <Route path="/para-clientes" element={<AnimatedElement><ForClientsPage /></AnimatedElement>} />
        <Route path="/ajuda" element={<AnimatedElement><HelpPage /></AnimatedElement>} />
        <Route path="/contato" element={<AnimatedElement><ContactPage /></AnimatedElement>} />
        <Route path="/sobre" element={<AnimatedElement><AboutPage /></AnimatedElement>} />
        <Route path="/carreiras" element={<AnimatedElement><CareersPage /></AnimatedElement>} />
        <Route path="/privacidade" element={<AnimatedElement><PrivacyPage /></AnimatedElement>} />
        <Route path="/termos" element={<AnimatedElement><TermsPage /></AnimatedElement>} />

        {/* 404 - Not Found */}
        <Route path="*" element={<AnimatedElement><NotFoundPage /></AnimatedElement>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = (): React.ReactElement => {
  return (
    <HelmetProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>
              <CompanyProvider>
                <MockProvider>
                  <FavoritesProvider>
                    <ScrollToTop />
                    <div className="flex flex-col min-h-screen">
                      <Header />
                      <main className="flex-grow">
                        <MainRoutes />
                      </main>
                      <Footer />
                    </div>
                  </FavoritesProvider>
                </MockProvider>
              </CompanyProvider>
            </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
};

interface ProtectedRouteProps {
  userType: 'client' | 'company';
  element: React.ReactElement;
}

const ProtectedRoute = ({ userType, element }: ProtectedRouteProps): React.ReactElement => {
  const { user, loading } = useAuth();
  if (loading) {
    return <LoadingSpinner />;
  }
  if (!user || user.type !== userType) {
    const redirectPath = userType === 'company' ? "/login/empresa" : "/login/cliente";
    return <Navigate to={redirectPath} replace />;
  }
  return element;
};

export default App;
