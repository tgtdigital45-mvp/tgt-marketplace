import React from 'react';
import { TestimonialsColumn } from '../ui/TestimonialsColumn';
import { motion } from 'framer-motion';

interface Testimonial {
    text: string;
    image: string;
    name: string;
    role: string;
}

const testimonials: Testimonial[] = [
    {
        text: "A TGT revolucionou a forma como encontramos parceiros de engenharia em Cascavel. A plataforma é intuitiva e a verificação de profissionais nos traz muita segurança.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
        name: "Ricardo Fontes",
        role: "Diretor de RailCorp",
    },
    {
        text: "Excelente plataforma! Consegui fechar uma consultoria tributária em menos de 48 horas. Recomendo para todos os empreendedores da região.",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
        name: "Amanda Rezende",
        role: "CEO da TechStart",
    },
    {
        text: "Implementar a TGT foi rápido e eficiente. A interface personalizável e amigável tornou o treinamento da equipe muito fácil.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
        name: "Bilal Ahmed",
        role: "Gerente de TI",
    },
    {
        text: "A integração perfeita desta plataforma melhorou nossas operações comerciais e eficiência. Altamente recomendado pela interface intuitiva.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
        name: "Omar Raza",
        role: "CEO",
    },
    {
        text: "Seus recursos robustos e suporte rápido transformaram nosso fluxo de trabalho, tornando-nos significativamente mais eficientes.",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
        name: "Zainab Hussain",
        role: "Gerente de Projetos",
    },
    {
        text: "A implementação tranquila superou as expectativas. Simplificou processos, melhorando o desempenho geral dos negócios.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
        name: "Aliza Khan",
        role: "Analista de Negócios",
    },
    {
        text: "Nossas funções de negócios melhoraram com um design amigável e feedback positivo dos clientes.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        name: "Farhan Siddiqui",
        role: "Diretor de Marketing",
    },
    {
        text: "Eles entregaram uma solução que superou as expectativas, entendendo nossas necessidades e aprimorando nossas operações.",
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop",
        name: "Sana Sheikh",
        role: "Gerente de Vendas",
    },
    {
        text: "Usando a TGT, nossa presença online e conversões melhoraram significativamente, impulsionando o desempenho dos negócios.",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
        name: "Hassan Ali",
        role: "Gerente de E-commerce",
    },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const TestimonialsSection: React.FC = () => {
    return (
        <section className="bg-slate-50 my-20 relative py-20">
            <div className="container z-10 mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
                >
                    <div className="flex justify-center">
                        <div className="border border-primary-200 bg-primary-50 text-primary-700 py-2 px-5 rounded-full text-xs font-bold uppercase tracking-widest">
                            Feedback
                        </div>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mt-6 text-slate-900 text-center">
                        O que nossos <span className="text-primary-600">Clientes</span> dizem
                    </h2>
                    <p className="text-center mt-5 text-slate-600 leading-relaxed">
                        Veja o que nossos clientes têm a dizer sobre nós.
                    </p>
                </motion.div>

                <div className="flex justify-center gap-6 mt-14 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
                    <TestimonialsColumn testimonials={firstColumn} duration={15} />
                    <TestimonialsColumn
                        testimonials={secondColumn}
                        className="hidden md:block"
                        duration={19}
                    />
                    <TestimonialsColumn
                        testimonials={thirdColumn}
                        className="hidden lg:block"
                        duration={17}
                    />
                </div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
