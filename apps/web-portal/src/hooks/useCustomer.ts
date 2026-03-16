import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@tgt/core';;
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'react-hot-toast';

export interface CustomerMetrics {
  ltv: number;
  total_orders: number;
  avg_ticket: number;
  last_order_at: string | null;
}

export interface CustomerInteraction {
  id: string;
  type: 'status_change' | 'message' | 'email' | 'note' | 'order' | 'quote';
  title: string;
  description: string | null;
  metadata: any;
  created_at: string;
}

export interface InternalNote {
  id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export const useCustomer = (customerId: string | undefined) => {
  const { company } = useCompany();
  const queryClient = useQueryClient();

  // 1. Fetch Basic Info (from profiles/users table)
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['customer_profile', customerId],
    queryFn: async () => {
      if (!customerId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  // 2. Fetch Metrics (RPC)
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['customer_metrics', company?.id, customerId],
    queryFn: async () => {
      if (!company?.id || !customerId) return null;
      const { data, error } = await supabase
        .rpc('get_customer_metrics', { 
          p_company_id: company.id, 
          p_customer_id: customerId 
        });

      if (error) throw error;
      return data as CustomerMetrics;
    },
    enabled: !!company?.id && !!customerId,
  });

  // 3. Fetch Interactions (Timeline)
  const { data: interactions, isLoading: isLoadingInteractions } = useQuery({
    queryKey: ['customer_interactions', company?.id, customerId],
    queryFn: async () => {
      if (!company?.id || !customerId) return [];
      const { data, error } = await supabase
        .from('crm_customer_interactions')
        .select('*')
        .eq('company_id', company.id)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomerInteraction[];
    },
    enabled: !!company?.id && !!customerId,
  });

  // 4. Fetch Notes
  const { data: notes, isLoading: isLoadingNotes } = useQuery({
    queryKey: ['customer_notes', company?.id, customerId],
    queryFn: async () => {
      if (!company?.id || !customerId) return [];
      const { data, error } = await supabase
        .from('crm_internal_notes')
        .select('*')
        .eq('company_id', company.id)
        .eq('customer_id', customerId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InternalNote[];
    },
    enabled: !!company?.id && !!customerId,
  });

  // Mutations
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!company?.id || !customerId) return;
      const { error } = await supabase
        .from('crm_internal_notes')
        .insert({
          company_id: company.id,
          customer_id: customerId,
          content,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_notes', company?.id, customerId] });
      toast.success('Nota adicionada!');
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('crm_internal_notes')
        .delete()
        .eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer_notes', company?.id, customerId] });
      toast.success('Nota removida');
    }
  });

  return {
    profile,
    metrics,
    interactions,
    notes,
    isLoading: isLoadingProfile || isLoadingMetrics || isLoadingInteractions || isLoadingNotes,
    addNote: addNoteMutation.mutate,
    isAddingNote: addNoteMutation.isPending,
    deleteNote: deleteNoteMutation.mutate
  };
};
