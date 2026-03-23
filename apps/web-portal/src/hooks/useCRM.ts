import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@tgt/core';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'react-hot-toast';

export interface CRMStage {
  id: string;
  pipeline_id: string;
  name: string;
  order_index: number;
  color: string | null;
}

export interface CRMPipeline {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
}

export interface CRMItem {
  id: string;
  crm_stage_id: string | null;
  status: string;
  price: number;
  service_title: string;
  created_at: string;
  type: 'order' | 'quote';
  customer_id: string;
  customer_name: string;
}

export const useCRM = () => {
  const { company } = useCompany();
  const queryClient = useQueryClient();

  // Fetch Pipelines
  const { data: pipelines, isLoading: isLoadingPipelines } = useQuery({
    queryKey: ['crm_pipelines', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase
        .from('crm_pipelines')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as CRMPipeline[];
    },
    enabled: !!company?.id,
  });

  const activePipeline = pipelines?.find(p => p.is_default) || pipelines?.[0];

  // Fetch Stages
  const { data: stages, isLoading: isLoadingStages } = useQuery({
    queryKey: ['crm_stages', activePipeline?.id],
    queryFn: async () => {
      if (!activePipeline?.id) return [];
      const { data, error } = await supabase
        .from('crm_stages')
        .select('*')
        .eq('pipeline_id', activePipeline.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as CRMStage[];
    },
    enabled: !!activePipeline?.id,
  });

  // Fetch Items (Orders and Quotes combined for the pipeline)
  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['crm_items', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      // Fetch Orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id, 
          crm_stage_id, 
          status, 
          price, 
          service_title, 
          created_at,
          buyer_id,
          buyer:buyer_id (full_name)
        `)
        .eq('seller_id', company.profile_id);

      if (ordersError) throw ordersError;

      // Fetch Quotes
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          id, 
          crm_stage_id, 
          status, 
          budget_expectation, 
          description, 
          created_at,
          user_id,
          service:service_id (title, company_id),
          user:user_id (full_name)
        `)
        .eq('service.company_id', company.id); // Filtering quotes via joined services table

      if (quotesError) throw quotesError;

      const formattedOrders: CRMItem[] = orders.map(o => ({
        id: o.id,
        crm_stage_id: o.crm_stage_id,
        status: o.status,
        price: o.price,
        service_title: o.service_title || 'Serviço s/ título',
        created_at: o.created_at || '',
        type: 'order' as const,
        customer_id: o.buyer_id,
        customer_name: (o.buyer as any)?.full_name || 'Cliente Desconhecido'
      }));

      const formattedQuotes: CRMItem[] = (quotes || []).map(q => ({
        id: q.id,
        crm_stage_id: q.crm_stage_id,
        status: q.status,
        price: q.budget_expectation || 0,
        service_title: (q.service as any)?.title || 'Solicitação de Orçamento',
        created_at: q.created_at || '',
        type: 'quote' as const,
        customer_id: q.user_id,
        customer_name: (q.user as any)?.full_name || 'Cliente Desconhecido'
      }));

      return [...formattedOrders, ...formattedQuotes];
    },
    enabled: !!company?.id,
  });

  // Initialize Default Pipeline and Stages
  const initializeMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) return;

      // Check if already has pipeline
      const { count } = await supabase
        .from('crm_pipelines')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company.id);

      if (count && count > 0) return;

      // 1. Create Default Pipeline
      const { data: pipeline, error: pError } = await supabase
        .from('crm_pipelines')
        .insert({
          company_id: company.id,
          name: 'Vendas Diretas',
          is_default: true
        })
        .select()
        .single();

      if (pError) throw pError;

      // 2. Create Default Stages
      const defaultStages = [
        { name: 'Lead (Novo)', order_index: 0, color: '#3b82f6' },
        { name: 'Orçamento', order_index: 1, color: '#6366f1' },
        { name: 'Negociação', order_index: 2, color: '#f59e0b' },
        { name: 'Agendado', order_index: 3, color: '#a855f7' },
        { name: 'Concluído', order_index: 4, color: '#10b981' }
      ];

      const { error: sError } = await supabase
        .from('crm_stages')
        .insert(defaultStages.map(s => ({ ...s, pipeline_id: pipeline.id })));

      if (sError) throw sError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['crm_stages'] });
    }
  });

  // Update Item Stage
  const moveItemMutation = useMutation({
    mutationFn: async ({ itemId, type, stageId }: { itemId: string, type: 'order' | 'quote', stageId: string }) => {
      const table = type === 'order' ? 'orders' : 'quotes';
      const { error } = await supabase
        .from(table)
        .update({ crm_stage_id: stageId })
        .eq('id', itemId);

      if (error) throw error;
    },
    onMutate: async ({ itemId, stageId }) => {
      await queryClient.cancelQueries({ queryKey: ['crm_items'] });
      const previousItems = queryClient.getQueryData(['crm_items']);
      
      queryClient.setQueryData(['crm_items', company?.id], (old: CRMItem[] | undefined) => {
        if (!old) return [];
        return old.map(item => item.id === itemId ? { ...item, crm_stage_id: stageId } : item);
      });

      return { previousItems };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['crm_items', company?.id], context?.previousItems);
      toast.error('Erro ao mover item');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_items'] });
    }
  });

  return {
    pipelines,
    activePipeline,
    stages,
    items,
    isLoading: isLoadingPipelines || isLoadingStages || isLoadingItems,
    initialize: initializeMutation.mutate,
    isInitializing: initializeMutation.isPending,
    moveItem: moveItemMutation.mutate
  };
};
