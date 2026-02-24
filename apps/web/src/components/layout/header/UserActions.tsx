import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import NotificationsDropdown from '@/components/layout/NotificationsDropdown';
import UserDropdown from '@/components/layout/header/UserDropdown';
import LoginDropdown from '@/components/layout/header/LoginDropdown';

const UserActions: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="hidden md:flex items-center gap-3">
                <div className="h-4 w-20 bg-gray-100 animate-pulse rounded-lg"></div>
                <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="hidden md:flex items-center gap-4">
            {!user && (
                <>
                    <LoginDropdown />

                    <Link to="/empresa/cadastro">
                        <Button
                            variant="primary"
                            className="bg-brand-primary text-white border border-transparent hover:bg-brand-primary/90 transition-all duration-300 rounded-xl px-6 py-2.5 font-semibold shadow-none hover:shadow-md"
                        >
                            Começar Grátis
                        </Button>
                    </Link>
                </>
            )}

            {user && (
                <div className="flex items-center gap-3">
                    <NotificationsDropdown />
                    <UserDropdown />
                </div>
            )}
        </div>
    );
};

export default UserActions;
