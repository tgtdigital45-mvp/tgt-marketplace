import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Button from '@/components/ui/Button';
import { Link } from 'react-router-dom';

const IntroSection: React.FC = () => {
    return (
        <section className="py-24 bg-white overflow-hidden relative">
            <div className="container mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    {/* Image Column */}
                    <div className="lg:w-1/2 relative">
                        <div className="relative z-10 rounded-[48px] overflow-hidden shadow-2xl border-8 border-slate-50">
                            <OptimizedImage
                                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200"
                                alt="Our Mission"
                                className="w-full h-auto object-cover"
                            />
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute -bottom-10 -right-10 bg-white p-6 rounded-[32px] shadow-2xl border border-slate-100 hidden md:block z-20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                                    10+
                                </div>
                                <div className="pr-4">
                                    <p className="font-bold text-slate-900 leading-none">Anos de Mercado</p>
                                    <p className="text-slate-400 text-xs mt-1">Liderando Conexões</p>
                                </div>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-600/5 rounded-full blur-[60px]" />
                    </div>

                    {/* Content Column */}
                    <div className="lg:w-1/2">
                        <span className="text-primary-600 font-bold tracking-widest text-[10px] uppercase mb-6 block">Nossa Essência</span>
                        <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-8 tracking-tight leading-tight">
                            Fortalecendo o <span className="text-slate-400">Ecossistema</span> de Negócios Locais
                        </h2>

                        <p className="text-lg text-slate-500 mb-10 leading-relaxed">
                            A TGT Contratto nasceu da necessidade de conectar profissionais qualificados a clientes que buscam excelência. Somos mais que um marketplace, somos o motor de crescimento para a economia da sua região.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6 mb-12">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 size={24} className="text-primary-600 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm mb-1">Curadoria Rigorosa</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed">Apenas empresas com reputação comprovada.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 size={24} className="text-primary-600 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm mb-1">Segurança de Dados</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed">Proteção total em todas as transações.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 size={24} className="text-primary-600 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm mb-1">Foco no Resultado</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed">Facilitamos parcerias que geram valor real.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 size={24} className="text-primary-600 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm mb-1">Suporte Local</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed">Atendimento humanizado e próximo de você.</p>
                                </div>
                            </div>
                        </div>

                        <Link to="/sobre">
                            <Button variant="outline" className="h-14 px-10 rounded-2xl border-2 font-bold hover:bg-slate-50">
                                Conhecer nossa História <ArrowRight size={20} className="ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default IntroSection;
