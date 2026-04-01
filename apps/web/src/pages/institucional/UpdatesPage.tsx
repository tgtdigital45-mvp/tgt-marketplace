import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  Zap, Sparkles, Layout, 
  ShieldCheck, ArrowUpRight, Cpu 
} from 'lucide-react';

const UpdatesPage: React.FC = () => {
  const updates = [
    {
      version: 'v2.4.0',
      date: 'Maio 2024',
      title: 'IA Generativa de Briefings',
      description: 'Lançamos nosso motor de IA proprietário que ajuda clientes a descreverem suas necessidades em segundos, gerando especificações técnicas automáticas para os profissionais.',
      category: 'Inteligência Artificial',
      icon: <Sparkles className="text-emerald-500" size={20} />,
      color: 'emerald'
    },
    {
      version: 'v2.3.5',
      date: 'Abril 2024',
      title: 'Marketplace Ultrarrápido',
      description: 'Otimização crítica no motor de busca e filtragem. Resultados 3x mais rápidos e nova interface de descoberta por categorias inteligentes.',
      category: 'Performance',
      icon: <Zap className="text-yellow-500" size={20} />,
      color: 'yellow'
    },
    {
      version: 'v2.2.1',
      date: 'Março 2024',
      title: 'Sistema de Verificação Biométrica',
      description: 'Implementamos uma camada extra de segurança para profissionais Pro, garantindo 100% de autenticidade nas identidades da rede.',
      category: 'Segurança',
      icon: <ShieldCheck className="text-blue-500" size={20} />,
      color: 'blue'
    },
    {
      version: 'v2.1.0',
      date: 'Fevereiro 2024',
      title: 'Nova Experiência de Agendamento',
      description: 'Interface de calendário redesenhada para facilitar o fluxo de reserva de horários e gestão de compromissos diretamente pelo chat.',
      category: 'User Experience',
      icon: <Layout className="text-purple-500" size={20} />,
      color: 'purple'
    }
  ];

  return (
    <div className="bg-[#050505] min-h-screen pt-44 pb-32">
       <Helmet>
          <title>Atualizações e Novidades | CONTRATTO</title>
          <meta name="description" content="Acompanhe a evolução da melhor rede de especialistas da região. Novas funcionalidades, IA e melhorias." />
       </Helmet>

       <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto mb-24 text-center">
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-8"
              >
                <Cpu size={12} />
                Tech Evolution
             </motion.div>
             <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white tracking-tighter mb-8 leading-[0.95]">
                O que há de novo na <br />
                <span className="text-emerald-500 italic">CONTRATTO.</span>
             </h1>
             <p className="text-xl text-slate-400">
               Nossa missão é evoluir a tecnologia de contratação regional todos os dias. Acompanhe nosso progresso.
             </p>
          </div>

          <div className="max-w-4xl mx-auto relative">
             {/* Vertical Line */}
             <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-white/5 md:-translate-x-1/2" />

             <div className="space-y-24">
                {updates.map((update, idx) => (
                   <motion.div 
                     key={update.version}
                     initial={{ opacity: 0, y: 30 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: idx * 0.1 }}
                     className={`relative flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 group`}
                   >
                      {/* Timeline Dot */}
                      <div className="absolute left-0 md:left-1/2 w-3 h-3 rounded-full bg-slate-800 border-2 border-[#050505] md:-translate-x-1/2 z-20 group-hover:scale-150 group-hover:bg-emerald-500 transition-all duration-500 shadow-xl" />

                      {/* Content side */}
                      <div className={`w-full md:w-1/2 pl-8 md:pl-0 ${idx % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}>
                         <div className={`inline-flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors group-hover:text-white`}>
                             {update.date} <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                         </div>
                         <h3 className="text-2xl font-bold text-white mb-4">{update.title}</h3>
                         <p className="text-slate-400 leading-relaxed text-sm md:text-base">{update.description}</p>
                      </div>

                      {/* Badge / Version side */}
                      <div className={`w-full md:w-1/2 pl-8 md:pl-0 flex ${idx % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}>
                         <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center gap-6 group-hover:border-emerald-500/30 transition-colors">
                             <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                {update.icon}
                             </div>
                             <div>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">{update.category}</p>
                                <p className="text-lg font-display font-bold text-white leading-none">{update.version}</p>
                             </div>
                         </div>
                      </div>
                   </motion.div>
                ))}
             </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-40 text-center py-20 rounded-[4rem] bg-gradient-to-b from-white/5 to-transparent border-t border-white/5 max-w-5xl mx-auto"
          >
             <h2 className="text-3xl font-display font-bold text-white mb-6">Pronto para o futuro?</h2>
             <p className="text-slate-500 mb-10 max-w-xl mx-auto text-sm">Inscreva-se para receber notificações de novas funcionalidades e IA Beta direto no seu painel.</p>
             <button className="h-14 px-10 rounded-2xl bg-white text-black font-black hover:bg-emerald-500 transition-all hover:scale-105">
                Ativar Notificações
             </button>
          </motion.div>
       </div>
    </div>
  );
};

export default UpdatesPage;
