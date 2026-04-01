import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, MapPin, MessageSquare, Globe, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@tgt/ui-web';

const ContactPage: React.FC = () => {
  return (
    <div className="bg-[#050505] min-h-screen pt-44 pb-32">
      <Helmet>
        <title>Contato | CONTRATTO</title>
        <meta name="description" content="Entre em contato com a equipe da CONTRATTO para suporte, parcerias ou dúvidas." />
      </Helmet>

      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto mb-24">
           <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-8"
            >
              <Sparkles size={12} />
              Open for business
           </motion.div>
           <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white tracking-tighter mb-8 leading-[0.95]">
              Vamos elevar o nível <br />
              <span className="text-emerald-500 italic">da conversa.</span>
           </h1>
           <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
             Seja para suporte, expansão de negócios ou parcerias estratégicas, estamos prontos para ouvir você.
           </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 max-w-7xl mx-auto">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 p-12 rounded-[3rem] border border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -z-10 rounded-full" />
            
            <h2 className="text-2xl font-display font-bold text-white mb-10 tracking-tight">Envie sua mensagem</h2>
            <form className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-emerald-500">Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600 font-medium"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="email@empresa.com"
                    className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600 font-medium"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assunto</label>
                <select
                  className="w-full px-6 py-5 bg-[#0A0A0A] border border-white/10 rounded-2xl text-slate-400 outline-none focus:border-emerald-500 transition-all font-medium appearance-none"
                >
                  <option>Suporte ao Cliente</option>
                  <option>Parceria Comercial</option>
                  <option>Expansão e Talentos</option>
                  <option>Investimento</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mensagem</label>
                <textarea
                  rows={5}
                  placeholder="Como podemos ajudar?"
                  className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600 font-medium resize-none"
                ></textarea>
              </div>
              <Button size="lg" className="w-full h-16 rounded-2xl font-black text-lg bg-emerald-500 text-black hover:bg-emerald-400 shadow-2xl shadow-emerald-500/20 transition-all hover:scale-[1.02]">
                Enviar Mensagem <ArrowRight size={20} className="ml-2" />
              </Button>
            </form>
          </motion.div>

          {/* Info Section */}
          <div className="flex flex-col justify-center space-y-16">
            <h2 className="text-3xl font-display font-bold text-white mb-6 tracking-tight">Canais Globais</h2>
            <div className="space-y-12">
              <div className="flex gap-8 group">
                <div className="w-16 h-16 bg-white/5 border border-white/10 text-emerald-500 rounded-3xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500">
                  <Mail size={24} />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-bold text-white text-lg mb-1 tracking-tight">E-mail</h4>
                  <p className="text-slate-400 text-lg mb-1">contato@contratto.tech</p>
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Resposta em até 4h</p>
                </div>
              </div>

              <div className="flex gap-8 group">
                <div className="w-16 h-16 bg-white/5 border border-white/10 text-emerald-500 rounded-3xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500">
                  <MessageSquare size={24} />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-bold text-white text-lg mb-1 tracking-tight">Corporate Chat</h4>
                  <p className="text-slate-400 text-lg mb-1">+55 (11) 99999-9999</p>
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Disponível Seg a Sex</p>
                </div>
              </div>

              <div className="flex gap-8 group">
                <div className="w-16 h-16 bg-white/5 border border-white/10 text-emerald-500 rounded-3xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500">
                  <MapPin size={24} />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-bold text-white text-lg mb-1 tracking-tight">Sede</h4>
                  <p className="text-slate-400 text-lg mb-1">Joinville, SC - Brasil</p>
                  <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Innovation Hub</p>
                </div>
              </div>
            </div>

            <div className="mt-20 p-12 bg-emerald-500/5 border border-emerald-500/10 rounded-[3rem] relative overflow-hidden">
               <div className="absolute -bottom-10 -right-10 opacity-10">
                 <Globe size={180} />
               </div>
               <h4 className="font-display font-bold text-white text-xl mb-6 flex items-center gap-2">
                <Globe size={20} className="text-emerald-500" />
                Rede Distribuída
              </h4>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                Operamos com tecnologia de ponta para garantir agilidade no suporte e implementação em todo o território nacional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
