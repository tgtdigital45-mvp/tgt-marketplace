import React from 'react';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, FileCheck, Star } from 'lucide-react';

const benefits = [
  {
    icon: Search,
    title: 'Busca Inteligente',
    description: 'Filtros por categoria, cidade e avaliacao para encontrar exatamente o que voce precisa.',
    gradient: 'from-primary-500/10 to-primary-600/5',
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
  },
  {
    icon: ShieldCheck,
    title: 'Prestadores Verificados',
    description: 'Analise documental, checagem de CNPJ e validacao de portfolio em cada cadastro.',
    gradient: 'from-brand-secondary/10 to-blue-600/5',
    iconBg: 'bg-blue-50',
    iconColor: 'text-brand-secondary',
  },
  {
    icon: FileCheck,
    title: 'Contratacao Segura',
    description: 'Orcamentos transparentes, escopo definido e garantia de entrega pela CONTRATTO.',
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Star,
    title: 'Avaliacoes Reais',
    description: 'Notas e feedbacks de clientes verificados. Sem avaliacoes falsas, sem surpresas.',
    gradient: 'from-amber-500/10 to-amber-600/5',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
];

const BenefitsBar: React.FC = () => {
  return (
    <section className="py-14 sm:py-18 lg:py-24 bg-white">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-14 lg:mb-16"
        >
          <span className="text-primary-600 font-bold tracking-[0.2em] text-[10px] sm:text-xs uppercase mb-3 block">
            Por que a CONTRATTO
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Tudo que voce precisa em <span className="text-slate-400">um so lugar</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {benefits.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 hover:border-slate-200 bg-gradient-to-br from-white to-slate-50/50 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 group overflow-hidden"
            >
              {/* Subtle gradient accent on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl sm:rounded-3xl`} />

              <div className="relative z-10">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${item.iconBg} ${item.iconColor} flex items-center justify-center mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 sm:mb-3 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-slate-500 leading-relaxed text-xs sm:text-sm">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsBar;
