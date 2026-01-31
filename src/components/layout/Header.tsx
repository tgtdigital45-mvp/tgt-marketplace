import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import OptimizedImage from '../ui/OptimizedImage';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { AnimatePresence, motion } from 'framer-motion';

const HeaderOptimized: React.FC = () => {
    const { user, logout } = useAuth();
    const { company } = useCompany();
    const navigate = useNavigate();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    const userDropdownRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(userDropdownRef, () => setIsUserDropdownOpen(false));

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Close menus on route change
    React.useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsUserDropdownOpen(false);
    }, [navigate]);

    return (
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-100">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <Link to="/" className="text-2xl font-black text-brand-primary tracking-tighter hover:opacity-80 transition-opacity">
                            TGT
                        </Link>
                    </div>

                    {/* Desktop Navigation - OPTIMIZED */}
                    <nav className="hidden md:flex items-center space-x-6">
                        {/* 1. Buscar Empresas */}
                        <Link
                            to="/empresas"
                            className="text-gray-600 hover:text-brand-primary font-medium transition-colors text-sm"
                        >
                            Buscar Empresas
                        </Link>

                        {/* 2. Para Empresas */}
                        <Link
                            to="/para-empresas"
                            className="text-gray-600 hover:text-brand-primary font-medium transition-colors text-sm"
                        >
                            Para Empresas
                        </Link>
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* 4. Publicar Grátis (if not logged in) */}
                        {!user && (
                            <Link
                                to="/empresa/cadastro"
                                className="text-sm font-medium text-brand-primary hover:text-brand-primary/80 transition-colors"
                            >
                                Publicar Grátis
                            </Link>
                        )}

                        {/* 5. User Menu or Login */}
                        {user ? (
                            <div className="relative" ref={userDropdownRef}>
                                <button
                                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                    className="flex items-center gap-2 focus:outline-none group min-h-[44px] min-w-[44px]"
                                    aria-label="Menu do usuário"
                                >
                                    <OptimizedImage
                                        className="h-9 w-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-brand-primary/20 transition-all"
                                        src={(user.type === 'company' && company?.logo_url) || user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
                                        alt={(user.type === 'company' && company?.company_name) || user.name}
                                    />
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors max-w-[100px] truncate">
                                        {(user.type === 'company' && company?.company_name) || user.name.split(' ')[0]}
                                    </span>
                                    <svg className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                <AnimatePresence>
                                    {isUserDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.1 }}
                                            className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black/5 py-2 z-50"
                                        >
                                            <div className="px-4 py-2 border-b border-gray-50">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Minha Conta</p>
                                            </div>

                                            {user.type === 'client' && (
                                                <>
                                                    <Link to="/perfil/cliente" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                        Meu Perfil
                                                    </Link>
                                                    <Link to="/favoritos" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                        Favoritos
                                                    </Link>
                                                    <Link to="/perfil/cliente" state={{ activeTab: 'messages' }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                        Mensagens
                                                    </Link>
                                                </>
                                            )}
                                            {user.type === 'company' && (
                                                <>
                                                    <Link to={user.companySlug ? `/dashboard/empresa/${user.companySlug}` : "/empresa/cadastro"} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                        Dashboard
                                                    </Link>
                                                    <Link to={company?.slug ? `/empresa/${company.slug}` : "/empresa/meu-negocio"} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                                        Ver Página Pública
                                                    </Link>
                                                </>
                                            )}

                                            <div className="border-t border-gray-50 mt-1 pt-1">
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                                                >
                                                    Sair
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link
                                to="/auth/login"
                                className="bg-brand-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-primary/90 transition-all shadow-md shadow-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/30 active:scale-95 min-h-[44px] flex items-center"
                            >
                                Entrar
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
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
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-45 md:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl z-50 md:hidden flex flex-col overflow-y-auto"
                        >
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between min-h-[60px]">
                                <span className="text-xl font-bold text-gray-900">Menu</span>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors min-h-[44px] min-w-[44px]"
                                    aria-label="Fechar menu"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-4 space-y-4 flex-1">
                                {user && (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                                        <OptimizedImage
                                            src={(user.type === 'company' && company?.logo_url) || user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
                                            alt={(user.type === 'company' && company?.company_name) || user.name}
                                            className="h-10 w-10 rounded-full bg-white shadow-sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate">{(user.type === 'company' && company?.company_name) || user.name}</p>
                                            <p className="text-xs text-gray-500 capitalize">{user.type === 'client' ? 'Cliente' : 'Empresa'}</p>
                                        </div>
                                    </div>
                                )}

                                <nav className="space-y-1">
                                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors min-h-[44px] flex items-center">
                                        Início
                                    </Link>
                                    <Link to="/empresas" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors min-h-[44px] flex items-center">
                                        Buscar Empresas
                                    </Link>
                                    <Link to="/para-empresas" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors min-h-[44px] flex items-center">
                                        Para Empresas
                                    </Link>

                                    {/* Info Section */}
                                    <div className="pt-2">
                                        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Informações</p>
                                        <Link to="/sobre" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg min-h-[44px] flex items-center">
                                            Sobre Nós
                                        </Link>
                                        <Link to="/ajuda" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg min-h-[44px] flex items-center">
                                            Ajuda
                                        </Link>
                                        <Link to="/contato" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg min-h-[44px] flex items-center">
                                            Contato
                                        </Link>
                                    </div>
                                </nav>

                                <div className="border-t border-gray-100 my-4 pt-4">
                                    <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Conta</p>
                                    {user ? (
                                        <div className="space-y-1">
                                            {user.type === 'client' ? (
                                                <>
                                                    <Link to="/perfil/cliente" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg min-h-[44px] flex items-center">
                                                        Meu Perfil
                                                    </Link>
                                                    <Link to="/favoritos" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg min-h-[44px] flex items-center">
                                                        Favoritos
                                                    </Link>
                                                    <Link to="/minhas-mensagens" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg min-h-[44px] flex items-center">
                                                        Mensagens
                                                    </Link>
                                                </>
                                            ) : (
                                                <>
                                                    <Link to={user.companySlug ? `/dashboard/empresa/${user.companySlug}` : "/empresa/cadastro"} onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg min-h-[44px] flex items-center">
                                                        Dashboard
                                                    </Link>
                                                </>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left block px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg mt-2 min-h-[44px] flex items-center"
                                            >
                                                Sair
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            <Link to="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center w-full px-4 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-brand-primary hover:bg-brand-primary/90 min-h-[44px]">
                                                Entrar
                                            </Link>
                                            <Link to="/auth/register" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center w-full px-4 py-3 border border-brand-primary text-brand-primary rounded-xl font-medium hover:bg-brand-primary/5 min-h-[44px]">
                                                Criar Conta
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
};

export default HeaderOptimized;
