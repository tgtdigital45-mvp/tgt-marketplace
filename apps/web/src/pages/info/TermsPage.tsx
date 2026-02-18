
import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, DollarSign, AlertTriangle, Users, BookOpen, Mail, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '@/components/SEO';

const TermsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('terms-intro');
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Desconto para o header fixo
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  const sections = [
    { id: '1-acceptance', label: '1. Aceitação dos Termos', icon: <FileText size={18} /> },
    { id: '2-service', label: '2. Descrição do Serviço', icon: <BookOpen size={18} /> },
    { id: '3-payment', label: '3. Taxas e Pagamentos', icon: <DollarSign size={18} /> },
    { id: '4-cancellation', label: '4. Cancelamentos', icon: <AlertTriangle size={18} /> },
    { id: '5-responsibility', label: '5. Responsabilidades', icon: <Users size={18} /> },
    { id: '6-ip', label: '6. Propriedade Intelectual', icon: <ShieldCheck size={18} /> },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-24 pt-32 relative">
      <SEO
        title="Termos de Uso | TGT Contratto"
        description="Conheça os Termos e Condições que regem o uso do Marketplace TGT Contratto para Clientes e Empresas."
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block py-1 px-3 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest mb-4 border border-slate-200">
            Legal & Compliance
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
            Termos de Uso
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-6">
            Regras claras e transparentes para garantir uma relação segura e justa entre todas as partes.
          </p>
          <div className="text-sm text-slate-400">
            Última atualização: <span className="font-semibold text-slate-600">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Navigation Sidebar (Sticky) */}
          <div className="lg:col-span-3 lg:sticky lg:top-32 hidden lg:block">
            <nav className="space-y-1">
              <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Índice</div>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${activeSection === section.id
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                    }`}
                >
                  <span className={activeSection === section.id ? 'text-blue-400' : 'text-slate-400'}>
                    {section.icon}
                  </span>
                  {section.label}
                </button>
              ))}
            </nav>
            {/* Support Box */}
            <div className="mt-8 bg-blue-50/50 p-5 rounded-xl border border-blue-100">
              <h4 className="font-bold text-blue-900 text-sm mb-1">Dúvidas Jurídicas?</h4>
              <p className="text-xs text-blue-700 mb-3">Nossa equipe legal está à disposição.</p>
              <a href="mailto:legal@tgtcontratto.com" className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1">
                <Mail size={12} /> legal@tgtcontratto.com
              </a>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-9 space-y-12">

            {/* Intro Box */}
            <div className="bg-white p-8 md:p-10 rounded-[var(--radius-box)] shadow-sm border border-slate-100 mb-10">
              <p className="text-lg text-slate-600 leading-relaxed">
                Bem-vindo à <strong>TGT Contratto</strong>. Estes Termos de Uso regulam o acesso e utilização da nossa plataforma ("Marketplace") que conecta Prestadores de Serviços Qualificados ("Empresas") a Contratantes ("Clientes"). Ao acessar ou utilizar nossos serviços, você concorda expressamente com estes termos.
              </p>
            </div>

            {/* 1. Aceitação */}
            <section id="1-acceptance" className="scroll-mt-32 border-b border-slate-100 pb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="text-slate-300 font-normal">01.</span> Aceitação dos Termos
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p>
                  Ao clicar em "Cadastre-se", "Entrar" ou utilizar qualquer serviço da TGT, você declara ter lido, compreendido e aceito integralmente este documento, bem como nossa <a href="/privacidade" className="text-brand-primary font-medium hover:underline">Política de Privacidade</a>.
                </p>
                <p>
                  Se você estiver utilizando a plataforma em nome de uma pessoa jurídica, você declara ter poderes para vinculá-la a estes termos.
                </p>
              </div>
            </section>

            {/* 2. Descrição do Serviço */}
            <section id="2-service" className="scroll-mt-32 border-b border-slate-100 pb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="text-slate-300 font-normal">02.</span> Descrição do Serviço
              </h2>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-4">
                <p className="text-slate-700 font-medium mb-2">A TGT Contratto atua exclusivamente como Intermediadora Tecnológica.</p>
                <p className="text-sm text-slate-500">
                  Nossa função é fornecer a infraestrutura digital para o encontro entre oferta e demanda. <strong>Não somos fornecedores dos serviços finais</strong> (contabilidade, limpeza, manutenção, etc.) oferecidos pelas Empresas cadastradas, nem empregadores dos profissionais.
                </p>
              </div>
            </section>

            {/* 3. Taxas e Pagamentos */}
            <section id="3-payment" className="scroll-mt-32 border-b border-slate-100 pb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="text-slate-300 font-normal">03.</span> Taxas e Pagamentos
              </h2>
              <div className="space-y-6">
                <p className="text-slate-600">
                  Utilizamos um modelo de segurança financeira baseado em <strong>Escrow (Custódia)</strong> para proteger ambas as partes:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-brand-primary mb-2"><DollarSign size={24} /></div>
                    <h4 className="font-bold text-slate-900 mb-1">1. Retenção</h4>
                    <p className="text-xs text-slate-500">O pagamento do Cliente fica seguro na TGT até a conclusão do serviço.</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-brand-primary mb-2"><ShieldCheck size={24} /></div>
                    <h4 className="font-bold text-slate-900 mb-1">2. Liberação</h4>
                    <p className="text-xs text-slate-500">O valor é liberado para a Empresa somente após o aceite do serviço pelo Cliente.</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-brand-primary mb-2"><AlertTriangle size={24} /></div>
                    <h4 className="font-bold text-slate-900 mb-1">3. Disputa</h4>
                    <p className="text-xs text-slate-500">Em caso de conflito, a TGT atua como mediadora e retém o valor até a resolução.</p>
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-yellow-800 flex items-start gap-3">
                  <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
                  <p><strong>Proibição de Bypass:</strong> É estritamente proibido realizar pagamentos fora da plataforma para serviços iniciados ou negociados aqui. Tal prática remove todas as proteções da TGT e pode levar ao banimento da conta.</p>
                </div>
              </div>
            </section>

            {/* 4. Cancelamentos */}
            <section id="4-cancellation" className="scroll-mt-32 border-b border-slate-100 pb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="text-slate-300 font-normal">04.</span> Cancelamentos e Reembolsos
              </h2>
              <ul className="space-y-3 text-slate-600">
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2.5"></div>
                  <p><strong>Cancelamento Prévio (Cliente):</strong> Reembolso integral se solicitado até 24h antes do início agendado do serviço.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2.5"></div>
                  <p><strong>Cancelamento Tardio (Cliente):</strong> Cancelamentos com menos de 24h podem incorrer em taxa de compensação para o profissional (até 20% do valor do pedido).</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2.5"></div>
                  <p><strong>Cancelamento pela Empresa:</strong> O cancelamento injustificado por parte da empresa impacta negativamente sua reputação e pode gerar suspensão temporária.</p>
                </li>
              </ul>
            </section>

            {/* 5. Responsabilidades */}
            <section id="5-responsibility" className="scroll-mt-32 border-b border-slate-100 pb-10">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="text-slate-300 font-normal">05.</span> Responsabilidades
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Da Empresa Parceira</h4>
                  <p className="text-sm text-slate-500">Executar o serviço com técnica, zelo e pontualidade. Emitir nota fiscal diretamente ao cliente. Manter suas licenças e certificações profissionais válidas.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Do Cliente</h4>
                  <p className="text-sm text-slate-500">Fornecer informações precisas e um ambiente seguro para a execução do serviço. Tratar os profissionais com respeito e cordialidade.</p>
                </div>
              </div>
            </section>

            {/* 6. PI */}
            <section id="6-ip" className="scroll-mt-32">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="text-slate-300 font-normal">06.</span> Propriedade Intelectual
              </h2>
              <p className="text-slate-600 mb-4">
                Todo o design, código, logotipos e conteúdo da plataforma TGT são de propriedade exclusiva da TGT Tecnologia LTDA.
              </p>
              <p className="text-slate-600">
                Ao fazer upload de fotos de portfólio, a Empresa concede à TGT uma licença não exclusiva para exibir esse conteúdo na plataforma para fins de promoção do próprio perfil.
              </p>
            </section>

            {/* Footer Contact */}
            <div className="bg-slate-900 text-slate-300 p-8 rounded-[var(--radius-box)] text-center mt-12">
              <h3 className="text-white font-bold text-xl mb-2">Ainda tem dúvidas?</h3>
              <p className="mb-6 max-w-lg mx-auto text-sm opacity-80">Nossa equipe de suporte jurídico e atendimento está pronta para esclarecer qualquer ponto destes termos.</p>
              <div className="flex justify-center gap-6 text-sm font-semibold">
                <a href="/contato" className="text-white hover:text-brand-primary transition-colors hover:underline">Central de Ajuda</a>
                <span className="text-slate-600">|</span>
                <a href="mailto:support@tgtcontratto.com" className="text-white hover:text-brand-primary transition-colors hover:underline">support@tgtcontratto.com</a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 p-3 bg-brand-primary text-white rounded-full shadow-lg hover:bg-brand-primary-dark transition-colors z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            aria-label="Voltar ao topo"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TermsPage;
