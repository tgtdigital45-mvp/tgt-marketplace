import React, { useEffect } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { LoadingSpinner, PageTransition } from '@tgt/ui-web';
import { useAuth } from '@/contexts/AuthContext';

// PRO APP URL from environment
export const PRO_APP_URL = (import.meta as any).env?.VITE_PRO_APP_URL || 'https://web-pro-xi-seven.vercel.app';

export const AnimatedElement = ({ children }: { children: React.ReactElement }) => (
    <PageTransition>{children}</PageTransition>
);

export const ExternalRedirect = ({ to }: { to: string }) => {
    useEffect(() => { window.location.replace(to); }, [to]);
    return <LoadingSpinner />;
};

export const ExternalRedirectWithParams = ({ to }: { to: string }) => {
    const params = useParams();
    let finalUrl = to;
    Object.entries(params).forEach(([key, value]) => {
        if (value) finalUrl = finalUrl.replace(`:${key}`, value);
    });
    useEffect(() => { window.location.replace(finalUrl); }, [finalUrl]);
    return <LoadingSpinner />;
};

interface ProtectedRouteProps {
    userType: 'client' | 'company';
    element: React.ReactElement;
}

export const ProtectedRoute = ({ userType, element }: ProtectedRouteProps): React.ReactElement => {
    const { user, loading } = useAuth();
    if (loading) return <LoadingSpinner />;
    if (!user || user.type !== userType) {
        const redirectPath = userType === 'company' ? '/login/empresa' : '/login/cliente';
        return <Navigate to={redirectPath} replace />;
    }
    return element;
};

export const OrderRedirect = () => {
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
