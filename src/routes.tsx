import React, { lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Layouts & Global Components
import PageTransition from './components/PageTransition';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
const ClientLandingPage = lazy(() => import('./pages/ClientLandingPage'));
const CompaniesListPage = lazy(() => import('./pages/LandingPage'));
const CompanyProfilePage = lazy(() => import('./pages/CompanyProfilePage'));
const BookingConfirmationPage = lazy(() => import('./pages/BookingConfirmationPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Auth Pages
const ClientLoginPage = lazy(() => import('./pages/auth/ClientLoginPage'));
const CompanyLoginPage = lazy(() => import('./pages/auth/CompanyLoginPage'));
const ClientRegisterPage = lazy(() => import('./pages/auth/ClientRegisterPage'));
const CompanyRegisterPage = lazy(() => import('./pages/auth/CompanyRegisterPage'));
const CompanyRegistrationPage = lazy(() => import('./pages/CompanyRegistrationPage'));

// Client Pages
const ClientProfilePage = lazy(() => import('./pages/client/ClientProfilePage'));
const ClientOrdersPage = lazy(() => import('./pages/client/ClientOrdersPage'));
const ClientMessagesPage = lazy(() => import('./pages/client/ClientMessagesPage'));
const FavoritesPage = lazy(() => import('./pages/client/FavoritesPage'));
const ClientPostJobPage = lazy(() => import('./pages/client/ClientPostJobPage'));

// Company Dashboard Pages
const DashboardOverviewPage = lazy(() => import('./pages/pro/DashboardOverviewPage'));
const ProFindJobsPage = lazy(() => import('./pages/pro/ProFindJobsPage'));
const ProJobDetailsPage = lazy(() => import('./pages/pro/ProJobDetailsPage'));
const DashboardPerfilPage = lazy(() => import('./pages/pro/DashboardPerfilPage'));
const DashboardAdministradoresPage = lazy(() => import('./pages/pro/DashboardAdministradoresPage'));
const DashboardServicosPage = lazy(() => import('./pages/pro/DashboardServicosPage'));
const DashboardPortfolioPage = lazy(() => import('./pages/pro/DashboardPortfolioPage'));
const DashboardAvaliacoesPage = lazy(() => import('./pages/pro/DashboardAvaliacoesPage'));
const DashboardAgendamentosPage = lazy(() => import('./pages/pro/DashboardAgendamentosPage'));
const DashboardAgendaPage = lazy(() => import('./pages/pro/DashboardAgendaPage'));
const DashboardMensagensPage = lazy(() => import('./pages/pro/DashboardMensagensPage'));
const DashboardConfiguracoesPage = lazy(() => import('./pages/pro/DashboardConfiguracoesPage'));

// Info Pages
const ForCompaniesPage = lazy(() => import('./pages/info/ForCompaniesPage'));
const ForClientsPage = lazy(() => import('./pages/info/ForClientsPage'));
const HelpPage = lazy(() => import('./pages/info/HelpPage'));
const ContactPage = lazy(() => import('./pages/info/ContactPage'));
const AboutPage = lazy(() => import('./pages/info/AboutPage'));
const CareersPage = lazy(() => import('./pages/info/CareersPage'));
const PrivacyPage = lazy(() => import('./pages/info/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/info/TermsPage'));

// Lazy loaded pages (if any were strictly lazy loaded in App.tsx, keeping consistency)
// The original App.tsx had lazy imports for Forgot/Reset password but they weren't used in the Routes definitions in the file snippet I read!
// lines 75-131 do NOT show routes for forgot/reset password.
// I will ignore them for now or check if I missed them.

// Wrapper for animated routes
const AnimatedElement = ({ children }: { children: React.ReactElement }) => (
    <PageTransition>{children}</PageTransition>
);

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

const MainRoutes = () => {
    const location = useLocation();

    return (
        <React.Suspense fallback={<LoadingSpinner />}>
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
                    <Route path="/login/company" element={<AnimatedElement><CompanyLoginPage /></AnimatedElement>} /> {/* Explicit Login Route */}
                    <Route path="/empresa/cadastro" element={<AnimatedElement><CompanyRegistrationPage /></AnimatedElement>} />

                    {/* Redirect old company registration route to canonical path */}
                    <Route path="/cadastro/empresa" element={<Navigate to="/empresa/cadastro" replace />} />
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
        </React.Suspense>
    );
};

export default MainRoutes;
