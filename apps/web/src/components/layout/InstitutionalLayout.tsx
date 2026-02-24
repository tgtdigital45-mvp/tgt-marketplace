import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const InstitutionalLayout: React.FC = () => {
    const location = useLocation();

    const tabs = [
        { name: 'Sobre a CONTRATTO', path: '/institucional/sobre' },
        { name: 'Notícias & Mídia', path: '/institucional/noticias' },
        { name: 'Blog do Especialista', path: '/institucional/blog' },
    ];

    return (
        <div className="bg-slate-50 min-h-full font-sans text-slate-900 selection:bg-brand-primary-100 selection:text-brand-primary-900 pb-20">
            {/* Spacing for global fixed header + extra margin */}
            <div className="pt-32">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">

                    {/* Institutional Header */}
                    <header className="mb-12 text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4"
                        >
                            Institucional
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-slate-500 max-w-2xl mx-auto"
                        >
                            Conheça nossa missão, acompanhe nossas novidades e explore nosso conhecimento.
                        </motion.p>
                    </header>

                    {/* Navigation Tabs */}
                    <nav className="flex justify-center mb-16 border-b border-gray-200">
                        <div className="flex space-x-8">
                            {tabs.map((tab) => {
                                const isActive = location.pathname.startsWith(tab.path);
                                return (
                                    <Link
                                        key={tab.path}
                                        to={tab.path}
                                        className={`pb-4 px-2 text-sm font-medium transition-colors relative ${isActive
                                            ? 'text-brand-primary'
                                            : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        {tab.name}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Page Content */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 min-h-[400px]">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstitutionalLayout;
