import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const SolutionsGrid: React.FC = () => {
    return (
        <section className="py-24 bg-slate-50/50">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                        Soluções para todas as necessidades
                    </h2>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                        Explore nosso ecossistema de serviços e encontre especialistas prontos para ajudar.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {/* Card 1 - Large */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="md:col-span-2 bg-white rounded-3xl p-10 shadow-soft border border-slate-200 flex flex-col justify-between min-h-[300px] relative overflow-hidden group transition-all duration-300"
                    >
                        <div className="relative z-10">
                            <span className="text-primary-600 font-bold tracking-wider text-sm uppercase mb-2 block">Destaque</span>
                            <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Reformas & Construção</h3>
                            <p className="text-slate-500 max-w-md">Encontre pedreiros, eletricistas e arquitetos avaliados para sua obra.</p>
                        </div>
                        <div className="mt-8">
                            <button className="flex items-center gap-2 text-primary-600 font-bold group-hover:gap-3 transition-all">
                                Ver categoria <ArrowRight size={20} />
                            </button>
                        </div>
                        <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 bg-slate-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />
                    </motion.div>

                    {/* Card 2 */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-slate-900 text-white rounded-3xl p-10 shadow-soft flex flex-col justify-between min-h-[300px] relative overflow-hidden group transition-all duration-300"
                    >
                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-4 tracking-tight">Tecnologia</h3>
                            <p className="text-slate-300">Devs, designers e suporte técnico para sua empresa.</p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px]" />
                        <div className="mt-8">
                            <button className="flex items-center gap-2 text-white font-bold group-hover:gap-3 transition-all">
                                Buscar <ArrowRight size={20} />
                            </button>
                        </div>
                    </motion.div>

                    {/* Card 3 */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-3xl p-10 shadow-soft border border-slate-200 flex flex-col justify-between min-h-[300px] md:min-h-[250px] group transition-all duration-300"
                    >
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                                <span className="text-2xl">💰</span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Finanças</h3>
                            <p className="text-slate-500 text-sm">Contadores e consultores.</p>
                        </div>
                    </motion.div>

                    {/* Card 4 - Large Wide */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="md:col-span-2 bg-white rounded-3xl p-10 shadow-soft border border-slate-200 flex flex-row items-center justify-between min-h-[250px] group relative overflow-hidden transition-all duration-300"
                    >
                        <div className="relative z-10 max-w-lg">
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Eventos & Festas</h3>
                            <p className="text-slate-500 mb-6 font-medium">Buffets, decoração e fotografia para tornar seu momento inesquecível.</p>
                            <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-colors">
                                Explorar Serviços
                            </button>
                        </div>
                        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary-400/10 to-transparent" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default SolutionsGrid;
