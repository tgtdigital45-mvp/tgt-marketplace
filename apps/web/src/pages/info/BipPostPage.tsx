import React from 'react';
import { motion } from 'framer-motion';
import { Search, Handshake, QrCode, CheckCircle, ArrowRight, Github, Twitter, Linkedin, MessageSquare } from 'lucide-react';
import { Button } from '@tgt/ui-web';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Procura',
    description: 'Encontre o especialista ideal para o seu projeto entre milhares de prestadores verificados.',
    accent: 'from-primary-500 to-primary-600',
    bg: 'bg-primary-50',
    iconColor: 'text-primary-600',
  },
  {
    number: '02',
    icon: Handshake,
    title: 'Contrata',
    description: 'Pague com segurança pela plataforma e combine os detalhes diretamente com o profissional.',
    accent: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    number: '03',
    icon: QrCode,
    title: 'QR Code',
    description: 'Para serviços presenciais, valide o início do atendimento escaneando o código via app.',
    accent: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    number: '04',
    icon: CheckCircle,
    title: 'Concluído',
    description: 'Após a entrega, o valor é liberado ao profissional e você avalia a experiência.',
    accent: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
];

const BipPostPage: React.FC = () => {
  return (
    <main className="bg-white min-h-screen pt-32 pb-24 overflow-hidden">
      <SEO 
        title="Building in Public: Como a Contratto funciona | CONTRATTO"
        description="Acompanhe nossa jornada de construção e entenda o fluxo que preparamos para o dia 20."
      />

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary-50/50 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-blue-50/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-emerald-50/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <span className="bg-primary-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-200">
              Building in Public #01
            </span>
          </motion.div>

          {/* Title Section */}
          <header className="text-center mb-20">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight leading-[1.05]"
            >
              Simples, Rápido e <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-blue-600 to-emerald-600">
                Transparente.
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed"
            >
              Estamos construindo a Contratto em público. No dia 20, daremos o próximo grande passo. 
              Confira como preparamos a jornada para você.
            </motion.p>
          </header>

          {/* The Visual Block - Mimicking user image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="bg-white rounded-[48px] md:rounded-[64px] shadow-2xl shadow-slate-200 border border-slate-100 p-8 md:p-16 mb-24 relative overflow-hidden"
          >
            <div className="absolute inset-0 dot-pattern opacity-[0.03] pointer-events-none" />
            
            <div className="relative z-10">
              <div className="text-center mb-16">
                <span className="text-brand-secondary font-bold tracking-[0.2em] text-xs uppercase mb-4 block">
                  Simples e Rápido
                </span>
                <h2 className="font-display text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                  Como Funciona
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 relative">
                {/* Connecting line - desktop only */}
                <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-primary-200 via-blue-200 to-emerald-200 z-0" />

                {steps.map((step, index) => (
                  <div key={index} className="relative z-10 text-center group">
                    <div className="relative inline-flex flex-col items-center mb-6">
                      <div className={`w-20 h-20 ${step.bg} rounded-3xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:rotate-6 shadow-lg ring-4 ring-white`}>
                        <step.icon size={32} strokeWidth={1.5} className={step.iconColor} />
                      </div>
                      <span className={`absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br ${step.accent} text-white text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-white`}>
                        {step.number}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Narrative Content */}
          <div className="prose prose-slate prose-lg max-w-none mb-24">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Nossa Missão para o Dia 20</h2>
            <p>
              Desde o primeiro dia, nosso foco foi remover a fricção do mercado de serviços. Contratar um profissional 
              deve ser tão fácil quanto pedir uma entrega ou um transporte por aplicativo. 
            </p>
            <p>
              O que você vê acima é o resultado de semanas de iteração no design e na experiência do usuário (UX). 
              Queremos que cada etapa seja intuitiva e dê ao cliente a segurança que ele merece.
            </p>
            <div className="bg-slate-50 rounded-3xl p-8 my-12 border border-slate-100 italic text-slate-600">
              "A tecnologia deve servir às pessoas, não o contrário. No dia 20, mostraremos como a simplicidade 
              pode transformar a confiança entre quem contrata e quem presta serviços."
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-6">O que vem a seguir?</h3>
            <p>
              Estamos finalizando as integrações de pagamento e o sistema de validação por QR Code. Nossa equipe 
              está testando cada cenário para garantir que a experiência de "Concluído" seja gratificante para ambos os lados.
            </p>
          </div>

          {/* CTA / Footer of the post */}
          <footer className="bg-slate-900 rounded-[48px] p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-[80px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -ml-32 -mb-32" />
            
            <div className="relative z-10">
              <h3 className="text-3xl font-black mb-6">Pronto para o dia 20?</h3>
              <p className="text-slate-400 mb-10 max-w-md mx-auto">
                Não perca nenhuma atualização sobre o lançamento da Contratto. Junte-se à nossa comunidade.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-8 py-6 h-auto font-black flex items-center gap-2">
                  Quero participar <ArrowRight size={18} />
                </Button>
                <div className="flex items-center gap-4 ml-4">
                  <button className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all"><Twitter size={20} /></button>
                  <button className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all"><Linkedin size={20} /></button>
                  <button className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all"><Github size={20} /></button>
                </div>
              </div>
            </div>
          </footer>

          {/* Back to news */}
          <div className="mt-16 text-center">
            <Link to="/noticias" className="text-slate-400 hover:text-primary-600 font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
              <ArrowRight size={16} className="rotate-180" /> Voltar para Notícias
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BipPostPage;
