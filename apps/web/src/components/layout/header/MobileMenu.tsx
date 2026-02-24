import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const { company } = useCompany();
    const navigate = useNavigate();
    const [isInstitucionalOpen, setIsInstitucionalOpen] = useState(false);

    const handleLogout = () => {
        logout();
        onClose();
        navigate('/');
    };

    const handleLinkClick = () => {
        onClose();
        setIsInstitucionalOpen(false);
    };

    // BODY SCROLL LOCK: Travar rolagem da página quando menu aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        // Cleanup: Garantir que overflow seja restaurado ao desmontar
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Só renderiza se isOpen === true
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                // CONTAINER PAI (Overlay): z-[9999] para ficar acima de tudo
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    {/* CAMADA 1: BACKDROP (Fundo Escuro) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        aria-hidden="true"
                    />

                    {/* CAMADA 2: PAINEL (Menu em si) */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-[85%] max-w-sm h-full bg-white shadow-2xl flex flex-col overflow-y-auto"
                    >
                        {/* TOPO: Logo + Botão Fechar (Sticky) */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <Link to="/" onClick={handleLinkClick} className="flex items-center gap-2">
                                <div className="bg-brand-primary/10 p-2 rounded-xl">
                                    <span className="text-brand-primary font-bold text-lg">CONTRATTO</span>
                                </div>
                                <span className="text-gray-800 font-bold text-lg">Contratto</span>
                            </Link>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                                aria-label="Fechar menu"
                            >
                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* MEIO: Navegação Principal */}
                        <div className="flex-1 px-4 py-6 bg-white">
                            {/* Card de Perfil (se autenticado) */}
                            {user && (
                                <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-brand-primary/5 to-brand-primary/10 rounded-xl mb-6 border border-brand-primary/10">
                                    <OptimizedImage
                                        src={(user.type === 'company' && company?.logo_url) || user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
                                        alt={(user.type === 'company' && company?.company_name) || user.name}
                                        className="h-12 w-12 rounded-full bg-white shadow-md ring-2 ring-white"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{(user.type === 'company' && company?.company_name) || user.name}</p>
                                        <p className="text-xs text-gray-600 capitalize">{user.type === 'client' ? 'Cliente' : 'Empresa'}</p>
                                    </div>
                                </div>
                            )}

                            <nav className="space-y-2">
                                {/* Home */}
                                <Link
                                    to="/"
                                    onClick={handleLinkClick}
                                    className="flex items-center gap-3 px-4 py-3 text-base font-semibold text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all min-h-[48px] group"
                                >
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Home
                                </Link>

                                {/* Serviços */}
                                <Link
                                    to="/servicos"
                                    onClick={handleLinkClick}
                                    className="flex items-center gap-3 px-4 py-3 text-base font-semibold text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all min-h-[48px] group"
                                >
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    Serviços
                                </Link>

                                {/* Empresas */}
                                <Link
                                    to="/empresas"
                                    onClick={handleLinkClick}
                                    className="flex items-center gap-3 px-4 py-3 text-base font-semibold text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all min-h-[48px] group"
                                >
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Empresas
                                </Link>

                                {/* Para Empresas */}
                                <Link
                                    to="/para-empresas"
                                    onClick={handleLinkClick}
                                    className="flex items-center gap-3 px-4 py-3 text-base font-semibold text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all min-h-[48px] group"
                                >
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Para Empresas
                                </Link>

                                {/* Institucional (Dropdown) */}
                                <div>
                                    <button
                                        onClick={() => setIsInstitucionalOpen(!isInstitucionalOpen)}
                                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-base font-semibold text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all min-h-[48px] group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Institucional
                                        </div>
                                        <svg
                                            className={`w-4 h-4 text-gray-400 transition-transform ${isInstitucionalOpen ? 'rotate-180' : ''}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Submenu */}
                                    <AnimatePresence>
                                        {isInstitucionalOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pl-8 pr-4 py-2 space-y-1">
                                                    <Link
                                                        to="/sobre"
                                                        onClick={handleLinkClick}
                                                        className="block px-4 py-2 text-sm text-gray-600 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors min-h-[40px] flex items-center"
                                                    >
                                                        Sobre Nós
                                                    </Link>
                                                    <Link
                                                        to="/noticias"
                                                        onClick={handleLinkClick}
                                                        className="block px-4 py-2 text-sm text-gray-600 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors min-h-[40px] flex items-center"
                                                    >
                                                        Blog / Notícias
                                                    </Link>
                                                    <Link
                                                        to="/contato"
                                                        onClick={handleLinkClick}
                                                        className="block px-4 py-2 text-sm text-gray-600 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-colors min-h-[40px] flex items-center"
                                                    >
                                                        Contato
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Ajuda / FAQ */}
                                <Link
                                    to="/ajuda"
                                    onClick={handleLinkClick}
                                    className="flex items-center gap-3 px-4 py-3 text-base font-semibold text-gray-700 hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all min-h-[48px] group"
                                >
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Ajuda / FAQ
                                </Link>
                            </nav>

                            {/* Links de Conta (se autenticado) */}
                            {user && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Minha Conta</p>
                                    <div className="space-y-1">
                                        {user.type === 'client' ? (
                                            <>
                                                <Link to="/perfil/cliente" onClick={handleLinkClick} className="block px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg min-h-[40px] flex items-center">
                                                    Meu Perfil
                                                </Link>
                                                <Link to="/favoritos" onClick={handleLinkClick} className="block px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg min-h-[40px] flex items-center">
                                                    Favoritos
                                                </Link>
                                                <Link to="/minhas-mensagens" onClick={handleLinkClick} className="block px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg min-h-[40px] flex items-center">
                                                    Mensagens
                                                </Link>
                                                <Link to="/perfil/pedidos" onClick={handleLinkClick} className="block px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg min-h-[40px] flex items-center">
                                                    Meus Pedidos
                                                </Link>
                                            </>
                                        ) : (
                                            <Link to={user.companySlug ? `/dashboard/empresa/${user.companySlug}` : "/empresa/cadastro"} onClick={handleLinkClick} className="block px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg min-h-[40px] flex items-center">
                                                Dashboard
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left block px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg mt-2 min-h-[40px] flex items-center"
                                        >
                                            Sair
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RODAPÉ: CTAs (quando NÃO autenticado) - Sticky */}
                        {!user && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3 sticky bottom-0">
                                <Link
                                    to="/login/cliente"
                                    onClick={handleLinkClick}
                                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-brand-primary text-brand-primary rounded-xl font-bold hover:bg-brand-primary hover:text-white transition-all min-h-[48px] shadow-sm"
                                >
                                    Entrar
                                </Link>
                                <Link
                                    to="/cadastro/cliente"
                                    onClick={handleLinkClick}
                                    className="flex items-center justify-center w-full px-4 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#FF5722] transition-all min-h-[48px] shadow-md hover:shadow-lg"
                                >
                                    Cadastrar
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MobileMenu;
