import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Share2, UserCheck, Cookie, Lock, Mail } from 'lucide-react';
import SEO from '@/components/SEO';

const PrivacyPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('intro');

  // Scroll spy or simple click handler
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  const sections = [
    { id: 'privacy-collection', label: '1. Coleta de Dados', icon: <Eye size={18} /> },
    { id: 'privacy-usage', label: '2. Uso dos Dados', icon: <Shield size={18} /> },
    { id: 'privacy-sharing', label: '3. Compartilhamento', icon: <Share2 size={18} /> },
    { id: 'privacy-rights', label: '4. Seus Direitos', icon: <UserCheck size={18} /> },
    { id: 'privacy-cookies', label: '5. Política de Cookies', icon: <Cookie size={18} /> },
    { id: 'privacy-security', label: '6. Segurança', icon: <Lock size={18} /> },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-20 pt-32">
      <SEO
        title="Política de Privacidade | TGT Contratto"
        description="Entenda como tratamos seus dados com segurança, transparência e conformidade com a LGPD."
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">

        {/* Header Section */}
        <div className="text-center mb-16">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-brand-primary text-xs font-bold uppercase tracking-widest mb-4 border border-blue-100">
            LGPD & Compliance
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
            Política de Privacidade
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
            Seu guia definitivo sobre como a TGT Contratto protege, processa e valoriza suas informações pessoais.
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-slate-400 bg-white py-2 px-4 rounded-full border border-slate-100 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Sidebar Navigation (Sticky) */}
          <div className="lg:col-span-3 lg:sticky lg:top-32 hidden lg:block">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${activeSection === section.id
                      ? 'bg-brand-primary text-white shadow-md'
                      : 'text-slate-500 hover:bg-white hover:text-brand-primary hover:shadow-sm'
                    }`}
                >
                  <span className={activeSection === section.id ? 'text-white' : 'text-slate-400'}>
                    {section.icon}
                  </span>
                  {section.label}
                </button>
              ))}
            </nav>

            {/* DPO Contact Card */}
            <div className="mt-8 bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
              <h4 className="font-bold text-slate-900 text-sm mb-2">DPO / Encarregado</h4>
              <p className="text-xs text-slate-500 mb-4">Dúvidas sobre seus dados?</p>
              <a href="mailto:dpo@tgtcontratto.com" className="flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-primary-700 transition-colors">
                <Mail size={16} /> dpo@tgtcontratto.com
              </a>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-12">

            {/* Intro */}
            <div className="bg-white p-8 md:p-10 rounded-[var(--radius-box)] shadow-sm border border-slate-100">
              <p className="text-lg text-slate-600 leading-relaxed">
                A <strong>TGT Contratto</strong> ("nós", "nosso") está comprometida com a proteção de sua privacidade. Esta política descreve como coletamos, usamos e protegemos suas informações pessoais ao utilizar nossa plataforma de Marketplace de Serviços, em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>.
              </p>
            </div>

            {/* SECTION 1: COLLECTION */}
            <section id="privacy-collection" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-brand-primary font-bold text-xl shadow-sm">1</div>
                <h2 className="text-2xl font-bold text-slate-900">Coleta de Informações</h2>
              </div>
              <div className="bg-white p-8 rounded-[var(--radius-box)] shadow-sm border border-slate-100 space-y-6">
                <p className="text-slate-600">Coletamos apenas os dados essenciais para a prestação eficiente dos nossos serviços. As categorias de dados incluem:</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">📝 Dados Cadastrais</h3>
                    <p className="text-sm text-slate-500">Nome completo, CPF/CNPJ, e-mail, telefone, data de nascimento e foto de perfil.</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">📍 Dados de Navegação</h3>
                    <p className="text-sm text-slate-500">Endereço IP, geolocalização (quando autorizada), tipo de dispositivo, navegador e páginas visitadas.</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">💳 Dados Financeiros</h3>
                    <p className="text-sm text-slate-500">Para processamento de pagamentos. <strong>Nota:</strong> Não armazenamos números completos de cartão de crédito em nossos servidores; utilizamos gateways seguros (Stripe/Pagar.me).</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">🤝 Dados de Serviço</h3>
                    <p className="text-sm text-slate-500">Histórico de orçamentos, mensagens trocadas no chat da plataforma, avaliações e detalhes dos pedidos.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: USAGE */}
            <section id="privacy-usage" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-brand-primary font-bold text-xl shadow-sm">2</div>
                <h2 className="text-2xl font-bold text-slate-900">Uso dos Dados</h2>
              </div>
              <div className="bg-white p-8 rounded-[var(--radius-box)] shadow-sm border border-slate-100">
                <ul className="space-y-4">
                  {[
                    { title: "Viabilizar o Marketplace", desc: "Conectar clientes a prestadores de serviço e processar transações com segurança." },
                    { title: "Melhoria de Serviços", desc: "Analisar métricas de uso para otimizar a experiência do usuário e corrigir falhas." },
                    { title: "Comunicação", desc: "Enviar notificações sobre status de pedidos, atualizações de conta e ofertas relevantes (com opção de opt-out)." },
                    { title: "Segurança e Prevenção à Fraude", desc: "Monitorar atividades suspeitas para proteger a comunidade TGT." }
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start p-4 hover:bg-slate-50 rounded-lg transition-colors">
                      <div className="min-w-[24px] mr-4 mt-1 text-green-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <div>
                        <strong className="block text-slate-900 font-bold mb-1">{item.title}</strong>
                        <span className="text-slate-600 text-sm leading-relaxed">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* SECTION 3: SHARING */}
            <section id="privacy-sharing" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-brand-primary font-bold text-xl shadow-sm">3</div>
                <h2 className="text-2xl font-bold text-slate-900">Compartilhamento</h2>
              </div>
              <div className="bg-white p-8 rounded-[var(--radius-box)] shadow-sm border border-slate-100">
                <p className="text-slate-600 mb-6 group-first:">Não vendemos seus dados. Compartilhamos informações apenas nas seguintes circunstâncias:</p>
                <div className="space-y-6">
                  <div className="border-l-4 border-brand-primary pl-6 py-1">
                    <h4 className="font-bold text-slate-900">Prestadores de Serviço Terceirizados</h4>
                    <p className="text-sm text-slate-500 mt-1">Empresas que nos auxiliam na operação (hospedagem, processamento de pagamentos, análise de dados), sob estritos acordos de confidencialidade.</p>
                  </div>
                  <div className="border-l-4 border-brand-primary pl-6 py-1">
                    <h4 className="font-bold text-slate-900">Obrigação Legal</h4>
                    <p className="text-sm text-slate-500 mt-1">Quando exigido por lei, ordem judicial ou autoridade governamental competente.</p>
                  </div>
                  <div className="border-l-4 border-brand-primary pl-6 py-1">
                    <h4 className="font-bold text-slate-900">Entre Usuários (Contexto do Pedido)</h4>
                    <p className="text-sm text-slate-500 mt-1">Para execução do serviço, dados necessários (como endereço do serviço para o prestador contratado) são compartilhados.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: RIGHTS */}
            <section id="privacy-rights" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-brand-primary font-bold text-xl shadow-sm">4</div>
                <h2 className="text-2xl font-bold text-slate-900">Seus Direitos (LGPD)</h2>
              </div>
              <div className="bg-gradient-to-br from-brand-primary-900 to-slate-900 text-white p-10 rounded-[var(--radius-box)] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 grid md:grid-cols-2 gap-8">
                  <div>
                    <p className="mb-6 font-light opacity-90">Você tem total controle sobre seus dados. Conforme a LGPD, você pode solicitar a qualquer momento:</p>
                    <ul className="space-y-3 text-sm font-medium">
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> Acesso aos dados que temos sobre você</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> Correção de dados incompletos ou errados</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> Anonimização ou bloqueio de dados</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> Revogação do consentimento</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> Exclusão definitiva de seus dados</li>
                    </ul>
                  </div>
                  <div className="flex flex-col justify-center items-start bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/10">
                    <h4 className="font-bold text-lg mb-2">Solicitar Atendimento</h4>
                    <p className="text-xs text-blue-200 mb-4">Para exercer seus direitos, entre em contato com nosso DPO.</p>
                    <a href="mailto:dpo@tgtcontratto.com" className="w-full text-center bg-white text-brand-primary-900 font-bold py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                      Enviar Solicitação
                    </a>
                  </div>

                </div>
              </div>
            </section>

            {/* SECTION 5: COOKIES */}
            <section id="privacy-cookies" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-brand-primary font-bold text-xl shadow-sm">5</div>
                <h2 className="text-2xl font-bold text-slate-900">Política de Cookies</h2>
              </div>
              <div className="bg-white rounded-[var(--radius-box)] overflow-hidden shadow-sm border border-slate-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th scope="col" className="px-6 py-4">Tipo</th>
                        <th scope="col" className="px-6 py-4">Propósito</th>
                        <th scope="col" className="px-6 py-4">Duração</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white border-b border-slate-50">
                        <th scope="row" className="px-6 py-4 font-bold text-slate-900">Essenciais</th>
                        <td className="px-6 py-4">Necessários para o site funcionar (login, segurança, carrinho).</td>
                        <td className="px-6 py-4">Sessão</td>
                      </tr>
                      <tr className="bg-white border-b border-slate-50">
                        <th scope="row" className="px-6 py-4 font-bold text-slate-900">Analíticos</th>
                        <td className="px-6 py-4">Entender como os visitantes interagem com o site (Google Analytics).</td>
                        <td className="px-6 py-4">2 anos</td>
                      </tr>
                      <tr className="bg-white">
                        <th scope="row" className="px-6 py-4 font-bold text-slate-900">Marketing</th>
                        <td className="px-6 py-4">Rastrear visitantes para exibir anúncios relevantes.</td>
                        <td className="px-6 py-4">1 ano</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td colSpan={3} className="px-6 py-3 text-xs text-center text-slate-400">
                          Você pode gerenciar as preferências de cookies nas configurações do seu navegador.
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
