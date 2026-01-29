import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '../../contexts/ToastContext';
import { Service } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const ServiceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Omit<Service, 'id'> & { id?: string }) => Promise<void>;
  service: Service | null;
  isLoading: boolean;
}> = ({ isOpen, onClose, onSave, service, isLoading }) => {
  const [title, setTitle] = useState(service?.title || '');
  const [description, setDescription] = useState(service?.description || '');
  const [price, setPrice] = useState(service?.price || 0);
  const [duration, setDuration] = useState(service?.duration || '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      id: service?.id,
      title,
      description,
      price: Number(price),
      duration
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{service ? 'Editar Serviço' : 'Adicionar Serviço'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Título do Serviço" value={title} onChange={e => setTitle(e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Preço (R$)" type="number" value={price.toString()} onChange={e => setPrice(Number(e.target.value))} />
            <Input label="Duração (ex: 2 horas)" value={duration} onChange={e => setDuration(e.target.value)} />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" isLoading={isLoading}>Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
};


import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

const DashboardServicosPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const { addToast } = useToast();
  const { user } = useAuth();

  // Fetch Company ID and Services
  useEffect(() => {
    const fetchServices = async () => {
      if (!user) return;

      try {
        // 1. Get Company ID based on user auth ID
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id')
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
          setCompanyId(companyData.id);

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

    fetchServices();
  }, [user, addToast]);

  const openModalToAdd = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const openModalToEdit = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
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

  const handleSave = async (serviceData: Omit<Service, 'id'> & { id?: string }) => {
    if (!companyId) {
      addToast("Erro: Perfil de empresa não encontrado.", "error");
      return;
    }

    setIsLoading(true);
    try {
      if (serviceData.id) {
        // Update
        const { error } = await supabase
          .from('services')
          .update({
            title: serviceData.title,
            description: serviceData.description,
            price: serviceData.price,
            duration: serviceData.duration
          })
          .eq('id', serviceData.id);

        if (error) throw error;

        setServices(prev => prev.map(s => s.id === serviceData.id ? { ...s, ...serviceData } as Service : s));
        addToast("Serviço atualizado com sucesso!", 'success');
      } else {
        // Add
        const { data, error } = await supabase
          .from('services')
          .insert({
            company_id: companyId,
            title: serviceData.title,
            description: serviceData.description,
            price: serviceData.price,
            duration: serviceData.duration
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setServices(prev => [data as Service, ...prev]);
          addToast("Serviço adicionado com sucesso!", 'success');
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      const error = err as Error;
      console.error("Error saving service:", error);
      addToast("Erro ao salvar serviço.", "error");
    } finally {
      setIsLoading(false);
    }
  };


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
            <Button onClick={openModalToAdd} disabled={!companyId}>Adicionar Serviço</Button>
            {!companyId && <p className="text-xs text-red-500 mt-2">Você precisa completar o cadastro da empresa.</p>}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.price ? `R$ ${service.price.toFixed(2).replace('.', ',')}` : '-'}</td>
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
      <ServiceModal
        key={editingService?.id || 'new'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        service={editingService}
        isLoading={isLoading}
      />
    </>
  );
};

export default DashboardServicosPage;
