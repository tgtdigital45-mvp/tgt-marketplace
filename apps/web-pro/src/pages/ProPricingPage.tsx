import React from 'react';
import { Check, ArrowRight, HelpCircle, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@tgt/ui-web';
import { Link } from 'react-router-dom';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://portal.ex.com';

const ProPricingPage: React.FC = () => {
  return (
    <div className="bg-white text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900 min-h-screen">
      
      {/* 1. Header Section */}
      <section className="pt-32 pb-20 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary-50/50 via-white to-white border-b border-slate-100">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-display font-extrabold text-slate-950 mb-6 tracking-tight">
              Preços simples para <br />
              <span className="text-gradient-primary">negócios que escalam.</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Escolha o plano ideal para a sua estrutura. Sem taxas ocultas, sem complicações.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 2. Pricing Tiers */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
            
            {/* Starter / Básico */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-soft flex flex-col group hover:border-primary-200 transition-colors">
              <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Iniciante</h3>
                <h2 className="text-4xl font-display font-black text-slate-950">Grátis</h2>
                <p className="text-slate-500 mt-4 text-sm font-medium">Para profissionais que estão começando sua jornada digital.</p>
              </div>
              
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Perfil Profissional Básico',
                  '1 Categoria de Serviço',
                  'Receba Contatos Ilimitados',
                  'Gestão de Leads Básica'
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                    <Check size={18} className="text-primary-500" />
                    {feat}
                  </li>
                ))}
              </ul>

              <a href={`${PORTAL_URL}/cadastro`}>
                <Button variant="outline" className="w-full h-14 rounded-2xl font-bold border-slate-200 hover:bg-slate-50">
                  Começar Grátis
                </Button>
              </a>
            </div>

            {/* Pro / Profissional */}
            <div className="bg-slate-950 rounded-[2.5rem] p-10 border border-primary-500/20 shadow-elevated flex flex-col relative transform scale-105 z-10 text-white">
              <div className="absolute top-0 right-0 -mt-4 mr-8">
                <span className="bg-primary-600 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg">
                  Recomendado
                </span>
              </div>
              
              <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary-400 mb-2">Profissional</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-black">R$ 59</span>
                    <span className="text-slate-400 font-bold text-sm">/mês</span>
                </div>
                <p className="text-slate-400 mt-4 text-sm font-medium leading-relaxed">O motor completo para quem busca autoridade e fechar mais contratos.</p>
              </div>
              
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Tudo do Plano Grátis',
                  'Selo de Verificado (Trust Check)',
                  'Até 3 Categorias de Serviço',
                  'Destaque Prioritário nas Buscas',
                  'Galeria de Fotos Ultra-HD',
                  'Dashboard de Analytics Pro'
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-200 font-medium text-sm">
                    <div className="w-5 h-5 bg-primary-600/20 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-primary-400" />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>

              <a href={`${PORTAL_URL}/cadastro`}>
                <Button className="w-full h-16 rounded-2xl font-black text-lg shadow-lg hover-scale-102">
                  Assinar Agora <ArrowRight size={20} className="ml-2" />
                </Button>
              </a>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-soft flex flex-col group hover:border-slate-300 transition-colors">
              <div className="mb-8">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Corporate</h3>
                <h2 className="text-4xl font-display font-black text-slate-950">Custom</h2>
                <p className="text-slate-500 mt-4 text-sm font-medium leading-relaxed">Soluções customizadas para grandes redes e franquias de serviços.</p>
              </div>
              
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  'Gestão Multi-unidade Centralizada',
                  'Acesso via API Full-Access',
                  'Gerente de Sucesso Dedicado',
                  'Relatórios sob demanda (Custom)',
                  'Contratos White-label'
                ].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                    <Check size={18} className="text-primary-500" />
                    {feat}
                  </li>
                ))}
              </ul>

              <Link to="/contato">
                <Button variant="outline" className="w-full h-14 rounded-2xl font-bold border-slate-200 hover:bg-slate-50">
                  Falar com Consultor
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Social Proof Callout */}
      <section className="py-20 bg-slate-50/50">
         <div className="container mx-auto px-6 max-w-4xl">
            <div className="glass-light p-10 rounded-[3rem] border border-white/60 shadow-lg flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
               <div className="flex -space-x-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-16 h-16 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-sm">
                       <img src={`https://i.pravatar.cc/150?img=${i+20}`} alt="User" />
                    </div>
                  ))}
               </div>
               <div>
                  <div className="flex items-center justify-center md:justify-start gap-1 mb-2">
                     {[...Array(5)].map((_, i) => <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Junte-se a 5.000+ empresas</h4>
                  <p className="text-slate-500 text-sm">"O CONTRATTO Profissional pagou o investimento no primeiro orçamento fechado. Essencial para quem quer escala."</p>
               </div>
            </div>
         </div>
      </section>

      {/* 4. FAQ specific to Billing */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-20">
             <h2 className="text-4xl font-display font-extrabold mb-4 tracking-tight">Perguntas sobre Pagamento</h2>
             <p className="text-slate-500">Tudo o que você precisa saber sobre faturamento e planos.</p>
          </div>

          <div className="space-y-4">
            {[
                { q: "Posso cancelar a qualquer momento?", a: "Sim, você pode cancelar sua assinatura Pro a qualquer momento diretamente no seu dashboard. Não há multas de cancelamento." },
                { q: "Quais as formas de pagamento aceitas?", a: "Aceitamos todos os principais cartões de crédito e PIX para garantir agilidade na ativação do seu plano Pro." },
                { q: "Como funciona o upgrade para Enterprise?", a: "Para o plano Corporate/Enterprise, nossa equipe faz uma análise da sua volumetria e necessidades específicas de API antes de fechar a proposta." },
                { q: "Existe fidelidade?", a: "Oferecemos planos mensais e anuais. No plano anual, você garante um desconto exclusivo mas o compromisso é de 12 meses." }
            ].map((faq, i) => (
               <details key={i} className="group bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between p-8 cursor-pointer select-none">
                     <h3 className="font-bold text-slate-900 group-open:text-primary-600 transition-colors">{faq.q}</h3>
                     <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-open:rotate-45 transition-transform">
                        <HelpCircle size={18} className="text-slate-400" />
                     </span>
                  </summary>
                  <div className="px-8 pb-8 text-slate-600 leading-relaxed text-sm">
                     {faq.a}
                  </div>
               </details>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default ProPricingPage;
