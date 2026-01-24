
import React from 'react';
import InfoPageLayout from '../../components/layout/InfoPageLayout';

const TermsPage: React.FC = () => {
  return (
    <InfoPageLayout
      title="Termos de Uso"
      subtitle="Bem-vindo à TGT. Ao utilizar nossa plataforma, você concorda com as regras abaixo."
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold">1</span>
          O que é a TGT?
        </h2>
        <p className="mb-4 text-gray-600">A TGT é uma plataforma tecnológica que intermedeia a conexão entre Prestadores de Serviços (Profissionais) e Contratantes (Clientes).</p>
        <div className="space-y-4">
          <div className="bg-gray-50 border-l-4 border-brand-primary p-4 rounded-r-xl">
            <h3 className="font-bold text-gray-900">Não somos empregadores</h3>
            <p className="text-sm text-gray-600">Os Profissionais são independentes e não possuem vínculo trabalhista com a TGT.</p>
          </div>
          <div className="bg-gray-50 border-l-4 border-brand-primary p-4 rounded-r-xl">
            <h3 className="font-bold text-gray-900">Não garantimos o resultado</h3>
            <p className="text-sm text-gray-600">A responsabilidade pela qualidade e execução do serviço é exclusiva do Profissional contratado.</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold">2</span>
          Pagamentos e Custódia (Escrow)
        </h2>
        <p className="mb-4 text-gray-600">Para garantir a segurança de ambas as partes, a TGT opera com um sistema de Custódia de Pagamento:</p>
        <ul className="grid sm:grid-cols-2 gap-4">
          <li className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
            <strong className="block text-brand-secondary mb-1">Pagamento Antecipado</strong>
            <span className="text-sm text-gray-600">O Cliente realiza o pagamento na plataforma antes do início do serviço.</span>
          </li>
          <li className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
            <strong className="block text-brand-secondary mb-1">Retenção (Hold)</strong>
            <span className="text-sm text-gray-600">O valor fica retido em uma conta segura da TGT e não é repassado imediatamente ao Profissional.</span>
          </li>
          <li className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
            <strong className="block text-brand-secondary mb-1">Liberação</strong>
            <span className="text-sm text-gray-600">O valor só é liberado ao Profissional após a confirmação de conclusão do serviço na plataforma.</span>
          </li>
          <li className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
            <strong className="block text-brand-secondary mb-1">Disputas</strong>
            <span className="text-sm text-gray-600">Em caso de desacordo, o valor permanece retido até a mediação analisar as evidências.</span>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold">3</span>
          Proibição de "Bypass"
        </h2>
        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
          <p className="text-red-900 font-medium mb-2">⚠️ É estritamente proibido utilizar o chat da TGT para trocar contatos pessoais (telefone, WhatsApp) com o intuito de realizar o pagamento "por fora".</p>
          <p className="text-red-700 text-sm">A detecção dessa prática (monitorada por sistemas automatizados) resultará no <strong>bloqueio imediato e permanente</strong> da conta.</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold">4</span>
          Conteúdo do Usuário
        </h2>
        <p className="text-gray-600">Ao enviar fotos para seu portfólio ou mensagens no chat, você garante que possui os direitos sobre esse conteúdo e licencia a TGT para armazená-lo e exibi-lo na plataforma. Conteúdos ofensivos, discriminatórios ou ilegais serão removidos sem aviso prévio.</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-bold">5</span>
          Cancelamento
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">Pelo Cliente</h3>
            <p className="text-gray-600 text-sm">Cancelamentos com menos de 24h do horário agendado podem estar sujeitos a multa para compensar o deslocamento do Profissional.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-2">Pelo Profissional</h3>
            <p className="text-gray-600 text-sm">O não comparecimento sem aviso (No-Show) penaliza severamente a reputação do perfil.</p>
          </div>
        </div>
      </section>
    </InfoPageLayout>
  );
};
export default TermsPage;
