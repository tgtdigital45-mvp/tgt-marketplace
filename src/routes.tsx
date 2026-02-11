import React, { lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import { useCompany } from './contexts/CompanyContext';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Layouts & Global Components
import PageTransition from './components/PageTransition';
import DashboardLayout from './components/layout/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';
import InstitutionalLayout from './components/layout/InstitutionalLayout';
import AdminGuard from './components/AdminGuard';

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
const DashboardSubscriptionPage = lazy(() => import('./pages/pro/DashboardSubscriptionPage'));
const DashboardConfiguracoesPage = lazy(() => import('./pages/pro/DashboardConfiguracoesPage'));
const DashboardSupportPage = lazy(() => import('./pages/pro/DashboardSupportPage'));
const DashboardEquipePage = lazy(() => import('./pages/pro/DashboardEquipePage'));
const DashboardFaturamentoPage = lazy(() => import('./pages/pro/DashboardFaturamentoPage'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminSecurityPage = lazy(() => import('./pages/admin/AdminSecurityPage'));
const Verify2FAPage = lazy(() => import('./pages/admin/Verify2FAPage'));

// Service Details
const ServiceDetailsPage = lazy(() => import('./pages/service/ServiceDetailsPage'));
const CheckoutPage = lazy(() => import('./pages/checkout/CheckoutPage'));
const OrderRoomPage = lazy(() => import('./pages/orders/OrderRoomPage'));
const WalletPage = lazy(() => import('./pages/dashboard/WalletPage'));

// Info Pages
const ForCompaniesPage = lazy(() => import('./pages/info/ForCompaniesPage'));
const ForClientsPage = lazy(() => import('./pages/info/ForClientsPage'));
const HelpPage = lazy(() => import('./pages/info/HelpPage'));
const ContactPage = lazy(() => import('./pages/info/ContactPage'));
const ReviewModal = lazy(() => import('./components/ReviewModal')); // If needed
const AboutPage = lazy(() => import('./pages/institucional/AboutPage'));
const NewsPage = lazy(() => import('./pages/institucional/NewsPage'));
const BlogPage = lazy(() => import('./pages/institucional/BlogPage'));
const CareersPage = lazy(() => import('./pages/info/CareersPage'));
const PrivacyPage = lazy(() => import('./pages/info/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/info/TermsPage'));
const PlansPage = lazy(() => import('./pages/PlansPage'));
const NewsDetailPage = lazy(() => import('./pages/NewsDetailPage'));

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

const DashboardRedirect = () => {
    const { user, loading } = useAuth();
    const { company, loading: companyLoading } = useCompany();

    if (loading || companyLoading) return <LoadingSpinner />;

    if (!user) return <Navigate to="/login/empresa" replace />;

    if (user.type !== 'company') {
        // Clients don't have a "dashboard" in the same sense, redirect to profile or orders
        return <Navigate to="/perfil/cliente" replace />;
    }

    if (company?.slug) {
        return <Navigate to={`/dashboard/empresa/${company.slug}`} replace />;
    }

    // Fallback: Use slug from auth profile if CompanyContext is not yet loaded (prevents false positive redirect to registration)
    if (user.companySlug) {
        return <Navigate to={`/dashboard/empresa/${user.companySlug}`} replace />;
    }

    // Is company user but no company record -> Go to registration
    return <Navigate to="/empresa/cadastro" replace />;
};

const MainRoutes = () => {
    const location = useLocation();

    return (
        <ErrorBoundary>
            <React.Suspense fallback={<LoadingSpinner />}>
                <AnimatePresence mode="wait">
                    <Routes location={location}>
                        <Route path="/" element={<AnimatedElement><ClientLandingPage /></AnimatedElement>} />
                        <Route path="/empresas" element={<AnimatedElement><CompaniesListPage /></AnimatedElement>} />

                        <Route path="/empresa/:slug" element={<AnimatedElement><CompanyProfilePage /></AnimatedElement>} />
                        <Route path="/servico/:id" element={<AnimatedElement><ServiceDetailsPage /></AnimatedElement>} />
                        <Route path="/checkout/:serviceId" element={<AnimatedElement><CheckoutPage /></AnimatedElement>} />
                        <Route path="/orders/:orderId" element={<AnimatedElement><OrderRoomPage /></AnimatedElement>} />

                        {/* Auth Routes - Clients */}
                        <Route path="/login/cliente" element={<AnimatedElement><ClientLoginPage /></AnimatedElement>} />
                        <Route path="/cadastro/cliente" element={<AnimatedElement><ClientRegisterPage /></AnimatedElement>} />

                        {/* Auth Routes - Companies */}
                        <Route path="/login/empresa" element={<AnimatedElement><CompanyLoginPage /></AnimatedElement>} />
                        <Route path="/login/company" element={<Navigate to="/login/empresa" replace />} />
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
                            <Route path="perfil" element={<AnimatedElement><DashboardPerfilPage /></AnimatedElement>} />
                            <Route path="administradores" element={<AnimatedElement><DashboardAdministradoresPage /></AnimatedElement>} />
                            <Route path="servicos" element={<AnimatedElement><DashboardServicosPage /></AnimatedElement>} />
                            <Route path="portfolio" element={<AnimatedElement><DashboardPortfolioPage /></AnimatedElement>} />
                            <Route path="avaliacoes" element={<AnimatedElement><DashboardAvaliacoesPage /></AnimatedElement>} />
                            <Route path="mensagens" element={<AnimatedElement><DashboardMensagensPage /></AnimatedElement>} />
                            <Route path="assinatura" element={<AnimatedElement><DashboardSubscriptionPage /></AnimatedElement>} />
                            <Route path="configuracoes" element={<AnimatedElement><DashboardConfiguracoesPage /></AnimatedElement>} />
                            <Route path="suporte" element={<AnimatedElement><DashboardSupportPage /></AnimatedElement>} />
                            <Route path="equipe" element={<AnimatedElement><DashboardEquipePage /></AnimatedElement>} />
                            <Route path="faturamento" element={<AnimatedElement><DashboardFaturamentoPage /></AnimatedElement>} />
                        </Route>

                        {/* Smart Dashboard Redirect */}
                        <Route path="/dashboard" element={<DashboardRedirect />} />

                        {/* Redirect old dashboard route to new slug-based route */}
                        <Route path="/dashboard/empresa" element={<Navigate to="/dashboard" replace />} />

                        <Route path="/dashboard/wallet" element={<ProtectedRoute userType="company" element={<AnimatedElement><WalletPage /></AnimatedElement>} />} />

                        {/* Info Pages Routes */}
                        <Route path="/para-empresas" element={<AnimatedElement><ForCompaniesPage /></AnimatedElement>} />
                        <Route path="/para-clientes" element={<AnimatedElement><ForClientsPage /></AnimatedElement>} />
                        <Route path="/ajuda" element={<AnimatedElement><HelpPage /></AnimatedElement>} />
                        <Route path="/contato" element={<AnimatedElement><ContactPage /></AnimatedElement>} />

                        {/* Institutional Routes */}
                        <Route path="/institucional" element={<InstitutionalLayout />}>
                            <Route path="sobre" element={<AnimatedElement><AboutPage /></AnimatedElement>} />
                            <Route path="noticias" element={<AnimatedElement><NewsPage /></AnimatedElement>} />
                            <Route path="blog" element={<AnimatedElement><BlogPage /></AnimatedElement>} />
                        </Route>

                        {/* Redirects for old routes */}
                        <Route path="/sobre" element={<Navigate to="/institucional/sobre" replace />} />
                        <Route path="/noticias" element={<Navigate to="/institucional/noticias" replace />} />
                        <Route path="/noticias/:slug" element={<AnimatedElement><NewsDetailPage /></AnimatedElement>} />
                        <Route path="/blog" element={<Navigate to="/institucional/blog" replace />} />

                        <Route path="/carreiras" element={<AnimatedElement><CareersPage /></AnimatedElement>} />
                        <Route path="/privacidade" element={<AnimatedElement><PrivacyPage /></AnimatedElement>} />
                        <Route path="/termos" element={<AnimatedElement><TermsPage /></AnimatedElement>} />
                        <Route path="/planos" element={<AnimatedElement><PlansPage /></AnimatedElement>} />

                        {/* Admin Route - Protected */}
                        <Route path="/admin" element={
                            <AdminGuard>
                                <AnimatedElement><AdminDashboard /></AnimatedElement>
                            </AdminGuard>
                        } />
                        <Route path="/admin/security" element={
                            <AdminGuard>
                                <AnimatedElement><AdminSecurityPage /></AnimatedElement>
                            </AdminGuard>
                        } />
                        <Route path="/admin/verify-2fa" element={<AnimatedElement><Verify2FAPage /></AnimatedElement>} />

                        {/* 404 - Not Found */}
                        <Route path="*" element={<AnimatedElement><NotFoundPage /></AnimatedElement>} />
                    </Routes>
                </AnimatePresence>
            </React.Suspense>
        </ErrorBoundary>
    );
};

export default MainRoutes;
