import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';
import UserDropdown from './header/UserDropdown';
import LoginDropdown from './header/LoginDropdown';
import DesktopNav from './header/DesktopNav';
import MobileMenu from './header/MobileMenu';
import { usePrefetchCriticalRoutes } from '../../hooks/usePrefetch';

const HeaderOptimized: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    // Close menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [navigate]);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            const offset = window.scrollY;
            if (offset > 10) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Prefetch critical routes after 2s (user is engaged)
    usePrefetchCriticalRoutes([
        '/empresas',
        '/login/cliente',
        '/empresa/cadastro',
    ], 2000);

    // Check if we are on a dashboard page to possibly adjust styling (optional, keeping consistent for now)
    const isDashboard = location.pathname.includes('/dashboard');

    return (
        <header
            className={`sticky top-0 z-30 transition-all duration-300 ease-in-out ${scrolled
                ? 'py-2 bg-white/80 backdrop-blur-xl shadow-soft-xl border-b border-white/20'
                : 'py-4 bg-transparent border-b border-transparent'
                }`}
        >
            <div className={`container mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${scrolled ? 'max-w-7xl' : 'max-w-7xl'}`}>
                <div className={`flex items-center justify-between h-20 transition-all duration-300 ${scrolled ? 'px-0' : 'bg-white/50 backdrop-blur-md rounded-2xl px-6 shadow-blur'}`}>

                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <Link to="/" className="text-2xl font-bold text-gray-800 tracking-tighter hover:opacity-80 transition-opacity flex items-center gap-2">
                            <div className="bg-brand-primary/10 p-2 rounded-xl">
                                <span className="text-brand-primary">TGT</span>
                            </div>
                            <span className={`${scrolled ? 'text-gray-800' : 'text-gray-800'}`}>Contratto</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <DesktopNav />

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {!user && (
                            <Link to="/empresa/cadastro">
                                <Button variant="primary" className="shadow-brand-md hover:shadow-brand-lg transition-all rounded-xl px-6">
                                    Publicar Grátis
                                </Button>
                            </Link>
                        )}

                        {user ? (
                            <div className="flex items-center gap-4">
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
                            className="p-2 rounded-xl text-gray-600 hover:bg-white hover:shadow-soft-md hover:text-brand-primary focus:outline-none transition-all min-h-[44px] min-w-[44px]"
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
