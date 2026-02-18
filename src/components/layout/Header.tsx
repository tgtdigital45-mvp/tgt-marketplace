import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NavLinks from './header/NavLinks';
import UserActions from './header/UserActions';
import MobileSheet from './header/MobileSheet';
import NotificationsDropdown from './NotificationsDropdown';
import { usePrefetchCriticalRoutes } from '../../hooks/usePrefetch';

const Header: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    // Pages that should have a transparent header at the top (Dark Hero background)
    const transparentHeaderPages = ['/', '/landing-client', '/empresas'];
    const isTransparentPage = transparentHeaderPages.includes(location.pathname);

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

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    usePrefetchCriticalRoutes(['/empresas', '/login/cliente', '/empresa/cadastro'], 2000);

    // Transparency logic
    // If we are on a "Transparent Page" AND not scrolled, we are in Transparent Mode.
    const isTransparentMode = isTransparentPage && !scrolled;

    const headerPosition = isTransparentPage ? 'fixed' : 'sticky';

    return (
        <header
            className={`${headerPosition} top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out border-b
                ${scrolled || !isTransparentPage
                    ? 'py-3 bg-background/80 backdrop-blur-md border-gray-100 shadow-sm'
                    : 'py-5 bg-transparent border-white/5'
                }`}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">

                    {/* Left: Logo */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className={`transition-all duration-300 p-2 rounded-xl ${isTransparentMode ? 'bg-white/10' : 'bg-brand-primary/10'}`}>
                                <span className={`font-bold text-xl ${isTransparentMode ? 'text-white' : 'text-brand-primary'}`}>TGT</span>
                            </div>
                            <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${isTransparentMode ? 'text-white' : 'text-gray-900'}`}>
                                Contratto
                            </span>
                        </Link>
                    </div>

                    {/* Center: Navigation */}
                    <NavLinks isScrolled={scrolled || !isTransparentPage} isTransparent={isTransparentPage} />

                    {/* Right: User Actions */}
                    <UserActions
                        isScrolled={scrolled || !isTransparentPage}
                        isTransparent={isTransparentPage}
                        isTransparentMode={isTransparentMode}
                    />

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        {user && <NotificationsDropdown />}

                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className={`p-2 rounded-xl focus:outline-none transition-all
                                ${isTransparentMode
                                    ? 'text-white hover:bg-white/10'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-brand-primary'
                                }`}
                            aria-label="Menu"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <MobileSheet isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </header>
    );
};

export default Header;


