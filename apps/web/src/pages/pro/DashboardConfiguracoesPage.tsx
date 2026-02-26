import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@tgt/shared';
import { Switch } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Settings,
  Bell,
  Lock,
  Clock,
  AlertTriangle,
  Link as LinkIcon,
  Calendar,
} from 'lucide-react';

type TabKey = 'geral' | 'notificacoes' | 'seguranca' | 'horarios' | 'danger';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'geral', label: 'Geral', icon: <Settings size={14} /> },
  { key: 'notificacoes', label: 'Notificacoes', icon: <Bell size={14} /> },
  { key: 'seguranca', label: 'Seguranca', icon: <Lock size={14} /> },
  { key: 'horarios', label: 'Horarios', icon: <Clock size={14} /> },
  { key: 'danger', label: 'Perigo', icon: <AlertTriangle size={14} /> },
];

// ─── Toggle Row ─────────────────────────────────────────────────────────────────
const ToggleRow = ({ label, description, enabled, onChange }: {
  label: string; description: string; enabled: boolean; onChange: (val: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-3">
    <div className="min-w-0 mr-4">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    </div>
    <Switch
      checked={enabled}
      onChange={onChange}
      className={`${enabled ? 'bg-primary-500' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none flex-shrink-0`}
    >
      <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
    </Switch>
  </div>
);

const DashboardConfiguracoesPage: React.FC = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('geral');
  const [isLoading, setIsLoading] = useState(false);

  const [notifications, setNotifications] = useState({
    email_orders: true,
    email_messages: true,
    email_marketing: false,
    sms_alerts: false,
  });

  const [passwordData, setPasswordData] = useState({ new: '', confirm: '' });

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      addToast('Configuracoes gerais salvas com sucesso!', 'success');
      setIsLoading(false);
    }, 1000);
  };

  const handleSaveNotifications = () => {
    addToast('Preferencias de notificacao atualizadas.', 'success');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      addToast('As senhas nao coincidem.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.new });
      if (error) throw error;
      addToast('Senha alterada com sucesso!', 'success');
      setPasswordData({ new: '', confirm: '' });
    } catch (error: any) {
      addToast(error.message || 'Erro ao alterar senha.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">

      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
          <span>Dashboard</span><ChevronRight size={12} />
          <span className="text-gray-600 font-medium">Configuracoes</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Configuracoes</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
          Gerencie as preferencias da sua conta e empresa
        </p>
      </motion.div>

      {/* ─── Tab Navigation (Pill Style) ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : tab.key === 'danger'
                  ? 'text-red-400 hover:text-red-600 hover:bg-white/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            <span className={activeTab === tab.key ? (tab.key === 'danger' ? 'text-red-500' : 'text-primary-500') : ''}>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* ─── Tab Content ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 lg:p-8"
        >

          {/* ═══ GERAL ═══ */}
          {activeTab === 'geral' && (
            <form onSubmit={handleSaveGeneral} className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Informacoes da Conta</h3>
                <p className="text-xs text-gray-400 mt-0.5">Dados basicos da sua empresa na plataforma</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
                    {company?.company_name || '—'}
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400">Altere o nome via pagina de Perfil.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                    <span className="px-3 py-3 bg-gray-100 text-gray-400 text-xs font-medium border-r border-gray-200">
                      <LinkIcon size={12} className="inline mr-1" />contratto.com/
                    </span>
                    <span className="px-3 py-3 text-sm text-gray-500">{company?.slug || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button type="submit" isLoading={isLoading} size="sm" className="!rounded-xl">
                  Salvar Alteracoes
                </Button>
              </div>
            </form>
          )}

          {/* ═══ NOTIFICACOES ═══ */}
          {activeTab === 'notificacoes' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Preferencias de Notificacao</h3>
                <p className="text-xs text-gray-400 mt-0.5">Controle como e quando voce recebe alertas</p>
              </div>

              <div className="divide-y divide-gray-50">
                <ToggleRow
                  label="Novos Pedidos"
                  description="Receba um e-mail quando um novo pedido for criado"
                  enabled={notifications.email_orders}
                  onChange={v => setNotifications(s => ({ ...s, email_orders: v }))}
                />
                <ToggleRow
                  label="Mensagens"
                  description="Notificacoes de novas mensagens no chat"
                  enabled={notifications.email_messages}
                  onChange={v => setNotifications(s => ({ ...s, email_messages: v }))}
                />
                <ToggleRow
                  label="Marketing"
                  description="Dicas, promocoes e novidades da plataforma"
                  enabled={notifications.email_marketing}
                  onChange={v => setNotifications(s => ({ ...s, email_marketing: v }))}
                />
                <ToggleRow
                  label="Alertas SMS"
                  description="Receba notificacoes urgentes via SMS"
                  enabled={notifications.sms_alerts}
                  onChange={v => setNotifications(s => ({ ...s, sms_alerts: v }))}
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button onClick={handleSaveNotifications} size="sm" className="!rounded-xl">
                  Salvar Preferencias
                </Button>
              </div>
            </div>
          )}

          {/* ═══ SEGURANCA ═══ */}
          {activeTab === 'seguranca' && (
            <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Alterar Senha</h3>
                <p className="text-xs text-gray-400 mt-0.5">Mantenha sua conta segura com uma senha forte</p>
              </div>

              <Input
                label="Nova Senha"
                type="password"
                value={passwordData.new}
                onChange={e => setPasswordData(s => ({ ...s, new: e.target.value }))}
                required
                minLength={6}
                placeholder="Minimo 6 caracteres"
              />
              <Input
                label="Confirmar Nova Senha"
                type="password"
                value={passwordData.confirm}
                onChange={e => setPasswordData(s => ({ ...s, confirm: e.target.value }))}
                required
                minLength={6}
                placeholder="Repita a nova senha"
              />

              <div className="pt-2">
                <Button type="submit" isLoading={isLoading} size="sm" className="!rounded-xl">
                  Atualizar Senha
                </Button>
              </div>
            </form>
          )}

          {/* ═══ HORARIOS ═══ */}
          {activeTab === 'horarios' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Horarios de Atendimento</h3>
                <p className="text-xs text-gray-400 mt-0.5">Configure sua disponibilidade na pagina de Agenda</p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <Calendar size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    A edicao completa de horarios foi movida para a pagina <strong>Agenda</strong>, onde voce pode definir horarios por dia da semana, intervalos e feriados.
                  </p>
                  <a
                    href={`/dashboard/empresa/${company?.slug}/agenda`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 mt-2"
                  >
                    Ir para Agenda <ChevronRight size={12} />
                  </a>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">Segunda a Sexta</span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg font-medium">09:00</span>
                    <span>ate</span>
                    <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg font-medium">18:00</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ DANGER ZONE ═══ */}
          {activeTab === 'danger' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-red-700">Zona de Perigo</h3>
                <p className="text-xs text-gray-400 mt-0.5">Acoes irreversiveis que afetam permanentemente sua conta</p>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 sm:p-6">
                <h4 className="text-sm font-bold text-red-800 mb-2">Excluir Conta</h4>
                <p className="text-xs text-red-600 leading-relaxed mb-4 max-w-lg">
                  Ao excluir sua conta, todos os seus dados, historico de servicos e informacoes da empresa serao permanentemente removidos. Esta acao nao pode ser desfeita.
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-700 bg-red-100 hover:bg-red-200 font-bold rounded-xl text-xs transition-colors"
                  onClick={() => addToast('Entre em contato com o suporte para excluir sua conta.', 'info')}
                >
                  <AlertTriangle size={14} />
                  Excluir minha conta
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DashboardConfiguracoesPage;
