import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, ArrowUpRight, TrendingUp, Users, Target } from 'lucide-react';

const cases = [
  {
    company: 'MarketMinds Digital',
    tag: 'AGÊNCIA DE MARKETING',
    description: 'Como uma agência boutique automatizou 90% do seu fluxo de entrada de leads e triplicou o ROI de seus clientes locais.',
    metric: '+310%',
    metricLabel: 'CRESCIMENTO EM LEADS',
    color: 'bg-blue-50',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop'
  },
  {
    company: 'Arquitetura de Valor',
    tag: 'INTERIORES & DESIGN',
    description: 'Transformação digital de um escritório de arquitetura que passou a fechar contratos de alto padrão apenas via CONTRATTO Pro.',
    metric: 'R$ 450k',
    metricLabel: 'EM NOVOS CONTRATOS',
    color: 'bg-emerald-50',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop'
  },
  {
    company: 'Sip & Savor Eventos',
    tag: 'BUFFET & GASTRONOMIA',
    description: 'Otimização de agenda e reservas para uma das maiores empresas de buffet de São Paulo usando o Piloto Automático.',
    metric: '-25hs',
    metricLabel: 'ECONOMIZADAS/SEMANA',
    color: 'bg-amber-50',
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=800&auto=format&fit=crop'
  },
  {
    company: 'StyleHive Modas',
    tag: 'VAREJO & ESTÉTICA',
    description: 'Construção de autoridade e selo de verificado que resultaram em um aumento massivo de agendamentos diretos via perfil.',
    metric: '2.4x',
    metricLabel: 'MAIS CONVERSÃO',
    color: 'bg-purple-50',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop'
  }
];

const ProCasesPage: React.FC = () => {
  return (
    <div className="bg-white min-h-screen font-sans">
      
      {/* 1. Header Section */}
      <section className="pt-32 pb-24 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/40 via-white to-white">
        <div className="container mx-auto px-6 max-w-6xl text-center md:text-left">
           <motion.div
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="inline-flex items-center gap-2 mb-6 bg-slate-100 px-4 py-2 rounded-full text-xs font-black text-slate-500 uppercase tracking-widest"
           >
             <LayoutGrid size={14} /> Histórias de Sucesso
           </motion.div>
           <h1 className="text-5xl md:text-7xl font-display font-black text-slate-950 mb-8 tracking-tight">
              Deixe os resultados <br />
              <span className="text-gradient-primary">falarem por você.</span>
           </h1>
           <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
              Veja como empresas de diversos setores estão usando o CONTRATTO Pro para automatizar, escalar e dominar seus nichos de mercado.
           </p>
        </div>
      </section>

      {/* 2. Cases Grid */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {cases.map((cs, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group cursor-pointer"
                >
                   <div className="relative h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden mb-8 shadow-soft group-hover:shadow-elevated transition-all duration-500">
                      <img 
                        src={cs.image} 
                        alt={cs.company} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                      
                      <div className="absolute top-8 left-8">
                         <div className="bg-white/20 backdrop-blur-xl border border-white/20 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {cs.tag}
                         </div>
                      </div>

                      <div className="absolute bottom-10 left-10 right-10">
                         <div className="flex items-center justify-between gap-4">
                            <div>
                               <h3 className="text-3xl md:text-4xl font-display font-black text-white group-hover:translate-x-2 transition-transform duration-500">
                                  {cs.company}
                               </h3>
                            </div>
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-950 group-hover:rotate-45 transition-all duration-500">
                               <ArrowUpRight size={28} />
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="px-6">
                      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                         <div className="flex-1">
                            <p className="text-slate-500 font-medium leading-relaxed">
                               {cs.description}
                            </p>
                         </div>
                         <div className="flex flex-col items-start md:items-end min-w-[200px]">
                            <span className="text-4xl font-display font-black text-primary-600 block mb-1">
                               {cs.metric}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                               {cs.metricLabel}
                            </span>
                         </div>
                      </div>
                   </div>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* 3. Stats Section */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
         <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
               <div className="p-8">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                     <TrendingUp size={24} className="text-primary-500" />
                  </div>
                  <h4 className="text-4xl font-display font-black text-slate-950 mb-2">35%</h4>
                  <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Aumento Médio em Leads</p>
               </div>
               <div className="p-8">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                     <Users size={24} className="text-primary-500" />
                  </div>
                  <h4 className="text-4xl font-display font-black text-slate-950 mb-2">12k+</h4>
                  <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Contratos Fechados/Mês</p>
               </div>
               <div className="p-8">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                     <Target size={24} className="text-primary-500" />
                  </div>
                  <h4 className="text-4xl font-display font-black text-slate-950 mb-2">98%</h4>
                  <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Taxa de Satisfação Pro</p>
               </div>
            </div>
         </div>
      </section>

      {/* 4. CTA */}
      <section className="py-32 bg-white overflow-hidden relative">
         <div className="container mx-auto px-6 text-center">
            <div className="max-w-3xl mx-auto p-12 md:p-20 bg-slate-950 rounded-[3.5rem] relative overflow-hidden shadow-big">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               <div className="relative z-10">
                  <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-8 tracking-tight">Escreva sua própria história de sucesso.</h2>
                  <button className="h-16 px-12 bg-white text-slate-950 font-black rounded-2xl shadow-xl hover-scale-105 transition-all">
                     Assinar Plano Pro Agora
                  </button>
               </div>
            </div>
         </div>
      </section>

    </div>
  );
};

export default ProCasesPage;
