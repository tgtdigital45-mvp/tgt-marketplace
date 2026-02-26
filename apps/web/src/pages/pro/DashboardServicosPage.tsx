import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { Service } from '@tgt/shared';
import { supabase } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import ServiceWizard from '@/components/dashboard/ServiceWizard';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Plus,
  Package,
  Edit3,
  Trash2,
  AlertTriangle,
  ArrowUpRight,
  Zap,
} from 'lucide-react';

const DashboardServicosPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [company, setCompany] = useState<{ id: string; current_plan_tier: string; slug: string } | null>(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  const isLimitReached = company?.current_plan_tier === 'starter' && services.length >= 3;

  const fetchServices = async () => {
    if (!user) return;
    try {
      const { data: companyData, error: companyError } = await supabase
        .from('companies').select('id, current_plan_tier, slug').eq('profile_id', user.id).single();

      if (companyError) {
        if (companyError.code === 'PGRST116') console.warn('Company profile not found.');
        else throw companyError;
        return;
      }

      if (companyData) {
        setCompany(companyData);
        const { data: servicesData, error: servicesError } = await supabase
          .from('services').select('*').eq('company_id', companyData.id)
          .is('deleted_at', null).order('created_at', { ascending: false });
        if (servicesError) throw servicesError;
        setServices(servicesData || []);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      addToast('Erro ao carregar servicos.', 'error');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => { fetchServices(); }, [user, addToast]);

  const closeWizard = () => { setIsWizardOpen(false); setEditingService(null); fetchServices(); };
  const openWizard = () => { setEditingService(null); setIsWizardOpen(true); };
  const openModalToEdit = (service: Service) => { setEditingService(service); setIsWizardOpen(true); };

  const handleDelete = async (serviceId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este servico?')) {
      try {
        const { error } = await supabase.from('services')
          .update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', serviceId);
        if (error) throw error;
        setServices(prev => prev.filter(s => s.id !== serviceId));
        addToast('Servico excluido.', 'info');
      } catch (err) {
        console.error('Error deleting service:', err);
        addToast('Erro ao excluir servico.', 'error');
      }
    }
  };

  const handleToggleService = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase.from('services').update({ is_active: !currentActive }).eq('id', id);
      if (error) throw error;
      setServices(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentActive } as any : s));
      addToast(!currentActive ? 'Servico ativado.' : 'Servico desativado.', 'info');
    } catch (err) {
      console.error(err);
      addToast('Erro ao atualizar servico.', 'error');
    }
  };

  if (isWizardOpen) {
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <span>Dashboard</span><ChevronRight size={12} />
            <span>Servicos</span><ChevronRight size={12} />
            <span className="text-gray-600 font-medium">{editingService ? 'Editar' : 'Novo'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {editingService ? 'Editar Servico' : 'Novo Servico'}
          </h1>
        </motion.div>
        <ServiceWizard onCancel={closeWizard} initialData={editingService} onSuccess={closeWizard} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">

      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <span>Dashboard</span><ChevronRight size={12} />
            <span className="text-gray-600 font-medium">Servicos</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Meus Servicos
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            {services.length > 0
              ? `${services.length} servico${services.length > 1 ? 's' : ''} cadastrado${services.length > 1 ? 's' : ''}`
              : 'Adicione seus servicos para comecar a receber pedidos'}
          </p>
        </div>
        <Button onClick={openWizard} disabled={!company || isLimitReached} size="sm" className="!rounded-xl">
          <Plus size={14} className="mr-1.5" />
          Adicionar Servico
        </Button>
      </motion.div>

      {/* ─── Plan Limit Warning ──────────────────────────────────────── */}
      {isLimitReached && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3"
        >
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700 leading-relaxed">
            <strong>Limite atingido.</strong> Seu plano Starter permite ate 3 servicos ativos.{' '}
            <a href={`/dashboard/empresa/${company?.slug}/assinatura`} className="font-bold underline inline-flex items-center gap-1">
              Faca upgrade para Ilimitado <ArrowUpRight size={10} />
            </a>
          </div>
        </motion.div>
      )}

      {/* ─── Service Cards ───────────────────────────────────────────── */}
      {isFetching ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <LoadingSkeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : services.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 px-6 text-center"
        >
          <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={24} className="text-primary-400" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-gray-700 mb-1">Nenhum servico cadastrado</h3>
          <p className="text-xs text-gray-400 mb-5 max-w-sm mx-auto">
            Empresas com servicos detalhados recebem ate 4x mais orcamentos. Adicione seu primeiro servico agora.
          </p>
          <Button onClick={openWizard} disabled={!company} size="sm" className="!rounded-xl">
            <Plus size={14} className="mr-1.5" />
            Criar Primeiro Servico
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {services.map((service, idx) => {
            const isActive = (service as any).is_active !== false;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + idx * 0.05 }}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-all ${
                  !isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-primary-50 text-primary-500' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Zap size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{service.title}</h3>
                    <p className="text-xs text-gray-400">
                      {service.starting_price
                        ? `A partir de R$ ${service.starting_price.toFixed(2).replace('.', ',')}`
                        : service.price
                          ? `R$ ${service.price.toFixed(2).replace('.', ',')}`
                          : 'Preco sob consulta'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleService(service.id, isActive)}
                    title={isActive ? 'Desativar' : 'Ativar'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      isActive ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                  {/* Edit */}
                  <button
                    onClick={() => openModalToEdit(service)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    title="Editar"
                  >
                    <Edit3 size={14} />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardServicosPage;
