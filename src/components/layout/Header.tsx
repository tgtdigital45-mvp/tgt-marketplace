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

    // Pages that should have a transparent header at the top (Dark Hero background)
    const transparentHeaderPages = ['/', '/landing-client'];
    const isTransparentPage = transparentHeaderPages.includes(location.pathname);

    // Close menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [navigate]);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            const offset = window.scrollY;
            if (offset > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    usePrefetchCriticalRoutes(['/empresas', '/login/cliente', '/empresa/cadastro'], 2000);

    // Calculate transparency state:
    // It is "Transparent Mode" only if: We are on a transparent page AND we haven't scrolled yet.
    const isTransparentMode = isTransparentPage && !scrolled;

    return (
        <header
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${scrolled || !isTransparentPage
                ? 'py-3 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
                : 'py-5 bg-transparent border-b border-white/5'
                }`}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300">
                <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-20'}`}>

                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <Link to="/" className="text-2xl font-bold tracking-tighter hover:opacity-80 transition-opacity flex items-center gap-2 group">
                            <div className={`transition-all duration-300 p-2 rounded-xl ${isTransparentMode ? 'bg-white/10' : 'bg-brand-primary/10'}`}>
                                <span className={isTransparentMode ? 'text-white' : 'text-brand-primary'}>TGT</span>
                            </div>
                            <span className={`transition-colors duration-300 group-hover:text-brand-primary ${isTransparentMode ? 'text-white' : 'text-gray-800'}`}>
                                Contratto
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <DesktopNav isScrolled={scrolled || !isTransparentPage} isTransparent={isTransparentPage} />

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {!user && (
                            <Link to="/empresa/cadastro">
                                <Button
                                    variant={isTransparentMode ? 'outline' : 'primary'}
                                    className={`transition-all duration-300 rounded-xl px-6 ${isTransparentMode
                                        ? 'border-white/30 text-white hover:bg-white hover:text-brand-primary hover:border-white'
                                        : 'shadow-brand-md hover:shadow-brand-lg'
                                        } ${scrolled ? 'py-2 text-sm' : 'py-2.5'}`}
                                >
                                    Publicar Grátis
                                </Button>
                            </Link>
                        )}

                        {user ? (
                            <div className="flex items-center gap-4">
                                <NotificationsDropdown />
                                <UserDropdown isTransparentMode={isTransparentMode} />
                            </div>
                        ) : (
                            <LoginDropdown />
                        )}
                    </div>

                    {/* Mobile Actions */}
                    <div className="md:hidden flex items-center gap-2">
                        {user && <NotificationsDropdown />}

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`p-2 rounded-xl focus:outline-none transition-all min-h-[44px] min-w-[44px] active:scale-95 ${isTransparentMode
                                ? 'text-white hover:bg-white/10'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-brand-primary'
                                }`}
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

            <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </header>
    );
};

export default HeaderOptimized;

