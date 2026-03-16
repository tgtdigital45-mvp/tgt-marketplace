import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Star,
  MessageSquare,
  BarChart3,
  Check,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Globe
} from 'lucide-react';

import { motion } from 'framer-motion';
import { Button } from '@tgt/ui-web';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://portal.ex.com';

const ProLandingPage: React.FC = () => {
  return (
    <div className="bg-white text-slate-900 font-sans">
      {/* Hero Section - Refined for Pro App */}
      <section className="relative pt-32 pb-24 overflow-hidden mesh-gradient">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1.5 px-4 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-widest mb-6 border border-primary-100">
              CONTRATTO PARCEIROS
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-[1.1] mb-8 tracking-tight max-w-4xl mx-auto">
              A tecnologia que escala sua <br />
              <span className="text-primary-600 font-extrabold italic text-gradient">Operação Profissional.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Muito mais que leads. Uma plataforma completa para gestão, faturamento e reputação da sua empresa no mercado paranaense.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={`${PORTAL_URL}/cadastro`}>
                <Button size="lg" className="px-8 shadow-soft hover:scale-105 transition-all glow-primary">
                  Começar agora
                </Button>
              </a>
              <Link to="/planos">
                <Button size="lg" variant="outline" className="px-8 bg-white/50 backdrop-blur-sm">
                  Ver Planos e Preços
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/30">
        <div className="container mx-auto px-6">
          <p className="text-center text-slate-400 text-sm font-semibold uppercase tracking-widest mb-8">Empresas que já escalam com o CONTRATTO</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {[
              { name: 'ContaBem Assessoria', initials: 'CB' },
              { name: 'Advocacia Paraná Sul', initials: 'AP' },
              { name: 'ArquiVerde', initials: 'AV' },
              { name: 'FotoArte CWB', initials: 'FA' },
              { name: 'Clínica Bem Estar', initials: 'BE' },
              { name: 'Studio MR Design', initials: 'MR' },
            ].map((company, i) => (
              <div key={i} className="flex items-center gap-2 group cursor-default">
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-300">
                  {company.initials}
                </div>
                <span className="text-slate-400 font-bold text-sm tracking-tighter group-hover:text-slate-600 transition-colors">
                  {company.name.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 bg-white dot-pattern relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">Pare de vender horas, comece a escalar valor.</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Nossa plataforma automatiza o que é burocrático para você focar no que é estratégico. Do primeiro contato ao faturamento, tudo em um só lugar.
              </p>
              
              <ul className="space-y-4 mb-10">
                {[
                  'Dashboard financeiro em tempo real',
                  'Gestão de equipe e permissões',
                  'Faturamento automatizado (NF-e)',
                  'Selo de confiança verificado'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>

              <Link to="/como-funciona" className="text-primary-600 font-bold flex items-center gap-2 group">
                Saiba como funciona a operação <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="relative">
                <div className="absolute inset-0 bg-primary-600/5 rounded-3xl blur-3xl -rotate-6" />
                <div className="bg-white rounded-3xl shadow-elevated border border-slate-100 p-2 overflow-hidden relative z-10">
                    <div className="aspect-video bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden">
                        <div className="w-full h-full bg-slate-50 rounded-2xl p-4 flex flex-col gap-3">
                          {/* Simulated dashboard header */}
                          <div className="flex items-center justify-between">
                            <div className="h-3 w-24 bg-slate-200 rounded-full" />
                            <div className="flex gap-2">
                              <div className="h-6 w-16 bg-primary-100 rounded-lg" />
                              <div className="h-6 w-16 bg-slate-200 rounded-lg" />
                            </div>
                          </div>
                          {/* Stats row */}
                          <div className="grid grid-cols-3 gap-2">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                                <div className="h-2 w-12 bg-slate-200 rounded-full mb-2" />
                                <div className="h-5 w-16 bg-primary-100 rounded-full" />
                              </div>
                            ))}
                          </div>
                          {/* Chart placeholder */}
                          <div className="flex-1 bg-white rounded-xl border border-slate-100 p-3 flex items-end gap-1">
                            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                              <div key={i} className="flex-1 bg-primary-100 rounded-t" style={{ height: `${h}%` }} />
                            ))}
                          </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-900 text-white rounded-[3rem] mx-4 my-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary-600/20 blur-[150px] pointer-events-none" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">O motor de crescimento da sua empresa</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Recursos premium desenhados por quem entende as dores do prestador de serviço.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <TrendingUp />,
                title: 'Marketplace de Vagas',
                desc: 'Acesse pedidos de serviços qualificados e responda a orçamentos em segundos.'
              },
              {
                icon: <ShieldCheck />,
                title: 'Reputação Verificada',
                desc: 'Suas melhores avaliações geram mais destaque e prioridade na plataforma.'
              },
              {
                icon: <Globe />,
                title: 'Presença Regional',
                desc: 'Seja encontrado por quem está perto. Geolocalização inteligente por bairros.'
              }
            ].map((feat, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="bg-white/5 backdrop-blur-md p-10 rounded-3xl border border-white/10 hover:bg-white/10 transition-all card-hover"
              >
                <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-8 text-white shadow-lg shadow-primary-600/20">
                  {React.cloneElement(feat.icon as React.ReactElement<any>, { size: 32 })}
                </div>
                <h3 className="text-2xl font-bold mb-4">{feat.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 text-center">
            <div className="max-w-3xl mx-auto bg-slate-50 p-12 md:p-20 rounded-[3rem] border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-accent" />
                <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">Pronto para o próximo nível?</h2>
                <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                    Junte-se a centenas de empresas que já transformaram sua operação digital com a CONTRATTO.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a href={`${PORTAL_URL}/cadastro`}>
                        <Button size="lg" className="px-12 py-6 text-lg font-bold shadow-soft">
                            Criar Conta
                        </Button>
                    </a>
                    <Link to="/contato" className="text-slate-500 font-semibold hover:text-slate-900 transition-colors">
                        Falar com Consultor
                    </Link>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default ProLandingPage;
