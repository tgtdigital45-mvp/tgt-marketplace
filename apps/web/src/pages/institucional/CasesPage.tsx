import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  Building2, TrendingUp, Users, 
  MapPin, ExternalLink, ShieldCheck, ArrowUpRight 
} from 'lucide-react';

const CasesPage: React.FC = () => {
  const cases = [
    {
      company: 'MarketMinds Tech',
      impact: '+310% de Faturamento',
      description: 'Como uma agência de consultoria regional escalou seu atendimento para todo o estado através da plataforma.',
      tag: 'Crescimento Acelerado',
      location: 'São Francisco do Sul, SC',
      icon: <Building2 className="text-emerald-500" size={24} />,
      stats: '150+ Contratos Fechados'
    },
    {
      company: 'Arquitetura de Valor',
      impact: 'Reputação AAA',
      description: 'Estratégia de selo de verificação e depoimentos que gerou autoridade imediata no mercado de alto padrão.',
      tag: 'Autoridade & Trust',
      location: 'Joinville, SC',
      icon: <ShieldCheck className="text-blue-500" size={24} />,
      stats: '98% Avaliação Positiva'
    },
    {
      company: 'Elite Reformas',
      impact: 'Otimização de Agenda',
      description: 'Redução de 60% no tempo de negociação de orçamentos com o uso da IA de Briefings da CONTRATTO.',
      tag: 'Eficiência Operacional',
      location: 'Curitiba, PR',
      icon: <TrendingUp className="text-yellow-500" size={24} />,
      stats: '400+ Clientes Atendidos'
    }
  ];

  return (
    <div className="bg-[#050505] min-h-screen pt-44 pb-32">
       <Helmet>
          <title>Cases de Sucesso | Histórias de Impacto na CONTRATTO</title>
          <meta name="description" content="Veja como empresas e profissionais estão escalando seus negócios e gerando valor real na maior rede regional." />
       </Helmet>

       <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto mb-24">
             <motion.p
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mb-6"
             >
               Success Stories
             </motion.p>
             <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white tracking-tighter mb-8 leading-tight">
                Impacto real que <br />
                <span className="text-emerald-500 italic">gera resultados.</span>
             </h1>
             <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
               Não somos apenas uma plataforma de conexão. Somos o acelerador de negócios das melhores empresas e profissionais da região.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
             {cases.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 border border-white/5 p-10 rounded-[3rem] group hover:border-emerald-500/30 transition-all duration-700"
                >
                   <div className="flex justify-between items-start mb-10">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform">
                         {item.icon}
                      </div>
                      <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                         {item.tag}
                      </div>
                   </div>

                   <h3 className="text-white text-3xl font-display font-extrabold mb-4">{item.company}</h3>
                   <p className="text-slate-400 text-sm leading-relaxed mb-10">{item.description}</p>
                   
                   <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mb-10 group-hover:border-emerald-500/20 transition-all">
                      <p className="text-emerald-500 text-2xl font-display font-black mb-1">{item.impact}</p>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{item.stats}</p>
                   </div>

                   <div className="flex items-center justify-between text-xs font-bold pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-300">
                         <MapPin size={14} className="text-emerald-500" />
                         {item.location}
                      </div>
                      <div className="text-slate-400 group-hover:text-emerald-500 transition-colors cursor-pointer flex items-center gap-1.5">
                         Ler Estudo <ExternalLink size={14} />
                      </div>
                   </div>
                </motion.div>
             ))}
          </div>

          <motion.div 
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             className="mt-40 bg-emerald-500 rounded-[4rem] p-16 md:p-24 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative"
          >
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="grid grid-cols-12 h-full gap-4">
                   {[...Array(24)].map((_, i) => (
                      <div key={i} className="bg-black/20 w-full h-full" />
                   ))}
                </div>
             </div>

             <div className="relative z-10 max-w-xl">
                <div className="flex items-center gap-2 mb-8">
                   <Users className="text-black" size={24} />
                   <span className="text-black font-black uppercase tracking-widest text-[10px]">União que Ganha</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-black text-black tracking-tighter mb-8 leading-none">
                   Seja o próximo case de sucesso da rede.
                </h2>
                <p className="text-emerald-950 font-medium text-lg leading-relaxed mb-6 opacity-80">
                   Estamos selecionando os próximos 20 profissionais de elite para destaque exclusivo no primeiro semestre de 2025.
                </p>
             </div>

             <div className="relative z-10">
                <button className="h-16 px-12 rounded-2xl bg-black text-white font-black hover:scale-105 transition-all shadow-2xl flex items-center gap-4 group">
                   Candidatar-se agora <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
             </div>
          </motion.div>
       </div>
    </div>
  );
};

export default CasesPage;
