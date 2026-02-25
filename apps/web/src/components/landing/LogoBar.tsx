import React from 'react';
import { motion } from 'framer-motion';

const companies = [
  'TechStart', 'RailCorp', 'EngeSul', 'ContaFlex', 'MedVida',
  'ArqDesign', 'JurisPro', 'FotoArt', 'EduTech', 'SaudePlus',
  'ConsultPR', 'DigitalPR', 'LogisTech', 'GreenBuild', 'FinanceHub',
];

const LogoBar: React.FC = () => {
  return (
    <section className="py-8 sm:py-10 lg:py-12 bg-white border-b border-slate-100 overflow-hidden">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mb-6 sm:mb-8 px-4"
      >
        Mais de 5.000 empresas ja confiam na CONTRATTO
      </motion.p>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee">
          {[...companies, ...companies].map((name, i) => (
            <span
              key={i}
              className="flex-shrink-0 mx-4 sm:mx-6 lg:mx-8 text-slate-300 font-display font-bold text-lg sm:text-xl lg:text-2xl whitespace-nowrap tracking-tight hover:text-primary-600 transition-colors duration-300 cursor-default select-none"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoBar;
