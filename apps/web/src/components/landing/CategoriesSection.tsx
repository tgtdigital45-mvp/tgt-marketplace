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
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
  { name: 'Contabilidade', icon: Calculator, color: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100', count: '124 empresas' },
  { name: 'Engenharia', icon: HardHat, color: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100', count: '89 empresas' },
  { name: 'Beleza e Estetica', icon: Scissors, color: 'bg-pink-50 text-pink-600 group-hover:bg-pink-100', count: '210 empresas' },
  { name: 'Tecnologia', icon: Laptop, color: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100', count: '156 empresas' },
  { name: 'Fotografia', icon: Camera, color: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100', count: '45 empresas' },
  { name: 'Saude', icon: HeartPulse, color: 'bg-red-50 text-red-600 group-hover:bg-red-100', count: '112 empresas' },
  { name: 'Eventos', icon: Music, color: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100', count: '78 empresas' },
  { name: 'Varejo', icon: ShoppingBag, color: 'bg-slate-100 text-slate-600 group-hover:bg-slate-200', count: '340 empresas' },
];

const CategoriesSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-slate-50">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-14 lg:mb-16 gap-4 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="text-primary-600 font-bold tracking-[0.2em] text-[10px] sm:text-xs uppercase mb-3 sm:mb-4 block">
              Especialidades
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              Explore por <span className="text-slate-400">Categoria</span>
            </h2>
            <p className="mt-3 sm:mt-4 text-slate-500 text-sm sm:text-base max-w-lg">
              De contabilidade a tecnologia, encontre o profissional ideal para cada necessidade do seu negocio.
            </p>
          </motion.div>
          <Link
            to="/empresas"
            className="group flex items-center gap-2 text-slate-900 font-bold hover:text-primary-600 transition-colors text-sm sm:text-base flex-shrink-0"
          >
            Ver todas <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {categories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              whileHover={{ y: -6 }}
              className="p-5 sm:p-6 lg:p-8 bg-white rounded-2xl sm:rounded-3xl border border-slate-100 hover:border-slate-200 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 group cursor-pointer"
            >
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 ${category.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 lg:mb-6 transition-all duration-300`}
              >
                <category.icon size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 mb-1 tracking-tight">
                {category.name}
              </h3>
              <p className="text-slate-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider">
                {category.count}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
