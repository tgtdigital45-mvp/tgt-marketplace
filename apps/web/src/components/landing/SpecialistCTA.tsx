import React from 'react';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const SpecialistCTA: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-slate-50">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="bg-primary-600 rounded-2xl sm:rounded-3xl lg:rounded-[48px] p-8 sm:p-12 md:p-16 lg:p-20 relative overflow-hidden shadow-2xl shadow-primary-600/20"
        >
          <div className="relative z-10 max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 mb-6 sm:mb-8">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={16} className="sm:w-5 sm:h-5" />
              </div>
              <span className="text-primary-100 font-bold tracking-[0.15em] text-[9px] sm:text-[10px] uppercase">
                Para Prestadores de Servico
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 tracking-tight leading-tight">
              Faca parte da maior rede de prestadores do <span className="text-primary-200">Parana</span>
            </h2>

            <p className="text-sm sm:text-base lg:text-lg text-primary-100 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Cadastro gratuito. Verificacao em ate 24h. Comece a receber orcamentos e novos clientes ainda esta semana.
            </p>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-8 sm:mb-10 text-primary-100 text-xs sm:text-sm font-medium">
              {['Sem mensalidade para comecar', 'Perfil verificado', 'Suporte dedicado'].map((item, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-primary-200" />
                  {item}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/empresa/cadastro"
                className="inline-flex items-center justify-center bg-white !text-primary-600 h-12 sm:h-14 lg:h-16 px-8 sm:px-10 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base lg:text-lg hover:bg-primary-50 hover:scale-[1.02] transition-all shadow-xl"
              >
                Cadastrar minha Empresa <ArrowRight size={18} className="ml-2" />
              </Link>
            </div>
          </div>

          {/* Background Decorations */}
          <div className="absolute -top-20 -right-20 w-60 sm:w-96 h-60 sm:h-96 bg-white/[0.06] rounded-full blur-[60px] sm:blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-48 sm:w-72 h-48 sm:h-72 bg-slate-900/10 rounded-full blur-[40px] sm:blur-[60px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-[150px]" />
        </motion.div>
      </div>
    </section>
  );
};

export default SpecialistCTA;
