import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import NavLinks from '@/components/layout/header/NavLinks';
import UserActions from '@/components/layout/header/UserActions';
import SearchBar from '@/components/layout/header/SearchBar';
import MobileSheet from '@/components/layout/header/MobileSheet';
import NotificationsDropdown from '@/components/layout/NotificationsDropdown';
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

    usePrefetchCriticalRoutes(['/empresas', '/login/cliente', '/empresa/cadastro'], 2000);

    return (
        <header
            className={`sticky top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled
                ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
                : 'bg-white/95 backdrop-blur-sm border-b border-transparent'
                }`}
        >
            <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14 sm:h-16 lg:h-[4.5rem]">
                    {/* Left: Logo & Nav */}
                    <div className="flex items-center gap-4 sm:gap-6 lg:gap-10 min-w-0">
                        <Link to="/" className="flex-shrink-0 flex items-center group">
                            <img
                                src="/logo-contratto.png"
                                alt="CONTRATTO"
                                className="h-10 sm:h-12 lg:h-14 w-auto object-contain transition-all duration-300 group-hover:opacity-80 block"
                                style={{
                                    maxHeight: 'min(56px, 14vw)',
                                    height: 'auto'
                                }}
                            />
                        </Link>
                        <NavLinks />
                    </div>

                    {/* Center: Search Bar */}
                    <div className="hidden lg:flex flex-1 justify-center px-4 xl:px-6 max-w-md xl:max-w-xl">
                        <SearchBar />
                    </div>

                    {/* Right: User Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <UserActions />

                        {/* Mobile Menu Button */}
                        <div className="lg:hidden flex items-center gap-1.5 sm:gap-2">
                            {user && <NotificationsDropdown />}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-2 sm:p-2.5 rounded-xl focus:outline-none transition-all text-gray-500 hover:bg-gray-100 hover:text-brand-primary active:scale-95"
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

            <MobileSheet isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        </header>
    );
};

export default Header;
