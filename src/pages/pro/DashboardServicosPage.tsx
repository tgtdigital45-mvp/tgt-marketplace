import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

import { useToast } from '../../contexts/ToastContext';
import { Service } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';




import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import ServiceWizard from '@/components/dashboard/ServiceWizard';

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
      // 1. Get Company ID based on user auth ID
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, current_plan_tier, slug')
        .eq('profile_id', user.id)
        .single();

      if (companyError) {
        // Check for specific error codes or message, commonly "Row not found" (PGRST116)
        if (companyError.code === 'PGRST116') {
          console.warn("Company profile not found for this user.");
          // Might happen if user is type 'client' or company registration failed.
        } else {
          throw companyError;
        }
        return;
      }

      if (companyData) {
        setCompany(companyData);

        // 2. Fetch Services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('company_id', companyData.id)
          .order('created_at', { ascending: false });

        if (servicesError) throw servicesError;
        setServices(servicesData || []);
      }

    } catch (err) {
      const error = err as Error;
      console.error("Error fetching services:", error);
      addToast("Erro ao carregar serviços.", "error");
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch Company ID and Services
  useEffect(() => {
    fetchServices();
  }, [user, addToast]);

  const closeWizard = () => {
    setIsWizardOpen(false);
    setEditingService(null); // Reset provided service
    fetchServices(); // Refresh list
  };

  const openWizard = () => {
    setEditingService(null); // Ensure fresh state for new
    setIsWizardOpen(true);
  };

  const openModalToEdit = (service: Service) => {
    setEditingService(service);
    setIsWizardOpen(true); // Open Wizard instead of Modal
  };

  const handleDelete = async (serviceId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este serviço?")) {
      try {
        const { error } = await supabase.from('services').delete().eq('id', serviceId);
        if (error) throw error;

        setServices(prev => prev.filter(s => s.id !== serviceId));
        addToast("Serviço excluído.", 'info');
      } catch (err) {
        const error = err as Error;
        console.error("Error deleting service:", error);
        addToast("Erro ao excluir serviço.", "error");
      }
    }
  };


  if (isWizardOpen) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h2>
        <ServiceWizard
          onCancel={closeWizard}
          initialData={editingService}
          onSuccess={closeWizard}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 p-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Serviços</h3>
            <p className="mt-1 text-sm text-gray-500">
              Adicione, edite ou remova os serviços oferecidos.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            {/* Service Limit Logic */}
            <Button onClick={openWizard} disabled={!company || isLimitReached}>Adicionar Serviço</Button>
            {!company && <p className="text-xs text-red-500 mt-2">Você precisa completar o cadastro da empresa.</p>}
            {isLimitReached && (
              <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                <strong>Limite Atingido:</strong> Seu plano Starter permite apenas 3 serviços ativos.
                <a href={`/dashboard/empresa/${company?.slug}/assinatura`} className="underline ml-1">Faça Upgrade para Ilimitado</a>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                      <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isFetching ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-6 py-4 whitespace-nowrap"><LoadingSkeleton className="h-4 w-32" /></td>
                          <td className="px-6 py-4 whitespace-nowrap"><LoadingSkeleton className="h-4 w-16" /></td>
                          <td className="px-6 py-4 whitespace-nowrap text-right"><LoadingSkeleton className="h-4 w-20 ml-auto" /></td>
                        </tr>
                      ))
                    ) : services.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum serviço cadastrado.</td>
                      </tr>
                    ) : (
                      services.map(service => (
                        <tr key={service.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.starting_price ? `A partir de R$ ${service.starting_price.toFixed(2).replace('.', ',')}` : service.price ? `R$ ${service.price.toFixed(2).replace('.', ',')}` : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => openModalToEdit(service)} className="text-primary-600 hover:text-primary-900">Editar</button>
                            <button onClick={() => handleDelete(service.id)} className="ml-4 text-red-600 hover:text-red-900">Excluir</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};
export default DashboardServicosPage;
