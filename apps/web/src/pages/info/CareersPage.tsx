import React from 'react';
import InfoPageLayout from '@/components/layout/InfoPageLayout';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, Sparkles, Rocket, ArrowRight } from 'lucide-react';

const CareersPage: React.FC = () => {
  return (
    <InfoPageLayout
      title="Construa o amanhã na CONTRATTO"
      subtitle="Estamos em busca de mentes inquietas que desejam transformar a economia local através de tecnologia de ponta."
    >
      <div className="mb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">Cultura de Alta Performance</h2>
            <p className="text-slate-500 leading-relaxed text-lg mb-8">
              Trabalhar na CONTRATTO significa estar na linha de frente da inovação. Valorizamos autonomia, transparência radical e foco em resultados que movem o ponteiro.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-slate-700 font-medium">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600"><Rocket size={20} /></div>
                Ambiente de crescimento acelerado
              </div>
              <div className="flex items-center gap-4 text-slate-700 font-medium">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600"><Sparkles size={20} /></div>
                Tecnologias de última geração (IA/Cloud)
              </div>
            </div>
          </div>
          <div className="bg-slate-900 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl">
            <blockquote className="relative z-10 italic text-xl leading-relaxed text-slate-200">
              "Na CONTRATTO, não apenas construímos software; desenhamos o ecossistema que permite a pequenas e médias empresas competirem no topo."
            </blockquote>
            <div className="mt-8 flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-slate-700 border border-slate-600" />
              <div>
                <p className="font-bold text-white">Engenharia CONTRATTO</p>
                <p className="text-primary-400 text-sm">Product Team</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl rounded-full" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight flex items-center gap-3">
          Oportunidades Abertas
          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase tracking-widest font-bold">2 Vagas</span>
        </h2>

        <div className="grid gap-6">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-8 border border-slate-200 rounded-3xl bg-white shadow-soft group hover:border-primary-200 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex gap-2 mb-4">
                  <span className="text-[10px] bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Engineering</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Remoto</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">Software Engineer, Frontend</h3>
                <p className="mt-2 text-slate-500 max-w-2xl leading-relaxed">
                  Buscamos especialistas em React e TypeScript para liderar o desenvolvimento de interfaces críticas do nosso marketplace.
                </p>
                <div className="flex items-center gap-6 mt-6">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <MapPin size={16} /> Brasil / Remote
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <Briefcase size={16} /> Full-time
                  </div>
                </div>
              </div>
              <Button variant="outline" className="h-12 px-8 flex items-center gap-2 font-bold whitespace-nowrap">
                Ver detalhes <ArrowRight size={18} />
              </Button>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-8 border border-slate-200 rounded-3xl bg-white shadow-soft group hover:border-primary-200 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex gap-2 mb-4">
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Product Design</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Híbrido</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">Senior Product Designer</h3>
                <p className="mt-2 text-slate-500 max-w-2xl leading-relaxed">
                  Projete o futuro das interações B2B. Foco em UX complexa, Dashboards e sistemas de design escaláveis.
                </p>
                <div className="flex items-center gap-6 mt-6">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <MapPin size={16} /> São Paulo, SP
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <Briefcase size={16} /> Full-time
                  </div>
                </div>
              </div>
              <Button variant="outline" className="h-12 px-8 flex items-center gap-2 font-bold whitespace-nowrap">
                Ver detalhes <ArrowRight size={18} />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </InfoPageLayout>
  );
};

export default CareersPage;
