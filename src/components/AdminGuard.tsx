import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './ui/LoadingSpinner';

interface AdminGuardProps {
    children: React.ReactNode;
}

/**
 * AdminGuard - Protege rotas administrativas
 * Redireciona usuários não-admin para a home
 */
const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            console.warn('[AdminGuard] Access denied - redirecting to home');
            navigate('/', { replace: true });
        }
    }, [user, loading, navigate]);

    // Mostrar loading enquanto verifica autenticação
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    // Não renderizar nada se não for admin (redirecionamento em andamento)
    if (!user || user.role !== 'admin') {
        return null;
    }

    // Renderizar conteúdo protegido
    return <>{children}</>;
};

export default AdminGuard;
