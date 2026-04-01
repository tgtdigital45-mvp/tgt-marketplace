import React, { lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner, PageTransition, ErrorBoundary } from '@tgt/ui-web';


// Layouts & Global Components

import InstitutionalLayout from '@/components/layout/InstitutionalLayout';
import ClientPublicLayout from '@/components/layout/ClientPublicLayout';

// Pro/Admin pages live in apps/web-pro (port 3002 / contrattoex.com/parceiros)
// Do NOT add pro or admin routes here — they belong in apps/web-pro/src/routes.tsx

// Marketplace / Public Pages
const ClientLandingPage = lazy(() => import('@/pages/ClientLandingPage'));
const CompaniesListPage = lazy(() => import('@/pages/LandingPage'));
const DiscoverCategoriesPage = lazy(() => import('@/pages/DiscoverCategoriesPage'));
const ServicesMarketplacePage = lazy(() => import('@/pages/ServicesMarketplacePage'));
const CompanyProfilePage = lazy(() => import('@/pages/CompanyProfilePage'));
const BookingConfirmationPage = lazy(() => import('@/pages/BookingConfirmationPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Auth Pages — CLIENT ONLY
// Company auth lives exclusively in apps/web-pro
const ClientLoginPage = lazy(() => import('@/pages/auth/ClientLoginPage'));
const ClientRegisterPage = lazy(() => import('@/pages/auth/ClientRegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));

// URL of the Pro app — set VITE_PRO_APP_URL in .env for production
// Dev default: http://localhost:3002
const PRO_APP_URL = (import.meta as any).env?.VITE_PRO_APP_URL || 'https://web-pro-xi-seven.vercel.app';

// Client Pages (authenticated)
const ClientProfilePage = lazy(() => import('@/pages/client/ClientProfilePage'));
const ClientOrdersPage = lazy(() => import('@/pages/client/ClientOrdersPage'));
const ClientMessagesPage = lazy(() => import('@/pages/client/ClientMessagesPage'));
const FavoritesPage = lazy(() => import('@/pages/client/FavoritesPage'));
const ClientPostJobPage = lazy(() => import('@/pages/client/ClientPostJobPage'));
const MyAppointments = lazy(() => import('@/pages/client/MyAppointments'));
const PaymentHistory = lazy(() => import('@/pages/client/PaymentHistory'));
const MyJobsPage = lazy(() => import('@/pages/client/MyJobsPage'));

// Service / Booking / Checkout
const ServiceDetailsPage = lazy(() => import('@/pages/service/ServiceDetailsPage'));
const CheckoutPage = lazy(() => import('@/pages/checkout/CheckoutPage'));
const BookingPage = lazy(() => import('@/pages/booking/BookingPage'));

// Info Pages
const ForCompaniesPage = lazy(() => import('@/pages/info/ForCompaniesPage'));
const ForClientsPage = lazy(() => import('@/pages/info/ForClientsPage'));
const HelpPage = lazy(() => import('@/pages/info/HelpPage'));
const ContactPage = lazy(() => import('@/pages/info/ContactPage'));
const CareersPage = lazy(() => import('@/pages/info/CareersPage'));
const PrivacyPage = lazy(() => import('@/pages/info/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/info/TermsPage'));
const PlansPage = lazy(() => import('@/pages/PlansPage'));

// Institutional Pages
const AboutPage = lazy(() => import('@/pages/institucional/AboutPage'));
const NewsPage = lazy(() => import('@/pages/institucional/NewsPage'));
const BlogPage = lazy(() => import('@/pages/institucional/BlogPage'));
const BlogDetailPage = lazy(() => import('@/pages/institucional/BlogDetailPage'));
const NewsDetailPage = lazy(() => import('@/pages/NewsDetailPage'));
const UpdatesPage = lazy(() => import('@/pages/institucional/UpdatesPage'));
const CasesPage = lazy(() => import('@/pages/institucional/CasesPage'));
const BipPostPage = lazy(() => import('@/pages/info/BipPostPage'));

// Animated route wrapper
const AnimatedElement = ({ children }: { children: React.ReactElement }) => (
    <PageTransition>{children}</PageTransition>
);

/** Hard-redirects to a URL in another app (e.g., web-pro). Not an SPA navigate. */
const ExternalRedirect = ({ to }: { to: string }) => {
    React.useEffect(() => { window.location.replace(to); }, [to]);
    return <LoadingSpinner />;
};


/** Redireciona mantendo parâmetros da URL (ex: :slug) */
const ExternalRedirectWithParams = ({ to }: { to: string }) => {
    const params = useParams();
    let finalUrl = to;
    Object.entries(params).forEach(([key, value]) => {
        if (value) finalUrl = finalUrl.replace(`:${key}`, value);
    });
    React.useEffect(() => { window.location.replace(finalUrl); }, [finalUrl]);
    return <LoadingSpinner />;
};

interface ProtectedRouteProps {
    userType: 'client' | 'company';
    element: React.ReactElement;
}

/** Guards client-only routes. Redirects unauthenticated users to their login page. */
const ProtectedRoute = ({ userType, element }: ProtectedRouteProps): React.ReactElement => {
    const { user, loading } = useAuth();
    if (loading) return <LoadingSpinner />;
    if (!user || user.type !== userType) {
        const redirectPath = userType === 'company' ? '/login/empresa' : '/login/cliente';
        return <Navigate to={redirectPath} replace />;
    }
    return element;
};

/** Redirects /orders/:orderId to the correct messages page based on user type. */
const OrderRedirect = () => {
    const { user } = useAuth();
    const location = useLocation();
    const { orderId } = useParams();

    if (!user) return <Navigate to="/login/cliente" replace />;
    if (user.type === 'company' && user.companySlug) {
        const joiner = location.search ? '&' : '?';
        return <ExternalRedirect to={`${PRO_APP_URL}/dashboard/empresa/${user.companySlug}/mensagens${location.search}${joiner}thread=${orderId}`} />;
    }
    const joiner = location.search ? '&' : '?';
    return <Navigate to={`/minhas-mensagens${location.search}${joiner}thread=${orderId}`} replace />;
};

const MainRoutes = () => {
    const location = useLocation();

    return (
        <ErrorBoundary>
            <React.Suspense fallback={<LoadingSpinner />}>
                <AnimatePresence mode="wait">
                    <Routes location={location}>
                        {/* Public / Marketplace */}
                        <Route path="/" element={<AnimatedElement><ClientLandingPage /></AnimatedElement>} />
                        <Route path="/empresas" element={<AnimatedElement><CompaniesListPage /></AnimatedElement>} />
                        <Route path="/para-empresas" element={<AnimatedElement><ForCompaniesPage /></AnimatedElement>} />
                        <Route path="/servicos" element={<AnimatedElement><DiscoverCategoriesPage /></AnimatedElement>} />
                        <Route path="/servicos/busca" element={<AnimatedElement><ServicesMarketplacePage /></AnimatedElement>} />
                        <Route path="/empresa/:slug" element={<AnimatedElement><CompanyProfilePage /></AnimatedElement>} />
                        <Route path="/servico/:id" element={<AnimatedElement><ServiceDetailsPage /></AnimatedElement>} />
                        <Route path="/agendar/:serviceId" element={<AnimatedElement><BookingPage /></AnimatedElement>} />
                        <Route path="/checkout/:serviceId" element={<AnimatedElement><CheckoutPage /></AnimatedElement>} />
                        <Route path="/orders/:orderId" element={<OrderRedirect />} />
                        <Route path="/agendamento/confirmacao" element={<AnimatedElement><BookingConfirmationPage /></AnimatedElement>} />

                        {/* Auth — Clients only */}
                        <Route path="/login/cliente" element={<AnimatedElement><ClientLoginPage /></AnimatedElement>} />
                        <Route path="/cadastro/cliente" element={<AnimatedElement><ClientRegisterPage /></AnimatedElement>} />
                        <Route path="/esqueci-senha" element={<AnimatedElement><ForgotPasswordPage /></AnimatedElement>} />
                        <Route path="/redefinir-senha" element={<AnimatedElement><ResetPasswordPage /></AnimatedElement>} />

                        {/* Company auth → redirect to Pro app (parceiros.contrattoex.com) */}
                        <Route path="/login/empresa" element={<ExternalRedirect to={`${PRO_APP_URL}/login/empresa`} />} />
                        <Route path="/login/company" element={<ExternalRedirect to={`${PRO_APP_URL}/login/empresa`} />} />
                        <Route path="/empresa/cadastro" element={<ExternalRedirect to={`${PRO_APP_URL}/empresa/cadastro`} />} />
                        <Route path="/cadastro/empresa" element={<ExternalRedirect to={`${PRO_APP_URL}/empresa/cadastro`} />} />

                        {/* Client Protected Routes */}
                        <Route path="/perfil/cliente" element={<ProtectedRoute userType="client" element={<AnimatedElement><ClientProfilePage /></AnimatedElement>} />} />
                        <Route path="/perfil/pedidos" element={<ProtectedRoute userType="client" element={<AnimatedElement><ClientOrdersPage /></AnimatedElement>} />} />
                        <Route path="/perfil/agendamentos" element={<ProtectedRoute userType="client" element={<AnimatedElement><MyAppointments /></AnimatedElement>} />} />
                        <Route path="/perfil/pagamentos" element={<ProtectedRoute userType="client" element={<AnimatedElement><PaymentHistory /></AnimatedElement>} />} />
                        <Route path="/perfil/vagas" element={<ProtectedRoute userType="client" element={<AnimatedElement><MyJobsPage /></AnimatedElement>} />} />
                        <Route path="/minhas-mensagens" element={<ProtectedRoute userType="client" element={<AnimatedElement><ClientMessagesPage /></AnimatedElement>} />} />
                        <Route path="/favoritos" element={<ProtectedRoute userType="client" element={<AnimatedElement><FavoritesPage /></AnimatedElement>} />} />
                        <Route path="/cliente/novo-pedido" element={<ProtectedRoute userType="client" element={<AnimatedElement><ClientPostJobPage /></AnimatedElement>} />} />

                        {/* Dashboard routes redirect to Pro app entry point */}
                        <Route path="/dashboard/empresa/:slug/*" element={<ExternalRedirectWithParams to={`${PRO_APP_URL}/dashboard/empresa/:slug`} />} />
                        <Route path="/dashboard/*" element={<Navigate to="/login/empresa" replace />} />

                        {/* Pages that use the Premium Dark Layout (Consumer Side) */}
                        <Route element={<ClientPublicLayout />}>
                            <Route path="/planos" element={<AnimatedElement><PlansPage /></AnimatedElement>} />
                            <Route path="/updates" element={<AnimatedElement><UpdatesPage /></AnimatedElement>} />
                            <Route path="/cases" element={<AnimatedElement><CasesPage /></AnimatedElement>} />
                            <Route path="/blog" element={<AnimatedElement><BlogPage /></AnimatedElement>} />
                            <Route path="/institucional/blog/:slug" element={<AnimatedElement><BlogDetailPage /></AnimatedElement>} />
                            <Route path="/ajuda" element={<AnimatedElement><HelpPage /></AnimatedElement>} />
                            <Route path="/contato" element={<AnimatedElement><ContactPage /></AnimatedElement>} />
                            <Route path="/sobre" element={<AnimatedElement><AboutPage /></AnimatedElement>} />
                        </Route>

                        {/* Institutional Old Links (Backward Compatibility or specific light layout) */}
                        <Route path="/institucional" element={<InstitutionalLayout />}>
                            <Route path="sobre" element={<AnimatedElement><AboutPage /></AnimatedElement>} />
                            <Route path="noticias" element={<AnimatedElement><NewsPage /></AnimatedElement>} />
                            {/* Blog redirect to the new Dark layout is already handled below or can be direct */}
                        </Route>

                        <Route path="/noticias" element={<Navigate to="/institucional/noticias" replace />} />
                        <Route path="/noticias/:slug" element={<AnimatedElement><NewsDetailPage /></AnimatedElement>} />
                        <Route path="/bip/como-funciona" element={<AnimatedElement><BipPostPage /></AnimatedElement>} />

                        <Route path="/carreiras" element={<AnimatedElement><CareersPage /></AnimatedElement>} />
                        <Route path="/privacidade" element={<AnimatedElement><PrivacyPage /></AnimatedElement>} />
                        <Route path="/termos" element={<AnimatedElement><TermsPage /></AnimatedElement>} />

                        {/* 404 */}
                        <Route path="*" element={<AnimatedElement><NotFoundPage /></AnimatedElement>} />
                    </Routes>
                </AnimatePresence>
            </React.Suspense>
        </ErrorBoundary>
    );
};

export default MainRoutes;

