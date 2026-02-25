import React from 'react';
import { motion } from 'framer-motion';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const professionals = [
  { name: 'Dra. Ana Silva', role: 'Saude & Estetica', img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=400' },
  { name: 'Marcos Oliveira', role: 'Construcao Civil', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400' },
  { name: 'Juliana Santos', role: 'Design de Interiores', img: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=400' },
  { name: 'Roberto Mendes', role: 'Consultoria Financeira', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400' },
  { name: 'Lucas Ferreira', role: 'Tecnologia', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400' },
  { name: 'Bia Carvalho', role: 'Eventos', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400' },
];

const ProfessionalGallery: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-slate-50 overflow-hidden">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-14 lg:mb-16 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="text-primary-600 font-bold tracking-[0.2em] text-[10px] sm:text-xs uppercase mb-3 sm:mb-4 block">
              Nossa Rede
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
              Profissionais com avaliacoes <span className="text-slate-400">reais e verificadas</span>
            </h2>
            <p className="mt-3 sm:mt-4 text-slate-500 text-sm sm:text-base max-w-lg">
              Cada prestador foi aprovado pela nossa curadoria. Veja portfolios, leia avaliacoes e contrate com confianca.
            </p>
          </motion.div>

          <Link
            to="/empresas"
            className="group flex items-center gap-2 text-slate-900 font-bold hover:text-primary-600 transition-colors text-sm sm:text-base flex-shrink-0"
          >
            Ver todos <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {professionals.map((pro, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: index * 0.07, duration: 0.4 }}
              whileHover={{ y: -8 }}
              className="group relative aspect-[3/4] rounded-xl sm:rounded-2xl lg:rounded-[20px] overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              <OptimizedImage
                src={pro.img}
                alt={pro.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white font-bold text-xs sm:text-sm tracking-tight mb-0.5">{pro.name}</p>
                <p className="text-primary-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">{pro.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProfessionalGallery;
