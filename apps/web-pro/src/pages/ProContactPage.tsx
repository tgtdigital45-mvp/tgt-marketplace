import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, MapPin, MessageSquare, Globe, ArrowRight, Shield, Loader2, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@tgt/core';
import { toast } from 'react-hot-toast';

const ProContactPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Onboarding de Nova Unidade',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([{
          full_name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message
        }]);

      if (error) throw error;

      toast.success('Solicitação enviada com sucesso!');
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: 'Onboarding de Nova Unidade',
        message: ''
      });
    } catch (error: any) {
      console.error('Erro ao enviar contato:', error);
      toast.error('Ocorreu um erro ao enviar sua mensagem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen pt-40 pb-32">
      <Helmet>
        <title>Contato do Parceiro | Suporte e Onboarding | CONTRATTO</title>
        <meta name="description" content="Central de atendimento exclusiva para parceiros de negócio, empresas e profissionais Pro." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-3xl mb-24">
           <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-8"
            >
              <Shield size={12} />
              Partner Support
           </motion.div>
           <h1 className="text-5xl md:text-6xl font-display font-extrabold text-slate-900 tracking-tighter mb-8 leading-[1.1]">
              Suporte direto para sua <br />
              <span className="text-blue-600">operação de elite.</span>
           </h1>
           <p className="text-xl text-slate-500 leading-relaxed max-w-2xl">
             Nossa equipe de Customer Success está pronta para ajudar você a otimizar sua empresa na rede.
           </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white p-12 rounded-[3.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 relative overflow-hidden"
          >
            {isSubmitted ? (
               <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center py-20"
                >
                    <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-blue-600/20">
                        <PartyPopper size={40} />
                    </div>
                    <h2 className="text-3xl font-display font-black text-slate-900 mb-4">Solicitação Recebida!</h2>
                    <p className="text-slate-500 text-lg max-w-sm mb-10 leading-relaxed">
                        Sua mensagem já está com nosso time de especialistas. Aguarde um retorno em até 24h úteis.
                    </p>
                    <button 
                        onClick={() => setIsSubmitted(false)}
                        className="px-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 text-sm font-bold hover:bg-slate-100 transition-all"
                    >
                        Enviar outra mensagem
                    </button>
               </motion.div>
            ) : (
                <>
                    <h2 className="text-2xl font-bold text-slate-900 mb-10 tracking-tight">Solicitação de Atendimento</h2>
                    <form className="space-y-8" onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu Nome</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: João Silva"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium disabled:opacity-50"
                            disabled={loading}
                        />
                        </div>
                        <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Profissional</label>
                        <input
                            type="email"
                            required
                            placeholder="email@suaempresa.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium disabled:opacity-50"
                            disabled={loading}
                        />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Suporte</label>
                        <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 outline-none focus:border-blue-500 transition-all font-medium appearance-none disabled:opacity-50"
                        disabled={loading}
                        >
                        <option>Onboarding de Nova Unidade</option>
                        <option>Dúvidas em Pagamentos</option>
                        <option>Ajustes de Perfil Pro</option>
                        <option>Suporte à IA CONTRATTO</option>
                        <option>Relatórios de Performance</option>
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sua Mensagem</label>
                        <textarea
                        rows={5}
                        required
                        placeholder="Como podemos ajudar sua empresa hoje?"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 font-medium resize-none disabled:opacity-50"
                        disabled={loading}
                        ></textarea>
                    </div>
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full h-16 rounded-2xl font-black text-lg bg-blue-600 text-white hover:bg-blue-700 shadow-2xl shadow-blue-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {loading ? (
                        <>
                            <Loader2 size={24} className="animate-spin" />
                            Enviando...
                        </>
                        ) : (
                        <>
                            Enviar Solicitação <ArrowRight size={20} />
                        </>
                        )}
                    </button>
                    </form>
                </>
            )}
          </motion.div>

          {/* Info Section */}
          <div className="flex flex-col justify-center space-y-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">Canais Partner-Only</h2>
            <div className="space-y-12">
              <div className="flex gap-8 group">
                <div className="w-16 h-16 bg-white border border-slate-200 text-blue-600 rounded-3xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <Mail size={24} />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-bold text-slate-900 text-lg mb-1 tracking-tight">E-mail Corporativo</h4>
                  <p className="text-slate-500 text-lg mb-1">pro@contratto.tech</p>
                  <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Atendimento Premium</p>
                </div>
              </div>

              <div className="flex gap-8 group">
                <div className="w-16 h-16 bg-white border border-slate-200 text-blue-600 rounded-3xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <MessageSquare size={24} />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-bold text-slate-900 text-lg mb-1 tracking-tight">Partner Success (WhatsApp)</h4>
                  <p className="text-slate-500 text-lg mb-1">+55 (47) 99222-1234</p>
                  <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Seg a Sex, 08h às 20h</p>
                </div>
              </div>

              <div className="flex gap-8 group">
                <div className="w-16 h-16 bg-white border border-slate-200 text-blue-600 rounded-3xl flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <MapPin size={24} />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-bold text-slate-900 text-lg mb-1 tracking-tight">Innovation Lab</h4>
                  <p className="text-slate-500 text-lg mb-1">Joinville, SC - Brasil</p>
                  <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Sede administrativa</p>
                </div>
              </div>
            </div>

            <div className="mt-20 p-12 bg-white border border-slate-200 rounded-[3rem] relative shadow-sm">
               <h4 className="font-bold text-slate-900 text-xl mb-6 flex items-center gap-2">
                <Globe size={20} className="text-blue-600" />
                Rede de Parceiros
              </h4>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                Nossa rede de parceiros conta com mais de 500 empresas certificadas em toda a região sul.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProContactPage;
