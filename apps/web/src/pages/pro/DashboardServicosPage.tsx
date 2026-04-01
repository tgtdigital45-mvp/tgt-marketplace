import React, { useState, useEffect } from 'react';

import { useToast } from '@/contexts/ToastContext';
import { Service } from '@tgt/core';
import { supabase } from '@tgt/core';
import { useAuth } from '@/contexts/AuthContext';

import ServiceWizard from '@/components/dashboard/ServiceWizard';
import { motion } from 'framer-motion';
import { Button, LoadingSkeleton } from '@tgt/ui-web';
import BoostModal from '@/components/dashboard/BoostModal';

import {
  ChevronRight,
  Plus,
  Package,
  Edit3,
  Trash2,
  AlertTriangle,
  ArrowUpRight,
  Zap,
  Sparkles,
  Tag
} from 'lucide-react';

const DashboardServicosPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
  const [serviceToBoost, setServiceToBoost] = useState<Service | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [company, setCompany] = useState<{ id: string; current_plan_tier: string; slug: string; is_sponsored?: boolean } | null>(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  const isLimitReached = company?.current_plan_tier === 'starter' && services.length >= 3;

  const fetchServices = async () => {
    if (!user) return;
    try {
      const { data: companyData, error: companyError } = await supabase
        .from('companies').select('id, current_plan_tier, slug, is_sponsored').eq('profile_id', user.id).single();

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('boost_success')) {
      addToast('Pagamento em processamento! O impulsionamento será ativado em instantes.', 'success');
      // Remover param da URL sem recarregar
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('boost_cancel')) {
      addToast('O processo de impulsionamento foi cancelado.', 'info');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [addToast]);

  useEffect(() => { fetchServices(); }, [user, addToast]);

  const closeWizard = () => { setIsWizardOpen(false); setEditingService(null); fetchServices(); };
  const openWizard = () => { setEditingService(null); setIsWizardOpen(true); };
  const openModalToEdit = (service: Service) => { setEditingService(service); setIsWizardOpen(true); };
  const openBoostModal = (service: Service) => { setServiceToBoost(service); setIsBoostModalOpen(true); };

  const handleBoostConfirm = async (type: 'service' | 'company') => {
    if (!user || !company) return;
    
    try {
      // IDs de preços criados no Stripe para a Fase 4
      const PRICE_IDS = {
        service: 'price_1THED6E72T1QHvIbOHzxbLQg', // R$ 19,90 /mês
        company: 'price_1THEDJE72T1QHvIbeUa6wHvf'  // R$ 49,90 /mês
      };

      const { data, error } = await supabase.functions.invoke('create-boost-checkout', {
        body: {
          price_id: PRICE_IDS[type],
          boost_type: type,
          service_id: type === 'service' ? serviceToBoost?.id : null,
          success_url: `${window.location.origin}/dashboard/servicos?boost_success=true`,
          cancel_url: `${window.location.origin}/dashboard/servicos?boost_cancel=true`,
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não retornada.');
      }
    } catch (err) {
      console.error('Erro ao iniciar checkout de boost:', err);
      addToast('Erro ao iniciar pagamento. Tente novamente.', 'error');
    }
  };

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
      <div className="w-full space-y-5">
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
        <ServiceWizard onCancel={closeWizard} initialData={editingService as any} onSuccess={closeWizard} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 sm:space-y-6">

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
            const isSponsored = (service as any).is_sponsored || company?.is_sponsored;
            const isPromo = !!(service as any).promotional_price;

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
                      {(service as any).promotional_price 
                        ? `A partir de R$ ${(service as any).promotional_price.toFixed(2).replace('.', ',')}`
                        : service.starting_price
                          ? `A partir de R$ ${service.starting_price.toFixed(2).replace('.', ',')}`
                          : service.price
                            ? `R$ ${service.price.toFixed(2).replace('.', ',')}`
                            : 'Preco sob consulta'}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {isPromo && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[9px] font-black uppercase tracking-tighter">
                          <Tag size={10} /> Oferta
                        </span>
                      )}
                      {isSponsored && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[9px] font-black uppercase tracking-tighter">
                          <Sparkles size={10} /> Patrocinado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {/* Boost */}
                  <button
                    onClick={() => openBoostModal(service)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-500/10 dark:to-indigo-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-all border border-blue-100/50 dark:border-blue-500/20 group"
                    title="Impulsionar"
                  >
                    <Sparkles size={14} className="group-hover:scale-110 transition-transform" fill="currentColor" />
                    <span className="hidden sm:inline">Impulsionar</span>
                  </button>

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

      <BoostModal 
        isOpen={isBoostModalOpen}
        onClose={() => setIsBoostModalOpen(false)}
        serviceTitle={serviceToBoost?.title}
        onConfirm={handleBoostConfirm}
      />
    </div>
  );
};

export default DashboardServicosPage;
