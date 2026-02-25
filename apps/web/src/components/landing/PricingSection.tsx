import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

const plans = [
  {
    name: 'Essencial',
    price: '49',
    description: 'Para profissionais que querem marcar presenca e comecar a receber orcamentos.',
    features: ['Perfil profissional completo', 'Ate 5 fotos na galeria', 'Receber avaliacoes de clientes', 'Suporte por email'],
    isPopular: false,
  },
  {
    name: 'Crescimento',
    price: '129',
    description: 'O plano mais escolhido por empresas que querem escalar sua visibilidade.',
    features: ['Tudo do Essencial', 'Galeria ilimitada de fotos', 'Destaque nos resultados de busca', 'Dashboard com metricas', 'Suporte prioritario'],
    isPopular: true,
  },
  {
    name: 'Enterprise',
    price: '299',
    description: 'Para empresas que exigem maxima visibilidade, dados e gestao dedicada.',
    features: ['Tudo do Crescimento', 'Gerente de conta exclusivo', 'Relatorios customizados', 'API de integracao', 'Auditoria de reputacao'],
    isPopular: false,
  },
];

const PricingSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-slate-900 text-white overflow-hidden relative">
      {/* Decorative background */}
      <div className="absolute inset-0 grain-texture opacity-[0.03] pointer-events-none" />
      <div className="absolute top-[-15%] right-[-8%] w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-primary-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-8%] w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-brand-secondary/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <span className="text-primary-400 font-bold tracking-[0.2em] text-[10px] sm:text-xs uppercase mb-3 sm:mb-4 block">
            Investimento
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 tracking-tight px-2 sm:px-0">
            Invista no crescimento do seu <span className="text-primary-400">negocio</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg px-2 sm:px-0">
            Escolha o plano certo para o momento da sua empresa. Sem fidelidade, cancele quando quiser.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border flex flex-col justify-between relative ${
                plan.isPopular
                  ? 'bg-white text-slate-900 border-primary-500/50 shadow-2xl shadow-primary-600/10 md:scale-105 z-20'
                  : 'bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.06] transition-colors'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-600 text-white px-3 sm:px-5 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap shadow-lg">
                  Mais Escolhido
                </div>
              )}

              <div>
                <h3 className={`font-display text-xl sm:text-2xl font-bold mb-2 tracking-tight ${plan.isPopular ? 'text-slate-900' : 'text-white'}`}>
                  {plan.name}
                </h3>
                <p className={`text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed ${plan.isPopular ? 'text-slate-500' : 'text-slate-400'}`}>
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1 mb-6 sm:mb-8">
                  <span className="font-display text-3xl sm:text-4xl font-black tracking-tight">R$ {plan.price}</span>
                  <span className={`text-xs sm:text-sm font-medium ${plan.isPopular ? 'text-slate-400' : 'text-slate-500'}`}>/mes</span>
                </div>

                <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2.5 sm:gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.isPopular ? 'bg-primary-100 text-primary-600' : 'bg-white/10 text-primary-400'
                      }`}>
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span className={`text-xs sm:text-sm font-medium ${plan.isPopular ? 'text-slate-600' : 'text-slate-400'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant={plan.isPopular ? 'primary' : 'outline'}
                className={`w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base ${
                  plan.isPopular
                    ? 'shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all'
                    : 'border-white/20 text-white hover:bg-white/10 transition-colors'
                }`}
              >
                Comecar agora <ArrowRight size={16} className="ml-2" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
