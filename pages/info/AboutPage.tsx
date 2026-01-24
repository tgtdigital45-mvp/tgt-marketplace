import React from 'react';
import InfoPageLayout from '../../components/layout/InfoPageLayout';
import OptimizedImage from '../../components/ui/OptimizedImage';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  return (
    <InfoPageLayout
      title="O Futuro do Crescimento é Inteligente"
      subtitle="Na TGT, combinamos tecnologia de ponta e estratégia humana para redefinir o que é possível. Somos a True Growth Technologies."
    >
      {/* Mission Section */}
      <div className="mb-20 text-center max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-brand-secondary mb-6 relative inline-block">
          Nossa Missão
          <span className="absolute bottom-0 left-0 w-full h-1 bg-brand-primary/30 rounded-full"></span>
        </h2>
        <p className="text-xl text-gray-700 leading-relaxed font-medium">
          "Nossa missão é descomplicar a inovação. Acreditamos que a Inteligência Artificial não é apenas uma ferramenta, mas o motor que impulsiona negócios para o próximo nível de eficiência e escala. Transformamos dados em decisões e potencial em performance real."
        </p>
      </div>

      {/* Leadership Team */}
      <div className="mb-24">
        <h2 className="text-3xl font-black text-center text-gray-900 mb-12">Quem Somos</h2>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Matheus Celso */}
          <div className="group text-center">
            <div className="relative w-48 h-48 mx-auto mb-6 rounded-full p-2 bg-gradient-to-br from-brand-primary to-brand-secondary shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
              <OptimizedImage
                src="/matheus.celso.jpeg"
                alt="Matheus Celso"
                className="w-full h-full object-cover rounded-full border-4 border-white"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Matheus Celso</h3>
            <p className="text-brand-primary font-bold text-sm uppercase tracking-wider mb-4">CFO (Chief Financial Officer)</p>
            <p className="text-gray-600 text-sm leading-relaxed text-justify px-2">
              Como Diretor Financeiro, Matheus é a âncora estratégica da TGT. Com uma visão analítica aguçada, ele garante que cada passo inovador da empresa esteja alicerçado em solidez financeira. Sua responsabilidade vai além dos números: ele desenha a arquitetura de crescimento sustentável que permite à TGT e aos seus clientes escalarem com segurança e previsibilidade.
            </p>
          </div>

          {/* Eduardo Bombonatto */}
          <div className="group text-center">
            <div className="relative w-48 h-48 mx-auto mb-6 rounded-full p-2 bg-gradient-to-br from-brand-primary to-brand-secondary shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
              <OptimizedImage
                src="/eduardo,bombonatto.jpeg"
                alt="Eduardo Bombonatto"
                className="w-full h-full object-cover rounded-full border-4 border-white"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Eduardo Bombonatto</h3>
            <p className="text-brand-primary font-bold text-sm uppercase tracking-wider mb-4">CTO (Chief Technology Officer)</p>
            <p className="text-gray-600 text-sm leading-relaxed text-justify px-2">
              Eduardo lidera a visão tecnológica da TGT. Como CTO, ele é o arquiteto por trás das nossas soluções de IA e automação. Sua paixão por transformar códigos complexos em ferramentas intuitivas garante que a TGT esteja sempre na vanguarda da inovação, desenvolvendo produtos que não apenas acompanham o mercado, mas ditam as tendências do futuro.
            </p>
          </div>

          {/* Lucas Maciel */}
          <div className="group text-center">
            <div className="relative w-48 h-48 mx-auto mb-6 rounded-full p-2 bg-gradient-to-br from-brand-primary to-brand-secondary shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
              <OptimizedImage
                src="/lucas.maciel.jpeg"
                alt="Lucas Maciel"
                className="w-full h-full object-cover rounded-full border-4 border-white"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Lucas Maciel</h3>
            <p className="text-brand-primary font-bold text-sm uppercase tracking-wider mb-4">CRO (Chief Revenue Officer)</p>
            <p className="text-gray-600 text-sm leading-relaxed text-justify px-2">
              Lucas é a força motriz por trás da expansão da TGT. Como Diretor de Receita, seu foco é alinhar marketing, vendas e sucesso do cliente em uma única estratégia coesa. Ele é especialista em identificar oportunidades ocultas no mercado e traduzir o valor das nossas tecnologias em resultados tangíveis e crescimento acelerado para nossos parceiros.
            </p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="mb-20 bg-gray-50 rounded-3xl p-8 md:p-12">
        <h2 className="text-3xl font-black text-center text-gray-900 mb-12">O DNA da TGT</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4">🚀</div>
            <h3 className="font-bold text-gray-900 mb-2">Inovação Pragmática</h3>
            <p className="text-gray-600 text-sm">Tecnologia que resolve problemas reais.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-2xl mb-4">🔍</div>
            <h3 className="font-bold text-gray-900 mb-2">Transparência Radical</h3>
            <p className="text-gray-600 text-sm">Clareza nos dados, nos processos e nas relações.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
            <div className="w-12 h-12 mx-auto bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-4">📈</div>
            <h3 className="font-bold text-gray-900 mb-2">Crescimento Verdadeiro</h3>
            <p className="text-gray-600 text-sm">Focamos em métricas que importam, não em métricas de vaidade.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-brand-secondary text-white rounded-3xl p-12 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-6">Pronto para crescer com a gente?</h2>
          <Link to="/contato">
            <Button size="lg" className="bg-brand-primary text-white border-none hover:bg-brand-accent hover:text-brand-secondary">
              Fale com um Especialista
            </Button>
          </Link>
        </div>
        {/* Decorative circle */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl"></div>
      </div>
    </InfoPageLayout>
  );
};

export default AboutPage;
