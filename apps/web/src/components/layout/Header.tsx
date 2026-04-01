import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import NavLinks from '@/components/layout/header/NavLinks';
import UserActions from '@/components/layout/header/UserActions';
import MobileSheet from '@/components/layout/header/MobileSheet';
import NotificationsDropdown from '@/components/layout/NotificationsDropdown';
import MessagesDropdown from '@/components/layout/MessagesDropdown';
import ThemeToggle from '@/components/layout/header/ThemeToggle';
import { usePrefetchCriticalRoutes } from '@/hooks/usePrefetch';

const Header: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [navigate]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    usePrefetchCriticalRoutes(['/servicos', '/empresas', '/para-empresas'], 2000);

    return (
        <>
            <nav className="fixed top-7 left-1/2 -translate-x-1/2 z-50 w-full sm:w-[95%] max-w-7xl pointer-events-auto">
                <div className={`glass-light rounded-full px-4 sm:px-6 lg:px-10 transition-all duration-300 ${scrolled
                    ? 'py-2 shadow-lg border-white/40'
                    : 'py-3 shadow-soft border-white/20'
                    }`}>
                    <div className="flex items-center justify-between h-10 sm:h-11 lg:h-12 flex-nowrap">
                        {/* Left: Logo & Nav */}
                        <div className="flex items-center gap-4 lg:gap-10 items-center flex-nowrap flex-shrink-0">
                            <Link to="/" className="flex-shrink-0 flex items-center h-full gap-3 group">
                                <img
                                    src="/logo-contratto.png"
                                    alt="CONTRATTO"
                                    className="h-20 sm:h-21 lg:h-22 w-auto max-h-22 object-contain transition-all duration-300 group-hover:opacity-80"
                                />
                            </Link>
                            <NavLinks />
                        </div>

                        {/* Right: User Actions */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-4">
                            <div className="hidden sm:block">
                                <ThemeToggle />
                            </div>
                            <UserActions />

                            {/* Mobile Menu Button */}
                            <div className="lg:hidden flex items-center gap-1.5 sm:gap-2">
                                <div className="sm:hidden">
                                    <ThemeToggle />
                                </div>
                                {user && <MessagesDropdown />}
                                {user && <NotificationsDropdown />}
                                <button
                                    onClick={() => setIsMobileMenuOpen(true)}
                                    className="p-2 sm:p-2.5 rounded-full focus:outline-none transition-all text-gray-500 hover:bg-white/50 hover:text-brand-primary active:scale-95"
                                    aria-label="Menu"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <MobileSheet isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </>
    );
};

export default Header;
