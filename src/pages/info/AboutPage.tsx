import React from 'react';
import InfoPageLayout from '../../components/layout/InfoPageLayout';
import OptimizedImage from '../../components/ui/OptimizedImage';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AboutPage: React.FC = () => {
  return (
    <InfoPageLayout
      title="O Futuro do Crescimento é Inteligente"
      subtitle="Na TGT, combinamos tecnologia de ponta e estratégia humana para redefinir o que é possível. Somos a True Growth Technologies."
    >
      {/* Mission Section */}
      <div className="mb-24 text-center max-w-3xl mx-auto">
        <span className="inline-block py-1 px-3 rounded-full bg-primary-50 text-primary-600 text-[10px] font-bold uppercase tracking-widest mb-6 border border-primary-100">
          NOSSA JORNADA
        </span>
        <h2 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">
          Redefinindo o futuro do crescimento
        </h2>
        <p className="text-xl text-slate-500 leading-relaxed font-medium">
          A TGT Contratto nasceu da necessidade de conectar excelência técnica a demandas reais. Acreditamos que a tecnologia deve ser a ponte, não a barreira. Transformamos dados em decisões e potencial em performance escalável.
        </p>
      </div>

      {/* Leadership Team */}
      <div className="mb-32">
        <h2 className="text-4xl font-bold text-center text-slate-900 mb-16 tracking-tight">Arquitetos da Inovação</h2>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Matheus Celso */}
          <motion.div whileHover={{ y: -5 }} className="group text-center">
            <div className="relative w-48 h-48 mx-auto mb-8 rounded-full p-1.5 bg-slate-100 shadow-soft overflow-hidden group-hover:bg-primary-600 transition-colors duration-300">
              <OptimizedImage
                src="/matheus.celso.jpeg"
                alt="Matheus Celso"
                className="w-full h-full object-cover rounded-full border-4 border-white"
              />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Matheus Celso</h3>
            <p className="text-primary-600 font-bold text-xs uppercase tracking-widest mb-4">CFO & Strategy</p>
            <p className="text-slate-500 text-sm leading-relaxed text-justify px-2">
              Diretor Financeiro focado na arquitetura de crescimento sustentável. Sua visão garante que a inovação da TGT esteja sempre alicerçada em solidez e previsibilidade financeira.
            </p>
          </motion.div>

          {/* Eduardo Bombonatto */}
          <motion.div whileHover={{ y: -5 }} className="group text-center">
            <div className="relative w-48 h-48 mx-auto mb-8 rounded-full p-1.5 bg-slate-100 shadow-soft overflow-hidden group-hover:bg-primary-600 transition-colors duration-300">
              <OptimizedImage
                src="/eduardo,bombonatto.jpeg"
                alt="Eduardo Bombonatto"
                className="w-full h-full object-cover rounded-full border-4 border-white"
              />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Eduardo Bombonatto</h3>
            <p className="text-primary-600 font-bold text-xs uppercase tracking-widest mb-4">CTO & Technology</p>
            <p className="text-slate-500 text-sm leading-relaxed text-justify px-2">
              Lidera a visão tecnológica da TGT. Como CTO, ele é o arquiteto por trás das nossas soluções de IA, garantindo escalabilidade e ferramentas intuitivas para o mercado.
            </p>
          </motion.div>

          {/* Lucas Maciel */}
          <motion.div whileHover={{ y: -5 }} className="group text-center">
            <div className="relative w-48 h-48 mx-auto mb-8 rounded-full p-1.5 bg-slate-100 shadow-soft overflow-hidden group-hover:bg-primary-600 transition-colors duration-300">
              <OptimizedImage
                src="/lucas.maciel.jpeg"
                alt="Lucas Maciel"
                className="w-full h-full object-cover rounded-full border-4 border-white"
              />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Lucas Maciel</h3>
            <p className="text-primary-600 font-bold text-xs uppercase tracking-widest mb-4">CRO & Revenue</p>
            <p className="text-slate-500 text-sm leading-relaxed text-justify px-2">
              Responsável pela expansão e alinhamento estratégico de mercado. Identifica oportunidades e traduz valor tecnológico em resultados tangíveis para nossos parceiros.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Values */}
      <div className="mb-24 bg-slate-50 rounded-[32px] p-8 md:p-16 border border-slate-100 shadow-soft">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-16 tracking-tight">O DNA da TGT</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center hover:shadow-soft transition-all duration-300">
            <div className="w-14 h-14 mx-auto bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center text-2xl mb-6">🚀</div>
            <h3 className="font-bold text-slate-900 mb-3 tracking-tight">Inovação Pragmática</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Tecnologia desenhada para resolver problemas complexos com simplicidade.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center hover:shadow-soft transition-all duration-300">
            <div className="w-14 h-14 mx-auto bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center text-2xl mb-6">🔍</div>
            <h3 className="font-bold text-slate-900 mb-3 tracking-tight">Transparência Radical</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Clareza nos processos e governança em todas as nossas operações.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center hover:shadow-soft transition-all duration-300">
            <div className="w-14 h-14 mx-auto bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center text-2xl mb-6">📈</div>
            <h3 className="font-bold text-slate-900 mb-3 tracking-tight">Crescimento Factual</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Foco em métricas reais de performance e valor de mercado de longo prazo.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-slate-900 text-white rounded-[32px] p-16 relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-6 tracking-tight">Pronto para o próximo nível?</h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-10 text-lg leading-relaxed">
            Seja como parceiro ou cliente, a TGT é o ambiente onde o crescimento encontra a tecnologia.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contato">
              <Button size="lg" className="bg-primary-600 text-white border-none px-10 shadow-xl hover:bg-primary-700">
                Falar com Consultor
              </Button>
            </Link>
          </div>
        </div>
        {/* Decorative circle */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-slate-100/5 rounded-full blur-3xl"></div>
      </div>
    </InfoPageLayout>
  );
};

export default AboutPage;
