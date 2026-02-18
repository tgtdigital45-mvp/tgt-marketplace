import React from 'react';
import InfoPageLayout from '@/components/layout/InfoPageLayout';
import Button from '@/components/ui/Button';
import { Mail, MapPin, MessageSquare, Globe, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ContactPage: React.FC = () => {
  return (
    <InfoPageLayout
      title="Vamos conversar?"
      subtitle="Seja para tirar dúvidas, sugerir melhorias ou buscar parcerias estratégicas, estamos à disposição."
    >
      <div className="max-w-6xl mx-auto mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-soft"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">Envie uma mensagem</h2>
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2 ml-1">Nome Completo</label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Seu nome"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2 ml-1">E-mail Corporativo</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="email@empresa.com"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-bold text-slate-700 mb-2 ml-1">Assunto</label>
                <select
                  id="subject"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-slate-600"
                >
                  <option>Suporte ao Cliente</option>
                  <option>Parceria Comercial</option>
                  <option>Dúvidas Financeiras</option>
                  <option>Carreiras e Talentos</option>
                  <option>Sugestões</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-bold text-slate-700 mb-2 ml-1">Mensagem</label>
                <textarea
                  id="message"
                  rows={5}
                  placeholder="Como podemos ajudar?"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 resize-none"
                ></textarea>
              </div>
              <Button size="lg" className="w-full py-5 rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-transform">
                Enviar Mensagem <ArrowRight size={20} className="ml-2" />
              </Button>
            </form>
          </motion.div>

          {/* Info Section */}
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">Canais de Contendimento</h2>
            <div className="space-y-8">
              <div className="flex gap-6 group">
                <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 tracking-tight">E-mail</h4>
                  <p className="text-slate-500 mb-1">contato@contrattoex.com</p>
                  <p className="text-slate-400 text-xs font-medium">Tempo médio de resposta: 4 horas</p>
                </div>
              </div>

              <div className="flex gap-6 group">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 tracking-tight">WhatsApp Corporate</h4>
                  <p className="text-slate-500 mb-1">+55 (11) 99999-9999</p>
                  <p className="text-slate-400 text-xs font-medium">Atendimento de Seg a Sex, 09h às 18h</p>
                </div>
              </div>

              <div className="flex gap-6 group">
                <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-all duration-300">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 tracking-tight">Sede Estratégica</h4>
                  <p className="text-slate-500 mb-1">Av. Paulista, 1000 - São Paulo, SP</p>
                  <p className="text-slate-400 text-xs font-medium">Brasil</p>
                </div>
              </div>
            </div>

            <div className="mt-16 p-8 bg-slate-50 border border-slate-100 rounded-[32px]">
              <h4 className="font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
                <Globe size={18} className="text-primary-600" />
                Presença Global
              </h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Operamos como uma rede distribuída, garantindo agilidade no suporte e implementação em toda a América Latina e parcerias estratégicas globais.
              </p>
            </div>
          </div>
        </div>
      </div>
    </InfoPageLayout>
  );
};

export default ContactPage;
