import React from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { Star, CheckCircle2, ArrowRight } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Link } from 'react-router-dom';

const FeaturedProfessional: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-white">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="bg-slate-50 rounded-2xl sm:rounded-3xl lg:rounded-[40px] overflow-hidden border border-slate-200 flex flex-col lg:flex-row items-stretch"
        >
          {/* Image Side */}
          <div className="w-full lg:w-1/2 relative min-h-[260px] sm:min-h-[350px] lg:min-h-[450px]">
            <OptimizedImage
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200"
              alt="Profissional destaque da semana"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-50/20 hidden lg:block" />
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
              <span className="bg-primary-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-xl">
                Destaque da Semana
              </span>
            </div>
          </div>

          {/* Content Side */}
          <div className="w-full lg:w-1/2 p-6 sm:p-10 md:p-12 lg:p-14 xl:p-16 flex flex-col justify-center bg-white">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={16} fill="currentColor" className="sm:w-[18px] sm:h-[18px]" />
                ))}
              </div>
              <span className="text-slate-400 text-xs sm:text-sm font-bold">(150+ avaliacoes)</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4 sm:mb-5 tracking-tight leading-tight">
              Resultados reais em{' '}
              <span className="text-primary-600">Consultoria Estrategica</span>
            </h2>

            <p className="text-sm sm:text-base lg:text-lg text-slate-500 mb-6 sm:mb-8 leading-relaxed">
              Veja como empresas parceiras da CONTRATTO escalam resultados atraves de conexoes com especialistas verificados. Metodologia propria com retorno mensuravel em ate 90 dias.
            </p>

            <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
              {[
                'Diagnostico completo do seu negocio',
                'Plano de acao personalizado e mensuravel',
                'Acompanhamento semanal com relatorios',
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-2 sm:gap-3 text-slate-700 font-medium text-sm sm:text-base">
                  <CheckCircle2 size={18} className="text-primary-600 flex-shrink-0" />
                  {text}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link to="/empresas">
                <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-10 rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all font-bold">
                  Ver Prestadores <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary-50 flex items-center justify-center">
                  <Star size={16} className="text-primary-600" fill="currentColor" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">4.9/5</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">Media Geral</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedProfessional;
