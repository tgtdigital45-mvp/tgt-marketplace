import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

const LoginDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(dropdownRef, () => setIsOpen(false));

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className="min-h-[44px] flex items-center gap-2 transition-all duration-300 border-gray-200 text-gray-700 hover:bg-gray-50 bg-white"
            >
                Entrar
                <svg className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} text-gray-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-slate-200 py-2 z-50 pointer-events-auto"
                    >
                        <div className="px-4 py-2 border-b border-slate-50">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Como você deseja entrar?</p>
                        </div>
                        <Link
                            to="/login/cliente"
                            className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="font-semibold block text-primary-600">Sou Cliente</span>
                            <span className="text-xs text-slate-500">Busco serviços e produtos</span>
                        </Link>
                        <Link
                            to="/login/empresa"
                            className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-50"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="font-semibold block text-primary-600">Sou Profissional</span>
                            <span className="text-xs text-slate-500">Quero oferecer meus serviços</span>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoginDropdown;
