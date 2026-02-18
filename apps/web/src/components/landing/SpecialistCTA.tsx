import React from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { ArrowRight, Sparkles } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';

const SpecialistCTA: React.FC = () => {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="bg-primary-600 rounded-[48px] p-10 md:p-20 relative overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center gap-12">
                    <div className="lg:w-3/5 relative z-10 text-white">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                                <Sparkles size={20} />
                            </div>
                            <span className="text-primary-100 font-bold tracking-widest text-[10px] uppercase">Seja um Parceiro TGT</span>
                        </div>

                        <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight leading-tight">
                            Compartilhe sua <span className="text-primary-200">Expertise</span> e impulsione suas vendas
                        </h2>

                        <p className="text-xl text-primary-100 mb-12 max-w-xl leading-relaxed">
                            Junte-se a mais de 5.000 profissionais que estão transformando o comércio local através da TGT Contratto. Escala, visibilidade e tecnologia a seu favor.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Button className="bg-white text-primary-600 border-none h-16 px-10 rounded-2xl font-black text-lg hover:bg-primary-50 hover:scale-[1.05] transition-all shadow-xl">
                                Cadastrar minha Empresa <ArrowRight size={22} className="ml-2" />
                            </Button>
                            <div className="text-primary-100 font-medium text-sm">
                                Cadastro gratuito e verificação em até 24h.
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-2/5 relative z-10">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-white/10 rounded-[40px] blur-2xl" />
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-[40px] border border-white/20 shadow-2xl">
                                <OptimizedImage
                                    src="https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=800"
                                    alt="Join as Professional"
                                    className="rounded-[32px] w-full h-auto object-cover"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Background Decor */}
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-[80px]" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-slate-900/20 rounded-full blur-[60px]" />
                </div>
            </div>
        </section>
    );
};

export default SpecialistCTA;
