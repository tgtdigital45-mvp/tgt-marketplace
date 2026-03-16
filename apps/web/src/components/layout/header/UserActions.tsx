import React from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import NotificationsDropdown from '@/components/layout/NotificationsDropdown';
import MessagesDropdown from '@/components/layout/MessagesDropdown';
import UserDropdown from '@/components/layout/header/UserDropdown';
import LoginDropdown from '@/components/layout/header/LoginDropdown';
import { Button } from '@tgt/ui-web';


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

                    <Link to="/cadastro/cliente">
                        <Button
                            variant="primary"
                            className="rounded-[var(--radius-box)]"
                        >
                            Começar Grátis
                        </Button>
                    </Link>
                </>
            )}

            {user && (
                <div className="flex items-center gap-2 sm:gap-3">
                    <MessagesDropdown />
                    <NotificationsDropdown />
                    <UserDropdown />
                </div>
            )}
        </div>
    );
};

export default UserActions;
