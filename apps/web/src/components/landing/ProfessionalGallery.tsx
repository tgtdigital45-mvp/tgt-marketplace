import React from 'react';
import { motion } from 'framer-motion';
import OptimizedImage from '@/components/ui/OptimizedImage';

const professionals = [
    { name: "Dra. Ana Silva", role: "Saúde & Estética", img: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=400" },
    { name: "Marcos Oliveira", role: "Construção Civil", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400" },
    { name: "Juliana Santos", role: "Design de Interiores", img: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=400" },
    { name: "Roberto Mendes", role: "Consultoria Financeira", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400" },
    { name: "Lucas Ferreira", role: "Tecnologia", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400" },
    { name: "Bia Carvalho", role: "Eventos", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400" },
];

const ProfessionalGallery: React.FC = () => {
    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="text-center mb-20 max-w-3xl mx-auto">
                    <span className="text-primary-600 font-bold tracking-widest text-[10px] uppercase mb-4 block">Nossa Rede</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                        Especialistas dedicados ao seu <span className="text-slate-400">Sucesso</span>
                    </h2>
                    <p className="mt-6 text-lg text-slate-500">
                        Conectamos você aos talentos mais bem avaliados do mercado local, garantindo processos transparentes e resultados excepcionais.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                    {professionals.map((pro, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -10 }}
                            className="group relative aspect-[3/4] rounded-[24px] overflow-hidden shadow-lg"
                        >
                            <OptimizedImage
                                src={pro.img}
                                alt={pro.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
                            <div className="absolute bottom-6 left-6 right-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <p className="text-white font-bold text-sm tracking-tight mb-1">{pro.name}</p>
                                <p className="text-primary-400 text-[10px] font-bold uppercase tracking-widest">{pro.role}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProfessionalGallery;
