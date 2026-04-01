import React from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Search, Book, Zap, Shield, 
  HelpCircle, MessageSquare, ArrowRight 
} from 'lucide-react';
import { motion } from 'framer-motion';

const HelpPage: React.FC = () => {
  const categories = [
    { 
      title: 'Primeiros Passos', 
      icon: <Zap size={24} className="text-emerald-500" />,
      articles: ['Como criar conta', 'Como buscar especialistas', 'Segurança do agendamento']
    },
    { 
      title: 'Pagamentos & Planos', 
      icon: <Book size={24} className="text-blue-500" />,
      articles: ['Métodos de pagamento', 'Como cancelar assinatura', 'Nota fiscal e recibos']
    },
    { 
      title: 'Segurança & Privacidade', 
      icon: <Shield size={24} className="text-purple-500" />,
      articles: ['Proteção de dados', 'Verificação de identidade', 'Termos de uso']
    }
  ];

  return (
    <div className="bg-[#050505] min-h-screen pt-44 pb-32">
       <Helmet>
          <title>Central de Ajuda | CONTRATTO</title>
          <meta name="description" content="Tudo o que você precisa saber para aproveitar ao máximo a rede CONTRATTO." />
       </Helmet>

       <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto mb-24 text-center">
             <motion.p
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mb-8"
             >
               Help Center
             </motion.p>
             <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white tracking-tighter mb-12 leading-tight">
                Como podemos <br />
                <span className="text-emerald-500 italic">ajudar você?</span>
             </h1>
             
             <div className="relative max-w-2xl mx-auto group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-emerald-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Busque por artigos, termos ou dúvidas..." 
                  className="w-full h-16 pl-16 pr-6 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 transition-all font-medium text-lg placeholder:text-slate-600"
                />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-32">
             {categories.map((cat, idx) => (
                <motion.div 
                   key={idx}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: idx * 0.1 }}
                   className="bg-white/5 border border-white/5 p-10 rounded-[3rem] hover:border-emerald-500/30 transition-all duration-500 group"
                >
                   <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-10 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                      {cat.icon}
                   </div>
                   <h3 className="text-2xl font-bold text-white mb-8 tracking-tight">{cat.title}</h3>
                   <ul className="space-y-4">
                      {cat.articles.map((art, aIdx) => (
                         <li key={aIdx} className="flex items-center justify-between text-slate-500 hover:text-white transition-colors cursor-pointer text-sm font-medium group/item">
                            {art}
                            <ArrowRight size={14} className="opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all text-emerald-500" />
                         </li>
                      ))}
                   </ul>
                </motion.div>
             ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
             <div className="bg-emerald-500 p-12 rounded-[3rem] flex flex-col items-center text-center">
                <MessageSquare size={40} className="text-black mb-6" />
                <h4 className="text-2xl font-display font-black text-black mb-4 tracking-tighter">Chat ao Vivo</h4>
                <p className="text-emerald-950 font-medium mb-8">Fale com um de nossos consultores agora mesmo para suporte técnico imediato.</p>
                <button className="h-14 px-10 rounded-2xl bg-black text-white font-black hover:scale-105 transition-all">
                   Abrir Chat
                </button>
             </div>

             <div className="bg-white/5 border border-white/10 p-12 rounded-[3rem] flex flex-col items-center text-center">
                <HelpCircle size={40} className="text-white mb-6" />
                <h4 className="text-2xl font-display font-black text-white mb-4 tracking-tighter">Comunidade</h4>
                <p className="text-slate-500 font-medium mb-8">Explore discussões, dicas de especialistas e aprenda com outros profissionais da rede.</p>
                <button className="h-14 px-10 rounded-2xl bg-white text-black font-black hover:scale-105 transition-all">
                   Ver Fórum
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default HelpPage;
