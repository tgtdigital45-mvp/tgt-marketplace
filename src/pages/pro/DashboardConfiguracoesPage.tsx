import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useCompany } from '../../contexts/CompanyContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

const DashboardConfiguracoesPage: React.FC = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('geral');
  const [isLoading, setIsLoading] = useState(false);

  // Mock states for UI demonstration
  const [notifications, setNotifications] = useState({
    email_orders: true,
    email_messages: true,
    email_marketing: false,
    sms_alerts: false
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      addToast('Configurações gerais salvas com sucesso!', 'success');
      setIsLoading(false);
    }, 1000);
  };

  const handleSaveNotifications = () => {
    addToast('Preferências de notificação atualizadas.', 'success');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      addToast('As senhas não coincidem.', 'error');
      return;
    }
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.new });

      if (error) throw error;

      addToast('Senha alterada com sucesso!', 'success');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      addToast(error.message || 'Erro ao alterar senha.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'geral', label: 'Geral' },
    { id: 'notificacoes', label: 'Notificações' },
    { id: 'seguranca', label: 'Segurança' },
    { id: 'horarios', label: 'Horários' },
    { id: 'danger', label: 'Zona de Perigo' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie as preferências da sua conta e da sua empresa.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === tab.id
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

        {/* GERAL */}
        {activeTab === 'geral' && (
          <form onSubmit={handleSaveGeneral} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    disabled
                    value={company?.companyName || ''}
                    className="flex-1 focus:ring-brand-primary focus:border-brand-primary block w-full min-w-0 rounded-md sm:text-sm border-gray-300 bg-gray-50 text-gray-500"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">O nome da empresa só pode ser alterado via suporte.</p>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">Slug (URL)</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    tgt.com/
                  </span>
                  <input
                    type="text"
                    disabled
                    value={company?.slug || ''}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md sm:text-sm border-gray-300 bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button type="submit" isLoading={isLoading}>Salvar Alterações</Button>
            </div>
          </form>
        )}

        {/* NOTIFICAÇÕES */}
        {activeTab === 'notificacoes' && (
          <div className="space-y-6 max-w-2xl">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="email_orders"
                    type="checkbox"
                    checked={notifications.email_orders}
                    onChange={(e) => setNotifications({ ...notifications, email_orders: e.target.checked })}
                    className="focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="email_orders" className="font-medium text-gray-700">Novos Pedidos</label>
                  <p className="text-gray-500">Receba um e-mail quando um novo pedido for criado.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="email_messages"
                    type="checkbox"
                    checked={notifications.email_messages}
                    onChange={(e) => setNotifications({ ...notifications, email_messages: e.target.checked })}
                    className="focus:ring-brand-primary h-4 w-4 text-brand-primary border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="email_messages" className="font-medium text-gray-700">Mensagens</label>
                  <p className="text-gray-500">Receba notificações de novas mensagens no chat.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <Button onClick={handleSaveNotifications}>Salvar Preferências</Button>
            </div>
          </div>
        )}

        {/* SEGURANÇA */}
        {activeTab === 'seguranca' && (
          <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
            <h3 className="text-lg font-medium text-gray-900">Alterar Senha</h3>

            <Input
              label="Nova Senha"
              type="password"
              value={passwordData.new}
              onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
              required
              minLength={6}
            />

            <Input
              label="Confirmar Nova Senha"
              type="password"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
              required
              minLength={6}
            />

            <div className="pt-2">
              <Button type="submit" isLoading={isLoading}>Atualizar Senha</Button>
            </div>
          </form>
        )}

        {/* HORÁRIOS */}
        {activeTab === 'horarios' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    A edição avançada de horários está sendo atualizada. Por enquanto, seu perfil exibe "Segunda a Sexta, 09:00 às 18:00".
                  </p>
                </div>
              </div>
            </div>

            {/* Placeholder for the hours editor requested previously */}
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <span className="font-medium text-gray-700">Segunda a Sexta</span>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="px-3 py-1 border rounded bg-gray-50">09:00</div>
                <span>até</span>
                <div className="px-3 py-1 border rounded bg-gray-50">18:00</div>
              </div>
            </div>
          </div>
        )}

        {/* DANGER ZONE */}
        {activeTab === 'danger' && (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-red-800">Excluir Conta</h3>
              <p className="mt-2 text-sm text-red-600 max-w-xl">
                Ao excluir sua conta, todos os seus dados, histórico de serviços e informações da empresa serão permanentemente removidos. Esta ação não pode ser desfeita.
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
                  onClick={() => addToast('Entre em contato com o suporte para excluir sua conta.', 'info')}
                >
                  Excluir minha conta
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardConfiguracoesPage;