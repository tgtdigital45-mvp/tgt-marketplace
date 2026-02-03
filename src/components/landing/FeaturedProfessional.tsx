import React from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import { Star, CheckCircle2, ArrowRight } from 'lucide-react';
import OptimizedImage from '../ui/OptimizedImage';

const FeaturedProfessional: React.FC = () => {
    return (
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-6">
                <div className="bg-white rounded-[40px] overflow-hidden border border-slate-200 shadow-soft flex flex-col lg:flex-row items-stretch">
                    {/* Image Side */}
                    <div className="lg:w-1/2 relative min-h-[400px]">
                        <OptimizedImage
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200"
                            alt="Professional of the Month"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute top-8 left-8">
                            <span className="bg-primary-600 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl">
                                Destaque da Semana
                            </span>
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="lg:w-1/2 p-10 md:p-16 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="flex text-amber-400">
                                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} fill="currentColor" />)}
                            </div>
                            <span className="text-slate-400 text-sm font-bold">(150+ avaliações)</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
                            Excelência em <span className="text-primary-600">Consultoria Estratégica</span>
                        </h2>

                        <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                            Conheça como a TGT ajuda empresas a escalarem através de conexões com os mentores mais influentes do mercado. Nossa metodologia garante resultados tangíveis em menos de 90 dias.
                        </p>

                        <ul className="space-y-4 mb-10">
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <CheckCircle2 size={20} className="text-primary-600" />
                                Auditoria completa processual
                            </li>
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <CheckCircle2 size={20} className="text-primary-600" />
                                Plano de ação personalizado
                            </li>
                            <li className="flex items-center gap-3 text-slate-700 font-medium">
                                <CheckCircle2 size={20} className="text-primary-600" />
                                Acompanhamento semanal dedicado
                            </li>
                        </ul>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Button size="lg" className="h-14 px-10 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform font-bold">
                                Agendar Consultoria <ArrowRight size={20} className="ml-2" />
                            </Button>
                            <div className="flex items-center gap-3 ml-2">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <Star size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">4.9/5</p>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Média Geral</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturedProfessional;
