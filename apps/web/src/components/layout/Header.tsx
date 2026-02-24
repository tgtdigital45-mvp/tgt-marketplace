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

    // Close menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [navigate]);

    usePrefetchCriticalRoutes(['/empresas', '/login/cliente', '/empresa/cadastro'], 2000);

    return (
        <header className="sticky top-0 left-0 w-full z-50 bg-white border-b border-gray-100 shadow-sm transition-all duration-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">

                    {/* Left: Logo & Nav */}
                    <div className="flex items-center gap-10">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="flex items-center group">
                                <img
                                    src="/logo-contratto.svg"
                                    alt="CONTRATTO"
                                    className="h-10 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                                />
                            </Link>
                        </div>
                        <NavLinks />
                    </div>

                    {/* Center: Search Bar */}
                    <div className="flex-1 flex justify-center px-4">
                        <SearchBar />
                    </div>

                    {/* Right: User Actions */}
                    <div className="flex items-center gap-4">
                        <UserActions />

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center gap-2">
                            {user && <NotificationsDropdown />}

                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-2 rounded-xl focus:outline-none transition-all text-gray-600 hover:bg-gray-100 hover:text-brand-primary"
                                aria-label="Menu"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
