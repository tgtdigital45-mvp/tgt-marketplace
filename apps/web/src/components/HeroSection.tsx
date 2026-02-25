import React from 'react';
import { motion } from 'framer-motion';
import QuickSearch from '@/components/QuickSearch';
import { ShieldCheck, Star, Users, Headphones } from 'lucide-react';

const wordAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.3 + i * 0.06, duration: 0.5, ease: 'easeOut' },
  }),
};

const HeroSection: React.FC = () => {
  const headlineWords = ['Encontre,', 'compare', 'e', 'contrate', 'os', 'melhores', 'prestadores', 'verificados.'];

  return (
    <section className="relative min-h-[75vh] sm:min-h-[80vh] lg:min-h-[85vh] flex items-center pt-16 sm:pt-20 lg:pt-24 pb-12 overflow-hidden bg-slate-900">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary-600/12 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-15%] w-[500px] h-[500px] bg-brand-secondary/10 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] left-[40%] w-[300px] h-[300px] bg-brand-accent/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 grain-texture opacity-[0.04]" />
      </div>

      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1.5 sm:py-2 px-4 sm:px-6 rounded-full bg-primary-600/10 text-primary-400 text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-6 sm:mb-8 border border-primary-500/20 backdrop-blur-sm">
              A Rede Verificada #1 do Parana
            </span>
          </motion.div>

          {/* Animated headline - word by word */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-5 sm:mb-8 tracking-tight px-1">
            {headlineWords.map((word, i) => (
              <motion.span
                key={i}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={wordAnimation}
                className={`inline-block mr-[0.25em] ${word === 'verificados.' ? 'text-primary-400 italic' : ''}`}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-400 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed font-light px-2 sm:px-0"
          >
            Mais de 5.000 empresas avaliadas por clientes reais. Orcamentos claros, processos transparentes e garantia CONTRATTO em cada contratacao.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 1 }}
            className="bg-white p-1.5 sm:p-2 rounded-2xl sm:rounded-[32px] shadow-2xl max-w-4xl mx-auto relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 via-brand-accent to-primary-400 rounded-2xl sm:rounded-[34px] opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500" />
            <div className="relative z-10">
              <QuickSearch />
            </div>
          </motion.div>

          {/* Trust Badges */}
          <div className="mt-10 sm:mt-16 lg:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 max-w-5xl mx-auto">
            {[
              { icon: ShieldCheck, title: '100% Verificado', sub: 'Auditoria Rigorosa', delay: 1.2 },
              { icon: Users, title: '5k+ Empresas', sub: 'Rede em Expansao', delay: 1.3 },
              { icon: Star, title: '4.9/5 Rating', sub: 'Satisfacao Comprovada', delay: 1.4 },
              { icon: Headphones, title: 'Suporte Dedicado', sub: 'Sempre Disponivel', delay: 1.5 },
            ].map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: badge.delay, duration: 0.4 }}
                className="bg-white/[0.04] backdrop-blur-md border border-white/[0.08] p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl flex flex-col items-center gap-1.5 sm:gap-2.5 hover:bg-white/[0.07] hover:border-white/[0.12] transition-all duration-300 group/badge"
              >
                <badge.icon size={20} strokeWidth={1.5} className="text-primary-400 group-hover/badge:scale-110 transition-transform" />
                <div className="text-center">
                  <p className="text-white font-bold text-[11px] sm:text-sm tracking-tight">{badge.title}</p>
                  <p className="text-slate-500 text-[9px] sm:text-[10px] uppercase font-medium mt-0.5">{badge.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade to white (next section is white) */}
      <div className="absolute bottom-0 left-0 w-full h-20 sm:h-32 bg-gradient-to-t from-white to-transparent z-10" />
    </section>
  );
};

export default HeroSection;
