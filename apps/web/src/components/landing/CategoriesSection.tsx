import React from 'react';
import { motion } from 'framer-motion';
import {
    Calculator,
    HardHat,
    Scissors,
    Laptop,
    Camera,
    HeartPulse,
    Music,
    ShoppingBag,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
    { name: "Contabilidade", icon: Calculator, color: "bg-blue-50 text-blue-600", count: "124 empresas" },
    { name: "Engenharia", icon: HardHat, color: "bg-orange-50 text-orange-600", count: "89 empresas" },
    { name: "Beleza e Estética", icon: Scissors, color: "bg-pink-50 text-pink-600", count: "210 empresas" },
    { name: "Tecnologia", icon: Laptop, color: "bg-indigo-50 text-indigo-600", count: "156 empresas" },
    { name: "Fotografia", icon: Camera, color: "bg-purple-50 text-purple-600", count: "45 empresas" },
    { name: "Saúde", icon: HeartPulse, color: "bg-red-50 text-red-600", count: "112 empresas" },
    { name: "Eventos", icon: Music, color: "bg-emerald-50 text-emerald-600", count: "78 empresas" },
    { name: "Varejo", icon: ShoppingBag, color: "bg-slate-50 text-slate-600", count: "340 empresas" },
];

const CategoriesSection: React.FC = () => {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="max-w-2xl">
                        <span className="text-primary-600 font-bold tracking-widest text-[10px] uppercase mb-4 block">Especialidades</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                            Explore por <span className="text-slate-400">Categorias</span>
                        </h2>
                    </div>
                    <Link to="/empresas" className="group flex items-center gap-2 text-slate-900 font-bold hover:text-primary-600 transition-colors">
                        Ver todas <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((category, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -5 }}
                            className="p-8 bg-slate-50 rounded-[32px] border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-soft transition-all duration-300 group cursor-pointer"
                        >
                            <div className={`w-14 h-14 ${category.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                <category.icon size={28} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">{category.name}</h3>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{category.count}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategoriesSection;
