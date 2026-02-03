import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';
import UserDropdown from './header/UserDropdown';
import LoginDropdown from './header/LoginDropdown';
import DesktopNav from './header/DesktopNav';
import MobileMenu from './header/MobileMenu';

const HeaderOptimized: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close menu on route change
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [navigate]);

    return (
        <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-slate-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <Link to="/" className="text-2xl font-bold text-slate-900 tracking-tighter hover:opacity-80 transition-opacity">
                            TGT
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <DesktopNav />

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {!user && (
                            <Link to="/empresa/cadastro">
                                <Button variant="primary">Publicar Grátis</Button>
                            </Link>
                        )}

                        {user ? (
                            <div className="flex items-center gap-2">
                                <NotificationsDropdown />
                                <UserDropdown />
                            </div>
                        ) : (
                            <LoginDropdown />
                        )}
                    </div>

                    {/* Mobile Actions (Notifications + Burger) */}
                    <div className="md:hidden flex items-center gap-2">
                        {user && <NotificationsDropdown />}

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-brand-primary focus:outline-none transition-colors min-h-[44px] min-w-[44px]"
                            aria-label="Menu principal"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </header>
    );
};

export default HeaderOptimized;
