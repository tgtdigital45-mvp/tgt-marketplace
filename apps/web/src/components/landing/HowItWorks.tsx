import React from 'react';
import { motion } from 'framer-motion';
import { Search, BarChart3, Handshake } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Pesquise',
    description: 'Busque por categoria, especialidade ou localizacao entre milhares de prestadores verificados.',
    accent: 'from-primary-500 to-primary-600',
    bg: 'bg-primary-50',
    iconColor: 'text-primary-600',
  },
  {
    number: '02',
    icon: BarChart3,
    title: 'Compare',
    description: 'Analise portfolios, avaliacoes reais e orcamentos transparentes lado a lado.',
    accent: 'from-brand-secondary to-blue-700',
    bg: 'bg-blue-50',
    iconColor: 'text-brand-secondary',
  },
  {
    number: '03',
    icon: Handshake,
    title: 'Contrate',
    description: 'Feche o negocio com seguranca, garantia de entrega e suporte dedicado da CONTRATTO.',
    accent: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 dot-pattern opacity-[0.03] pointer-events-none" />

      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <span className="text-brand-secondary font-bold tracking-[0.2em] text-[10px] sm:text-xs uppercase mb-3 sm:mb-4 block">
            Simples e Rapido
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight">
            Como <span className="text-brand-secondary">Funciona</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 relative">
          {/* Connecting line - desktop only */}
          <div className="hidden md:block absolute top-[72px] left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-primary-200 via-blue-200 to-emerald-200 z-0" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="relative z-10 text-center group"
            >
              {/* Step number + icon */}
              <div className="relative inline-flex flex-col items-center mb-6 sm:mb-8">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 ${step.bg} rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ring-4 ring-white shadow-lg`}>
                  <step.icon size={28} strokeWidth={1.5} className={step.iconColor} />
                </div>
                <span className={`absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${step.accent} text-white text-[10px] sm:text-xs font-black flex items-center justify-center shadow-lg`}>
                  {step.number}
                </span>
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                {step.title}
              </h3>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
