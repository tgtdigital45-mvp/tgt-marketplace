import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import { useCompany } from '../../../contexts/CompanyContext';
import OptimizedImage from '../../ui/OptimizedImage';

interface MobileSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileSheet: React.FC<MobileSheetProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const { company } = useCompany();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        onClose();
        navigate('/');
    };

    const handleLinkClick = () => {
        onClose();
    };

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        aria-hidden="true"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative w-[85%] max-w-sm h-full bg-white shadow-2xl flex flex-col overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <Link to="/" onClick={handleLinkClick} className="flex items-center gap-2">
                                <div className="bg-brand-primary/10 p-2 rounded-xl">
                                    <span className="text-brand-primary font-bold text-lg">TGT</span>
                                </div>
                                <span className="text-gray-800 font-bold text-lg">Contratto</span>
                            </Link>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
                                aria-label="Close menu"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 px-4 py-6 bg-white">
                            {/* User Profile Card */}
                            {user && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-6">
                                    <OptimizedImage
                                        src={(user.type === 'company' && company?.logo_url) || user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
                                        alt={user.name}
                                        className="h-10 w-10 rounded-full"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {(user.type === 'company' && company?.company_name) || user.name}
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize">{user.type === 'client' ? 'Cliente' : 'Empresa'}</p>
                                    </div>
                                </div>
                            )}

                            <nav className="space-y-1">
                                <Link
                                    to="/servicos"
                                    onClick={handleLinkClick}
                                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-brand-primary/5 hover:text-brand-primary rounded-xl transition-colors"
                                >
                                    Serviços
                                </Link>
                                <Link
                                    to="/empresas"
                                    onClick={handleLinkClick}
                                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-brand-primary/5 hover:text-brand-primary rounded-xl transition-colors"
                                >
                                    Empresas
                                </Link>
                                <Link
                                    to="/para-empresas"
                                    onClick={handleLinkClick}
                                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-brand-primary/5 hover:text-brand-primary rounded-xl transition-colors"
                                >
                                    Para Empresas
                                </Link>

                                <div className="my-2 border-t border-gray-100"></div>

                                {/* Additional links can go here */}
                                <Link
                                    to="/ajuda"
                                    onClick={handleLinkClick}
                                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-brand-primary/5 hover:text-brand-primary rounded-xl transition-colors"
                                >
                                    Ajuda / FAQ
                                </Link>
                            </nav>

                            {/* Account Links */}
                            {user && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Conta</p>
                                    <div className="space-y-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                        >
                                            Sair
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions (unauthenticated) */}
                        {!user && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50 sticky bottom-0 space-y-3">
                                <Link
                                    to="/login/cliente"
                                    onClick={handleLinkClick}
                                    className="flex items-center justify-center w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-white hover:border-gray-300 transition-all shadow-sm"
                                >
                                    Entrar
                                </Link>
                                <Link
                                    to="/empresa/cadastro"
                                    onClick={handleLinkClick}
                                    className="flex items-center justify-center w-full px-4 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all shadow-md"
                                >
                                    Começar Grátis
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MobileSheet;
