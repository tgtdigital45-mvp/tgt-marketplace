import React from 'react';
import InfoPageLayout from '../../components/layout/InfoPageLayout';

const PrivacyPage: React.FC = () => {
  return (
    <InfoPageLayout
      title="Política de Privacidade"
      subtitle="Como a TGT trata com transparência e segurança os seus dados."
    >
      <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
        <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm">A</span>
          Dados Coletados
        </h2>
        <p className="mb-6">Baseado em nossa arquitetura de microsserviços, coletamos e processamos as seguintes categorias de dados para viabilizar a plataforma:</p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-gray-50 p-6 rounded-2xl">
            <h3 className="font-bold text-gray-900 mb-2">🆔 Identificação e KYC</h3>
            <p className="text-gray-600 text-sm">Para o <em>User Profile Service</em>. Inclui Nome completo, CPF/CNPJ, verificação de antecedentes e documentos para validação de identidade dos Profissionais.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl">
            <h3 className="font-bold text-gray-900 mb-2">📍 Dados de Localização</h3>
            <p className="text-gray-600 text-sm">Utilizados pelo <em>Matching Service</em>. Coletamos a geolocalização exata ou aproximada para encontrar profissionais num raio de atuação específico.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl">
            <h3 className="font-bold text-gray-900 mb-2">💬 Conteúdo de Comunicação</h3>
            <p className="text-gray-600 text-sm">Processados pelo <em>Chat Service</em>. Mensagens de texto e mídia trocadas internamente são armazenadas para fins de segurança, auditoria e resolução de disputas.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl">
            <h3 className="font-bold text-gray-900 mb-2">💳 Dados Financeiros</h3>
            <p className="text-gray-600 text-sm">Geridos pelo <em>Payment Service</em>. Dados sensíveis (cartão/banco) são processados exclusivamente por gateways terceiros (ex: Stripe/PayPal). A TGT armazena apenas tokens de transação.</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm">B</span>
          Finalidade do Uso
        </h2>
        <ul className="space-y-4">
          <li className="flex items-start bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
            <div className="min-w-[24px] mr-3 text-green-500 font-bold">✓</div>
            <div>
              <strong className="block text-gray-900">Operacionalização do Marketplace</strong>
              <span className="text-gray-600 text-sm">Conectar a demanda (Cliente) à oferta (Profissional) de forma eficiente.</span>
            </div>
          </li>
          <li className="flex items-start bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
            <div className="min-w-[24px] mr-3 text-green-500 font-bold">✓</div>
            <div>
              <strong className="block text-gray-900">Segurança e Moderação</strong>
              <span className="text-gray-600 text-sm">Monitoramento proativo de fraudes e mediação imparcial de conflitos entre as partes.</span>
            </div>
          </li>
          <li className="flex items-start bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
            <div className="min-w-[24px] mr-3 text-green-500 font-bold">✓</div>
            <div>
              <strong className="block text-gray-900">Melhoria do Algoritmo</strong>
              <span className="text-gray-600 text-sm">Uso de dados anonimizados para treinar nosso <em>Matching Engine</em> e melhorar as recomendações.</span>
            </div>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm">C</span>
          Compartilhamento de Dados
        </h2>
        <div className="space-y-6 text-gray-600">
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Entre Usuários</h3>
            <p>O <strong>Cliente</strong> vê o perfil e avaliação do Profissional publicamente. O <strong>Profissional</strong> só tem acesso ao endereço exato e necessidade detalhada do Cliente após o "Match" ser confirmado.</p>
          </div>
          <div className="border-t pt-4">
            <h3 className="font-bold text-gray-900 mb-2">Com Parceiros</h3>
            <p>Compartilhamos estritamente o necessário com gateways de pagamento (para processar cobranças), serviços de notificação (SMS/Email) e autoridades legais caso solicitado judicialmente.</p>
          </div>
        </div>
      </section>
    </InfoPageLayout>
  );
};
export default PrivacyPage;
