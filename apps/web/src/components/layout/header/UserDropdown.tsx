import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

const UserDropdown: React.FC = () => {
    const { user, logout } = useAuth();
    const { company } = useCompany();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(dropdownRef, () => setIsOpen(false));

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!user) return null;

    const textColor = 'text-gray-700 group-hover:text-gray-900';
    const iconColor = 'text-gray-400';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 focus:outline-none group min-h-[44px] min-w-[44px]"
                aria-label="Menu do usuário"
            >
                <OptimizedImage
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-brand-primary/20 transition-all shadow-sm"
                    src={company?.logo_url || user.avatar || `https://i.pravatar.cc/150?u=${user.id}`}
                    alt={company?.company_name || user.name}
                />
                <span className={`text-sm font-medium transition-colors max-w-[100px] truncate ${textColor}`}>
                    {company?.company_name || user.name.split(' ')[0]}
                </span>
                <svg className={`h-4 w-4 transition-transform duration-200 ${iconColor} ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black/5 py-2 z-50 pointer-events-auto"
                    >
                        <div className="px-4 py-2 border-b border-gray-50">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Minha Conta</p>
                        </div>

                        {user.type === 'client' && (
                            <>
                                <Link to="/perfil/cliente" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    Meu Perfil
                                </Link>
                                <Link to="/favoritos" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    Favoritos
                                </Link>
                                <Link to="/perfil/cliente" state={{ activeTab: 'messages' }} onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    Mensagens
                                </Link>
                                <Link to="/perfil/pedidos" onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    Meus Pedidos
                                </Link>
                            </>
                        )}
                        {user.type === 'company' && (
                            <>
                                <Link to={(company?.slug || user.companySlug) ? `/dashboard/empresa/${company?.slug || user.companySlug}` : "/dashboard"} onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    Dashboard
                                </Link>
                                <Link to={(company?.slug || user.companySlug) ? `/empresa/${company?.slug || user.companySlug}` : "/empresa/meu-negocio"} onClick={() => setIsOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
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
    );
};

export default UserDropdown;
