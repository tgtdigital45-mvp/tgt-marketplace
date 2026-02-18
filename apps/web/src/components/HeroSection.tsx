import React from 'react';
import { motion } from 'framer-motion';
import QuickSearch from '@/components/QuickSearch';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { ShieldCheck, Star, Users } from 'lucide-react';

const HeroSection: React.FC = () => {
    return (
        <section className="relative min-h-[85vh] flex items-center pt-24 overflow-hidden bg-slate-900">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <OptimizedImage
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000"
                    alt="Corporate Hub"
                    className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block py-2 px-6 rounded-full bg-brand-accent/10 text-brand-accent text-[10px] font-bold uppercase tracking-[0.2em] mb-8 border border-brand-accent/20 backdrop-blur-sm">
                            Marketplace B2B de Serviços
                        </span>

                        <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-8 tracking-tight">
                            Contrate agências verificadas com a <span className="text-brand-accent italic">segurança</span> de um clique.
                        </h1>

                        <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
                            Esqueça orçamentos intermináveis. Acesse serviços produtizados de Marketing, TI e Consultoria com escopo definido, preço fixo e garantia de entrega.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="bg-white p-2 rounded-[32px] shadow-2xl max-w-4xl mx-auto relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-primary-400 rounded-[34px] opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
                        <div className="relative z-10">
                            <QuickSearch />
                        </div>
                    </motion.div>

                    {/* Quick Trust Badges */}
                    <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[24px] flex flex-col items-center gap-3"
                        >
                            <ShieldCheck className="text-primary-500" size={24} />
                            <div className="text-center">
                                <p className="text-white font-bold text-sm tracking-tight">100% Verificado</p>
                                <p className="text-slate-400 text-[10px] uppercase font-medium">Auditoria Rigorosa</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[24px] flex flex-col items-center gap-3"
                        >
                            <Users className="text-primary-500" size={24} />
                            <div className="text-center">
                                <p className="text-white font-bold text-sm tracking-tight">5k+ Empresas</p>
                                <p className="text-slate-400 text-[10px] uppercase font-medium">Rede em Expansão</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[24px] flex flex-col items-center gap-3"
                        >
                            <Star className="text-primary-500" size={24} />
                            <div className="text-center">
                                <p className="text-white font-bold text-sm tracking-tight">4.9/5 Rating</p>
                                <p className="text-slate-400 text-[10px] uppercase font-medium">Satisfação Total</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[24px] flex flex-col items-center gap-3"
                        >
                            <div className="font-bold text-primary-500 text-xl">24/7</div>
                            <div className="text-center">
                                <p className="text-white font-bold text-sm tracking-tight">Suporte Ativo</p>
                                <p className="text-slate-400 text-[10px] uppercase font-medium">Sempre Disponível</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-900 to-transparent z-10" />
        </section>
    );
};

export default HeroSection;
