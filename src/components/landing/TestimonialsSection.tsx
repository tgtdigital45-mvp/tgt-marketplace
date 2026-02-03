import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import OptimizedImage from '../ui/OptimizedImage';

const testimonials = [
    {
        text: "A TGT revolucionou a forma como encontramos parceiros de engenharia em Cascavel. A plataforma é intuitiva e a verificação de profissionais nos traz muita segurança.",
        author: "Ricardo Fontes",
        role: "Diretor da BuildCorp",
        img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
    },
    {
        text: "Excelente plataforma! Consegui fechar uma consultoria tributária em menos de 48 horas. Recomendo para todos os empreendedores da região.",
        author: "Amanda Rezende",
        role: "CEO da TechStart",
        img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"
    }
];

const TestimonialsSection: React.FC = () => {
    return (
        <section className="py-24 bg-slate-900 overflow-hidden relative">
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <span className="text-primary-400 font-bold tracking-widest text-[10px] uppercase mb-4 block">Feedback</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        O que nossos <span className="text-primary-400">Clientes</span> dizem
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {testimonials.map((t, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-slate-800/40 backdrop-blur-md p-10 md:p-14 rounded-[40px] border border-slate-700 relative group hover:bg-slate-800/60 transition-colors"
                        >
                            <Quote className="absolute top-10 right-10 text-primary-500/20 w-16 h-16" />
                            <p className="text-xl md:text-2xl text-slate-200 leading-relaxed mb-10 relative z-10 font-medium">
                                "{t.text}"
                            </p>
                            <div className="flex items-center gap-4 border-t border-slate-700 pt-8">
                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary-500 shadow-xl">
                                    <OptimizedImage src={t.img} alt={t.author} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-lg">{t.author}</h4>
                                    <p className="text-primary-400 text-sm font-medium">{t.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Background patterns */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] left-[-5%] w-[40vw] h-[40vw] bg-primary-600 rounded-full blur-[120px]" />
                <div className="absolute bottom-[0%] right-[-10%] w-[50vw] h-[50vw] bg-slate-800 rounded-full blur-[100px]" />
            </div>
        </section>
    );
};

export default TestimonialsSection;
