import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import InstitutionalLayout from '@/components/layout/InstitutionalLayout';
import { AnimatedElement, ProtectedRoute, ExternalRedirect, ExternalRedirectWithParams, OrderRedirect, PRO_APP_URL } from './guards';

// ------------------------------
// 1. Marketplace / Public Pages
// ------------------------------
const ClientLandingPage = lazy(() => import('@/pages/ClientLandingPage'));
const CompaniesListPage = lazy(() => import('@/pages/LandingPage'));
const ServicesMarketplacePage = lazy(() => import('@/pages/ServicesMarketplacePage'));
const CompanyProfilePage = lazy(() => import('@/pages/CompanyProfilePage'));
const BookingConfirmationPage = lazy(() => import('@/pages/BookingConfirmationPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Service / Booking / Checkout
const ServiceDetailsPage = lazy(() => import('@/pages/service/ServiceDetailsPage'));
const CheckoutPage = lazy(() => import('@/pages/checkout/CheckoutPage'));
const BookingPage = lazy(() => import('@/pages/booking/BookingPage'));

export const PublicRoutes = (
    <React.Fragment>
        <Route path="/" element={<AnimatedElement><ClientLandingPage /></AnimatedElement>} />
        <Route path="/empresas" element={<AnimatedElement><CompaniesListPage /></AnimatedElement>} />
        <Route path="/servicos" element={<AnimatedElement><ServicesMarketplacePage /></AnimatedElement>} />
        <Route path="/empresa/:slug" element={<AnimatedElement><CompanyProfilePage /></AnimatedElement>} />
        <Route path="/servico/:id" element={<AnimatedElement><ServiceDetailsPage /></AnimatedElement>} />
        <Route path="/agendar/:serviceId" element={<AnimatedElement><BookingPage /></AnimatedElement>} />
        <Route path="/checkout/:serviceId" element={<AnimatedElement><CheckoutPage /></AnimatedElement>} />
        <Route path="/orders/:orderId" element={<OrderRedirect />} />
        <Route path="/agendamento/confirmacao" element={<AnimatedElement><BookingConfirmationPage /></AnimatedElement>} />
        <Route path="*" element={<AnimatedElement><NotFoundPage /></AnimatedElement>} />
    </React.Fragment>
);

// ------------------------------
// 2. Auth Pages
// ------------------------------
const ClientLoginPage = lazy(() => import('@/pages/auth/ClientLoginPage'));
const ClientRegisterPage = lazy(() => import('@/pages/auth/ClientRegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));

export const AuthRoutes = (
    <React.Fragment>
        <Route path="/login/cliente" element={<AnimatedElement><ClientLoginPage /></AnimatedElement>} />
        <Route path="/cadastro/cliente" element={<AnimatedElement><ClientRegisterPage /></AnimatedElement>} />
        <Route path="/esqueci-senha" element={<AnimatedElement><ForgotPasswordPage /></AnimatedElement>} />
        <Route path="/redefinir-senha" element={<AnimatedElement><ResetPasswordPage /></AnimatedElement>} />

        {/* Company auth → redirect to Pro app */}
        <Route path="/login/empresa" element={<ExternalRedirect to={`${PRO_APP_URL}/login/empresa`} />} />
        <Route path="/login/company" element={<ExternalRedirect to={`${PRO_APP_URL}/login/empresa`} />} />
        <Route path="/empresa/cadastro" element={<ExternalRedirect to={`${PRO_APP_URL}/empresa/cadastro`} />} />
        <Route path="/cadastro/empresa" element={<ExternalRedirect to={`${PRO_APP_URL}/empresa/cadastro`} />} />
    </React.Fragment>
);

// ------------------------------
// 3. Client Protected Pages
// ------------------------------
const ClientProfilePage = lazy(() => import('@/pages/client/ClientProfilePage'));
const ClientOrdersPage = lazy(() => import('@/pages/client/ClientOrdersPage'));
const ClientMessagesPage = lazy(() => import('@/pages/client/ClientMessagesPage'));
const FavoritesPage = lazy(() => import('@/pages/client/FavoritesPage'));
const ClientPostJobPage = lazy(() => import('@/pages/client/ClientPostJobPage'));
const MyAppointments = lazy(() => import('@/pages/client/MyAppointments'));
const PaymentHistory = lazy(() => import('@/pages/client/PaymentHistory'));

export const ClientProtectedRoutes = (
    <React.Fragment>
        <Route path="/perfil/cliente" element={<ProtectedRoute userType="client" element={<AnimatedElement><ClientProfilePage /></AnimatedElement>} />} />
        <Route path="/perfil/pedidos" element={<ProtectedRoute userType="client" element={<AnimatedElement><ClientOrdersPage /></AnimatedElement>} />} />
        <Route path="/perfil/agendamentos" element={<ProtectedRoute userType="client" element={<AnimatedElement><MyAppointments /></AnimatedElement>} />} />
        <Route path="/perfil/pagamentos" element={<ProtectedRoute userType="client" element={<AnimatedElement><PaymentHistory /></AnimatedElement>} />} />
        <Route path="/minhas-mensagens" element={<ProtectedRoute userType="client" element={<AnimatedElement><ClientMessagesPage /></AnimatedElement>} />} />
        <Route path="/favoritos" element={<ProtectedRoute userType="client" element={<AnimatedElement><FavoritesPage /></AnimatedElement>} />} />
        <Route path="/cliente/novo-pedido" element={<ProtectedRoute userType="client" element={<AnimatedElement><ClientPostJobPage /></AnimatedElement>} />} />
        
        {/* Dashboard routes redirect to Pro app */}
        <Route path="/dashboard/empresa/:slug/*" element={<ExternalRedirectWithParams to={`${PRO_APP_URL}/dashboard/empresa/:slug`} />} />
        <Route path="/dashboard/*" element={<Navigate to="/login/empresa" replace />} />
    </React.Fragment>
);

// ------------------------------
// 4. Info & Institutional
// ------------------------------
const ForCompaniesPage = lazy(() => import('@/pages/info/ForCompaniesPage'));
const ForClientsPage = lazy(() => import('@/pages/info/ForClientsPage'));
const HelpPage = lazy(() => import('@/pages/info/HelpPage'));
const ContactPage = lazy(() => import('@/pages/info/ContactPage'));
const CareersPage = lazy(() => import('@/pages/info/CareersPage'));
const PrivacyPage = lazy(() => import('@/pages/info/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/info/TermsPage'));
const PlansPage = lazy(() => import('@/pages/PlansPage'));

const AboutPage = lazy(() => import('@/pages/institucional/AboutPage'));
const NewsPage = lazy(() => import('@/pages/institucional/NewsPage'));
const BlogPage = lazy(() => import('@/pages/institucional/BlogPage'));
const NewsDetailPage = lazy(() => import('@/pages/NewsDetailPage'));

export const InfoRoutes = (
    <React.Fragment>
        <Route path="/para-empresas" element={<AnimatedElement><ForCompaniesPage /></AnimatedElement>} />
        <Route path="/para-clientes" element={<AnimatedElement><ForClientsPage /></AnimatedElement>} />
        <Route path="/ajuda" element={<AnimatedElement><HelpPage /></AnimatedElement>} />
        <Route path="/contato" element={<AnimatedElement><ContactPage /></AnimatedElement>} />
        <Route path="/carreiras" element={<AnimatedElement><CareersPage /></AnimatedElement>} />
        <Route path="/privacidade" element={<AnimatedElement><PrivacyPage /></AnimatedElement>} />
        <Route path="/termos" element={<AnimatedElement><TermsPage /></AnimatedElement>} />
        <Route path="/planos" element={<AnimatedElement><PlansPage /></AnimatedElement>} />

        <Route path="/institucional" element={<InstitutionalLayout />}>
            <Route path="sobre" element={<AnimatedElement><AboutPage /></AnimatedElement>} />
            <Route path="noticias" element={<AnimatedElement><NewsPage /></AnimatedElement>} />
            <Route path="blog" element={<AnimatedElement><BlogPage /></AnimatedElement>} />
        </Route>
        <Route path="/sobre" element={<Navigate to="/institucional/sobre" replace />} />
        <Route path="/noticias" element={<Navigate to="/institucional/noticias" replace />} />
        <Route path="/noticias/:slug" element={<AnimatedElement><NewsDetailPage /></AnimatedElement>} />
    </React.Fragment>
);

// ------------------------------
// 5. Admin Pages
// ------------------------------
import AdminGuard from '@/components/AdminGuard';
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminDisputesPage = lazy(() => import('@/pages/admin/AdminDisputesPage'));
const AdminModerationPage = lazy(() => import('@/pages/admin/AdminModerationPage'));
const AdminSecurityPage = lazy(() => import('@/pages/admin/AdminSecurityPage'));
const Verify2FAPage = lazy(() => import('@/pages/admin/Verify2FAPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
// const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));

export const AdminRoutes = (
    <React.Fragment>
        <Route path="/admin" element={<AdminGuard><AnimatedElement><AdminDashboard /></AnimatedElement></AdminGuard>} />
        <Route path="/admin/disputas" element={<AdminGuard><AnimatedElement><AdminDisputesPage /></AnimatedElement></AdminGuard>} />
        <Route path="/admin/moderacao" element={<AdminGuard><AnimatedElement><AdminModerationPage /></AnimatedElement></AdminGuard>} />
        <Route path="/admin/usuarios" element={<AdminGuard><AnimatedElement><AdminUsersPage /></AnimatedElement></AdminGuard>} />
        <Route path="/admin/security" element={<AdminGuard><AnimatedElement><AdminSecurityPage /></AnimatedElement></AdminGuard>} />
        <Route path="/admin/verify-2fa" element={<AnimatedElement><Verify2FAPage /></AnimatedElement>} />
    </React.Fragment>
);

