import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../ui/Button';
import { useAuth } from '../../../contexts/AuthContext';
import NotificationsDropdown from '../NotificationsDropdown';
import UserDropdown from './UserDropdown';
import LoginDropdown from './LoginDropdown';

interface UserActionsProps {
    isScrolled: boolean;
    isTransparent: boolean;
    isTransparentMode: boolean; // Computed detailed mode state
}

const UserActions: React.FC<UserActionsProps> = ({ isScrolled, isTransparentMode }) => {
    const { user } = useAuth();

    return (
        <div className="hidden md:flex items-center gap-4">
            {!user && (
                <>
                    <LoginDropdown />

                    <Link to="/empresa/cadastro">
                        <Button
                            variant={isTransparentMode ? 'outline' : 'primary'}
                            className={`transition-all duration-300 rounded-xl px-6 font-semibold shadow-none hover:shadow-md
                                ${isTransparentMode
                                    ? 'border-white/30 text-white hover:bg-white hover:text-brand-primary hover:border-white'
                                    : 'bg-brand-primary text-white border border-transparent hover:bg-brand-primary/90'
                                } 
                                ${isScrolled ? 'py-2 text-sm' : 'py-2.5'}
                            `}
                        >
                            Começar Grátis
                        </Button>
                    </Link>
                </>
            )}

            {user && (
                <div className="flex items-center gap-3">
                    <NotificationsDropdown />
                    <UserDropdown isTransparentMode={isTransparentMode} />

                    {/* Optional: Add a specialized CTA for logged in users if needed */}
                    {/* e.g., "Post New Service" if they are a company */}
                </div>
            )}
        </div>
    );
};

export default UserActions;
