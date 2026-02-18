import React from 'react';
import { motion } from 'framer-motion';
import { Search, Heart, Briefcase, Zap } from 'lucide-react';

const matches = [
    { title: "Gestão Financeira", icon: <Briefcase size={20} />, count: "45 serviços", color: "text-blue-600 bg-blue-50" },
    { title: "Saúde Integrativa", icon: <Heart size={20} />, count: "32 serviços", color: "text-rose-600 bg-rose-50" },
    { title: "Soluções Digitais", icon: <Zap size={20} />, count: "67 serviços", color: "text-amber-600 bg-amber-50" },
    { title: "Suporte Técnico", icon: <Search size={20} />, count: "18 serviços", color: "text-indigo-600 bg-indigo-50" },
];

const MatchedInterests: React.FC = () => {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <span className="text-primary-600 font-bold tracking-widest text-[10px] uppercase mb-4 block">Personalização</span>
                    <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
                        Encontre o Match ideal para sua <span className="text-primary-600">Necessidade</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {matches.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="p-6 bg-white border border-slate-100 rounded-[28px] shadow-soft hover:shadow-lg hover:border-primary-100 transition-all flex items-center gap-5 cursor-pointer group"
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                                {item.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm tracking-tight">{item.title}</h3>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{item.count}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default MatchedInterests;
