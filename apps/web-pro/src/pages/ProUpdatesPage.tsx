import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Zap, Sparkles, Monitor, Globe } from 'lucide-react';

const updates = [
  {
    version: '2.4.0',
    date: 'Abril 2024',
    title: 'Dashboard de Analytics em Real-time',
    description: 'Lançamos a nova engine de dados que permite visualizar conversões e cliques no seu perfil Pro sem atraso. Agora você sabe exatamente quem está interessado no seu serviço no momento em que acontece.',
    category: 'Analytics',
    icon: <Zap size={20} className="text-primary-500" />
  },
  {
    version: '2.3.5',
    date: 'Março 2024',
    title: 'Integração Google Calendar Pro',
    description: 'Sincronização bidirecional avançada. Seus orçamentos fechados via CONTRATTO agora bloqueiam horários automaticamente na sua agenda pessoal e da sua equipe.',
    category: 'Produtividade',
    icon: <Sparkles size={20} className="text-amber-500" />
  },
  {
    version: '2.2.0',
    date: 'Fevereiro 2024',
    title: 'Galeria Ultra-HD e Portfólio Dinâmico',
    description: 'Otimização de compressão de imagens para carregamento 3x mais rápido sem perda de fidelidade. Perfeito para arquitetos, designers e construtores.',
    category: 'Performance',
    icon: <Monitor size={20} className="text-blue-500" />
  },
  {
    version: '2.1.0',
    date: 'Janeiro 2024',
    title: 'Expansão Multi-cidades Selecionada',
    description: 'Agora empresas Pro podem selecionar raios de atuação específicos por cidade, garantindo que você só receba leads de onde realmente pode atender.',
    category: 'Crescimento',
    icon: <Globe size={20} className="text-green-500" />
  }
];

const ProUpdatesPage: React.FC = () => {
  return (
    <div className="bg-white min-h-screen font-sans">
      
      {/* 1. Header */}
      <section className="pt-32 pb-16 border-b border-slate-100 bg-slate-50/50">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
              <Rocket size={14} /> Changelog
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-black text-slate-950 mb-6 tracking-tight">
              O que há de novo no <br />
              <span className="text-gradient-primary">CONTRATTO Pro.</span>
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
                Acompanhe o ritmo da nossa evolução. Melhoramos a plataforma todas as semanas para garantir que você feche mais negócios.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. Timeline Feed */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6 max-w-4xl relative">
          
          {/* Vertical Line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2 hidden md:block"></div>

          <div className="space-y-16 md:space-y-32">
            {updates.map((update, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`relative flex flex-col md:flex-row items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                
                {/* Content Card */}
                <div className="w-full md:w-[45%]">
                  <div className={`p-8 md:p-12 rounded-[2.5rem] border border-slate-100 bg-white shadow-soft hover:shadow-lg transition-shadow group`}>
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                          {update.icon}
                       </div>
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{update.category}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-display font-black text-slate-950 mb-4 tracking-tight group-hover:text-primary-600 transition-colors">
                        {update.title}
                    </h2>
                    <p className="text-slate-600 leading-relaxed text-sm font-medium">
                        {update.description}
                    </p>
                  </div>
                </div>

                {/* Central Point */}
                <div className="absolute left-6 md:left-1/2 w-4 h-4 bg-primary-500 rounded-full border-4 border-white shadow-md -translate-x-1/2 z-20 hidden md:block"></div>

                {/* Date/Version Info */}
                <div className={`w-full md:w-[45%] text-left ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                   <div className={`flex flex-col ${index % 2 === 0 ? '' : 'md:items-end'}`}>
                      <span className="text-sm font-black text-primary-600 mb-1">{update.version}</span>
                      <span className="text-2xl font-display font-bold text-slate-900">{update.date}</span>
                   </div>
                </div>

              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Footer CTA */}
      <section className="py-32 bg-slate-950 overflow-hidden relative">
         <div className="container mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl font-display font-black text-white mb-6 tracking-tight">Pronto para o próximo nível?</h2>
            <p className="text-slate-400 max-w-xl mx-auto mb-10 text-lg">Junte-se às empresas que já estão usando essas novidades para dominar o mercado local.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <button className="h-14 px-10 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-600/20 hover:bg-primary-500 transition-all hover-scale-105">
                  Assinar CONTRATTO Pro
               </button>
               <button className="h-14 px-10 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 backdrop-blur-md transition-all">
                  Ver Cases de Sucesso
               </button>
            </div>
         </div>
      </section>

    </div>
  );
};

export default ProUpdatesPage;
