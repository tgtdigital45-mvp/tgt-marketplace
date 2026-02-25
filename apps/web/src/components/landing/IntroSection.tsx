import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Button from '@/components/ui/Button';
import { Link } from 'react-router-dom';

const IntroSection: React.FC = () => {
    return (
        <section className="py-12 sm:py-16 lg:py-24 bg-white overflow-hidden relative">
            <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16 xl:gap-24">
                    {/* Image Column */}
                    <div className="w-full lg:w-1/2 relative">
                        <div className="relative z-10 rounded-2xl sm:rounded-3xl lg:rounded-[48px] overflow-hidden shadow-2xl border-4 sm:border-8 border-slate-50">
                            <OptimizedImage
                                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200"
                                alt="Our Mission"
                                className="w-full h-auto object-cover aspect-[4/3] lg:aspect-auto"
                            />
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute -bottom-6 -right-2 sm:-bottom-8 sm:-right-6 lg:-bottom-10 lg:-right-10 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl lg:rounded-[32px] shadow-2xl border border-slate-100 hidden sm:block z-20">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                                    10+
                                </div>
                                <div className="pr-2 sm:pr-4">
                                    <p className="font-bold text-slate-900 leading-none text-sm sm:text-base">Anos de Mercado</p>
                                    <p className="text-slate-400 text-[10px] sm:text-xs mt-1">Liderando Conexoes</p>
                                </div>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute -top-10 -left-10 w-32 sm:w-40 h-32 sm:h-40 bg-primary-600/5 rounded-full blur-[40px] sm:blur-[60px]" />
                    </div>

                    {/* Content Column */}
                    <div className="w-full lg:w-1/2">
                        <span className="text-primary-600 font-bold tracking-widest text-[10px] uppercase mb-4 sm:mb-6 block">Nossa Essencia</span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 mb-5 sm:mb-8 tracking-tight leading-tight">
                            Fortalecendo o <span className="text-slate-400">Ecossistema</span> de Negocios Locais
                        </h2>

                        <p className="text-base sm:text-lg text-slate-500 mb-6 sm:mb-10 leading-relaxed">
                            A CONTRATTO nasceu da necessidade de conectar profissionais qualificados a clientes que buscam excelencia. Somos mais que um marketplace, somos o motor de crescimento para a economia da sua regiao.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
                            {[
                                { title: 'Curadoria Rigorosa', desc: 'Apenas empresas com reputacao comprovada.' },
                                { title: 'Seguranca de Dados', desc: 'Protecao total em todas as transacoes.' },
                                { title: 'Foco no Resultado', desc: 'Facilitamos parcerias que geram valor real.' },
                                { title: 'Suporte Local', desc: 'Atendimento humanizado e proximo de voce.' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <CheckCircle2 size={20} className="text-primary-600 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h4>
                                        <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link to="/sobre">
                            <Button variant="outline" className="h-12 sm:h-14 px-6 sm:px-10 rounded-xl sm:rounded-2xl border-2 font-bold hover:bg-slate-50">
                                Conhecer nossa Historia <ArrowRight size={18} className="ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default IntroSection;
