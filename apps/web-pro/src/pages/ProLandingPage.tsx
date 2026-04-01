import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MessageCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Zap,
  Layers,
  BarChart3,
  ShieldCheck,
  Check
} from 'lucide-react';

import { motion } from 'framer-motion';
import { Button } from '@tgt/ui-web';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://portal.ex.com';

const ProLandingPage: React.FC = () => {
  return (
    <div className="bg-white text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden">
      
      {/* 2. Hero Section - Massive Headline */}
      <section className="relative pt-44 pb-20 overflow-hidden bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary-50/50 via-white to-white">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Social Proof Indicator */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                +5k Profissionais a bordo
              </p>
            </div>

            <h1 className="text-5xl md:text-8xl font-display font-extrabold text-slate-950 leading-[1.05] mb-8 tracking-tighter max-w-5xl mx-auto">
              O Dashboard Inteligente <br />
              <span className="text-gradient-primary">para Escalar suas Vendas.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Gerencie sua operação com dados precisos e transforme leads em clientes com a plataforma oficial da CONTRATTO para empresas.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link to="/waitlist">
                <Button size="lg" className="h-16 px-10 rounded-2xl text-lg font-bold shadow-soft hover-scale-102">
                  Entrar na Waitlist
                </Button>
              </Link>
              <Link to="/planos">
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl text-lg border-slate-200 hover:bg-slate-50">
                  Ver Planos <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
            </div>

            {/* Main Mockup */}
            <div className="relative max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 1 }}
                className="relative z-10 rounded-[2.5rem] bg-white p-2 shadow-elevated border border-slate-100 overflow-hidden"
              >
                <div className="bg-slate-50 rounded-[2rem] aspect-[16/9] flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary-50/20 to-white" />
                   <img 
                    src="https://framerusercontent.com/images/yzrexRPhHxmEWAfDNk4k2vYIwsU.png" 
                    alt="Dashboard Mockup" 
                    className="w-full h-full object-cover opacity-90"
                   />
                </div>
              </motion.div>
              
              {/* Floating UI Elements */}
              <div className="absolute -left-12 top-1/4 z-20 hidden lg:block">
                <motion.div 
                   animate={{ y: [0, -15, 0] }}
                   transition={{ duration: 5, repeat: Infinity }}
                   className="glass-light p-4 rounded-2xl shadow-xl flex items-center gap-3 border-white/60"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Crescimento Mes</p>
                    <p className="text-lg font-bold text-slate-900">+42.8%</p>
                  </div>
                </motion.div>
              </div>

              <div className="absolute -right-12 bottom-1/3 z-20 hidden lg:block">
                 <motion.div 
                   animate={{ y: [0, 15, 0] }}
                   transition={{ duration: 6, repeat: Infinity }}
                   className="glass-light p-4 rounded-2xl shadow-xl flex items-center gap-3 border-white/60"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                    <Zap size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Gestão Ativa</p>
                    <p className="text-lg font-bold text-slate-900">Analytics Pro</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Trusted By Bar */}
      <section className="py-20 border-y border-slate-100 bg-white">
        <div className="container mx-auto px-6">
          <p className="text-center text-slate-400 text-sm font-bold uppercase tracking-[0.2em] mb-12">Marcas que Antecipam o Futuro</p>
          <div className="flex flex-wrap justify-center items-center gap-16 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
             <div className="font-display font-black text-2xl text-slate-400">GUMPER</div>
             <div className="font-display font-black text-2xl text-slate-400">LOOPWEAR</div>
             <div className="font-display font-black text-2xl text-slate-400">EVO</div>
             <div className="font-display font-black text-2xl text-slate-400">STRIDE</div>
             <div className="font-display font-black text-2xl text-slate-400">PROVIX</div>
          </div>
        </div>
      </section>

      {/* 4. Bento Grid */}
      <section className="py-32 bg-slate-50/50">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-20">
             <h4 className="text-primary-600 font-bold text-sm uppercase tracking-widest mb-4">Analytics Avançado</h4>
             <h2 className="text-4xl md:text-6xl font-display font-extrabold text-slate-950 tracking-tight leading-tight">
                Dados que transformam decisões em escala.
             </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-soft overflow-hidden relative group">
              <div className="relative z-10 max-w-sm mb-12">
                <h3 className="text-2xl font-bold mb-4 text-slate-900 group-hover:text-primary-600 transition-colors">Estratégias de Venda com Inteligência</h3>
                <p className="text-slate-500 leading-relaxed">
                  Utilize dados demográficos e comportamentais para otimizar suas ofertas com tecnologia treinada para o mercado regional.
                </p>
              </div>
              <div className="h-64 bg-slate-50 rounded-2xl border border-slate-100 relative group-hover:border-primary-100 transition-colors">
                 <div className="absolute inset-0 p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-primary-100" />
                       <div className="h-2 w-32 bg-slate-200 rounded-full" />
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-slate-100 p-4 space-y-3">
                       <div className="h-2 w-full bg-slate-100 rounded-full" />
                       <div className="h-2 w-[80%] bg-slate-100 rounded-full" />
                       <div className="h-2 w-[90%] bg-primary-50 rounded-full" />
                    </div>
                 </div>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col gap-6">
               <div className="flex-1 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-soft group">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-6 group-hover:scale-110 transition-transform">
                      <Layers size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Integrações Omnichannel</h3>
                  <p className="text-sm text-slate-500">Conecte-se a todos os canais de marketing e faturamento em um só lugar.</p>
               </div>
               <div className="flex-1 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-soft group">
                  <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center text-accent-600 mb-6 group-hover:scale-110 transition-transform">
                      <BarChart3 size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Previsões Precisas</h3>
                  <p className="text-sm text-slate-500">Dados preditivos para antecipar demanda e preparar sua operação.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Detail Section */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
             <div className="order-2 lg:order-1">
                <div className="inline-block py-1.5 px-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                   Inteligência de Mercado
                </div>
                <h2 className="text-4xl md:text-6xl font-display font-extrabold mb-8 tracking-tighter leading-[1.1]">
                   Estratégias que constroem autoridade absoluta.
                </h2>
                <div className="space-y-8">
                   {[
                     { title: 'Autoridade que converte', icon: <ShieldCheck className="text-primary-600" /> },
                     { title: 'Crescimento Sustentável', icon: <Zap className="text-primary-600" /> },
                     { title: 'Confiança na Marca', icon: <Check className="text-primary-600" /> }
                   ].map((item, idx) => (
                      <div key={idx} className="flex gap-4 group">
                          <div className="mt-1 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary-50 transition-colors">
                             {item.icon}
                          </div>
                          <div>
                             <h4 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h4>
                             <p className="text-slate-500 text-sm">Gerado dinamicamente para ressoar com seu público.</p>
                          </div>
                      </div>
                   ))}
                </div>
             </div>
             
             <div className="order-1 lg:order-2 relative">
                <div className="absolute -inset-10 bg-primary-100/30 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative z-10 glass-light rounded-[3rem] p-12 border border-slate-100 shadow-elevated w-full aspect-square md:aspect-auto md:h-[600px] flex items-center justify-center text-center">
                   <div className="w-full space-y-6">
                      <div className="h-48 bg-primary-600 rounded-[2rem] shadow-lg flex items-center justify-center text-white">
                         <div>
                            <Plus size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="font-bold">Gerar Insights de Mercado</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 6. Testimonials */}
      <section className="py-32 bg-slate-950 text-white rounded-[4rem] mx-4 my-12 overflow-hidden relative">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-display font-extrabold mb-12 tracking-tight">Resultados reais.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10">
                <p className="text-slate-300 leading-relaxed italic mb-8">“A plataforma Pro nos entregou o controle que faltava para escalar no Paraná.”</p>
                <div className="flex items-center justify-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-slate-700" />
                   <div className="text-left text-xs uppercase tracking-widest font-bold">Parceiro {i}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
             <h2 className="text-4xl font-display font-extrabold mb-4 tracking-tight">Dúvidas Frequentes</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "Como o Web Pro ajuda minha empresa a vender mais?", a: "O Web Pro fornece um Dashboard completo com Analytics em tempo real, permitindo identificar gargalos no funil de vendas e otimizar a conversão de leads." },
              { q: "O Dashboard é fácil de configurar?", a: "Sim, nossa interface foi desenhada para ser intuitiva. Em poucos minutos você tem uma visão clara de toda a sua operação comercial." },
              { q: "Quais empresas podem utilizar o Web Pro?", a: "O Web Pro é ideal para empresas de serviços, consultorias e profissionais que buscam profissionalizar sua presença digital e escalar resultados." },
              { q: "Como funciona o suporte para parceiros Pro?", a: "Parceiros Pro têm acesso a suporte prioritário e consultoria estratégica para maximizar o uso das ferramentas de inteligência de mercado." }
            ].map((faq, i) => (
               <details key={i} className="group bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between p-8 cursor-pointer select-none">
                     <h3 className="font-bold text-slate-900">{faq.q}</h3>
                     <Plus size={18} className="text-slate-400 group-open:rotate-45 transition-transform" />
                  </summary>
                  <div className="px-8 pb-8 text-slate-600 text-sm font-medium">{faq.a}</div>
               </details>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default ProLandingPage;
