import React from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import Button from '@/components/ui/Button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '@/components/SEO';
import { Rocket, Target, TrendingUp } from 'lucide-react'; // Import icons

const AboutPage: React.FC = () => {
  return (
    <div className="py-8 font-sans">
      <SEO
        title="Sobre a CONTRATTO | O Futuro do Crescimento"
        description="Na CONTRATTO, combinamos tecnologia de ponta e estratégia humana para redefinir o que é possível. Conheça nossa liderança e valores."
        type="website"
      />

      {/* Mission Section */}
      <div className="mb-32 text-center max-w-4xl mx-auto px-4">
        <span className="inline-block py-1.5 px-4 rounded-full bg-blue-50 text-brand-primary text-xs font-bold uppercase tracking-widest mb-8 border border-blue-100">
          Nossa Jornada
        </span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-8 tracking-tight leading-tight">
          Redefinindo o futuro do crescimento
        </h2>
        <p className="text-xl md:text-2xl text-slate-500 leading-relaxed font-medium max-w-3xl mx-auto">
          A CONTRATTO nasceu da necessidade de conectar excelência técnica a demandas reais. Acreditamos que a tecnologia deve ser a ponte, não a barreira. Transformamos dados em decisões e potencial em performance escalável.
        </p>
      </div>

      {/* Leadership Team */}
      <div className="mb-32">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-20 tracking-tight">
          Arquitetos da Inovação
        </h2>

        <div className="grid md:grid-cols-3 gap-10 md:gap-12">
          {/* Matheus Celso */}
          <motion.div whileHover={{ y: -8 }} className="group text-center">
            <div className="relative w-64 h-72 mx-auto mb-8 rounded-[var(--radius-box)] overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-500 bg-slate-100">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
              <OptimizedImage
                src="/matheus.celso.jpeg"
                alt="Matheus Celso"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-1 group-hover:text-brand-primary transition-colors">Matheus Celso</h3>
            <p className="text-brand-primary text-xs font-black uppercase tracking-widest mb-5">CFO & Strategy</p>
            <p className="text-slate-500 text-sm leading-relaxed text-center px-4 max-w-xs mx-auto">
              Diretor Financeiro focado na arquitetura de crescimento sustentável. Sua visão garante solidez e previsibilidade em cada passo.
            </p>
          </motion.div>

          {/* Eduardo Bombonatto */}
          <motion.div whileHover={{ y: -8 }} className="group text-center">
            <div className="relative w-64 h-72 mx-auto mb-8 rounded-[var(--radius-box)] overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-500 bg-slate-100">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
              <OptimizedImage
                src="/eduardo,bombonatto.jpeg"
                alt="Eduardo Bombonatto"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-1 group-hover:text-brand-primary transition-colors">Eduardo Bombonatto</h3>
            <p className="text-brand-primary text-xs font-black uppercase tracking-widest mb-5">CTO & Technology</p>
            <p className="text-slate-500 text-sm leading-relaxed text-center px-4 max-w-xs mx-auto">
              O arquiteto por trás das nossas soluções de IA, garantindo escalabilidade e ferramentas intuitivas para o mercado.
            </p>
          </motion.div>

          {/* Lucas Maciel */}
          <motion.div whileHover={{ y: -8 }} className="group text-center">
            <div className="relative w-64 h-72 mx-auto mb-8 rounded-[var(--radius-box)] overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-500 bg-slate-100">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
              <OptimizedImage
                src="/lucas.maciel.jpeg"
                alt="Lucas Maciel"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-1 group-hover:text-brand-primary transition-colors">Lucas Maciel</h3>
            <p className="text-brand-primary text-xs font-black uppercase tracking-widest mb-5">CRO & Revenue</p>
            <p className="text-slate-500 text-sm leading-relaxed text-center px-4 max-w-xs mx-auto">
              Responsável pela expansão estratégica, traduzindo valor tecnológico em resultados tangíveis para nossos parceiros.
            </p>
          </motion.div>
        </div>
      </div>

      {/* DNA Section */}
      <div className="mb-32">
        <div className="bg-slate-50 rounded-[var(--radius-box)] p-12 md:p-20 border border-slate-100 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -mr-32 -mt-32"></div>

          <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 mb-16 tracking-tight relative z-10">O DNA da CONTRATTO</h2>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {/* Innovation Card */}
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md hover:border-blue-100 transition-all duration-300 group">
              <div className="w-16 h-16 mx-auto bg-blue-50 text-brand-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Rocket size={28} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Inovação Pragmática</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Tecnologia desenhada para resolver problemas complexos com simplicidade absoluta.</p>
            </div>

            {/* Transparency Card */}
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md hover:border-blue-100 transition-all duration-300 group">
              <div className="w-16 h-16 mx-auto bg-blue-50 text-brand-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target size={28} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Transparência Radical</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Clareza nos processos, governança e ética em todas as nossas operações.</p>
            </div>

            {/* Growth Card */}
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md hover:border-blue-100 transition-all duration-300 group">
              <div className="w-16 h-16 mx-auto bg-blue-50 text-brand-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp size={28} strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">Crescimento Factual</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Foco obsessivo em métricas reais de performance e valor de longo prazo.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center bg-slate-900 text-white rounded-[var(--radius-box)] p-16 md:p-24 relative overflow-hidden shadow-2xl mx-auto w-full">
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight leading-tight">Pronto para o próximo nível?</h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-12 text-lg md:text-xl leading-relaxed font-light">
            Seja como parceiro ou cliente, a CONTRATTO é o ambiente onde o crescimento encontra a tecnologia. Vamos construir o futuro juntos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/contato">
              <Button
                size="lg"
                variant="solid"
                className="bg-[#FF6B35] hover:bg-[#E85D2E] text-white border-none px-12 py-4 h-auto text-lg font-bold shadow-lg hover:shadow-orange-500/20 rounded-xl transition-all transform hover:-translate-y-1"
              >
                Falar com Consultor
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-brand-primary/20 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay"></div>
      </div>
    </div>
  );
};

export default AboutPage;
