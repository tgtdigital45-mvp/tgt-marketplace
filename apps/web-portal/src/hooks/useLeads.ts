import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@tgt/core';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'react-hot-toast';

export interface LeadOpportunity {
  customer_id: string;
  customer_name: string;
  customer_avatar: string | null;
  score: number;
  temperature: 'cold' | 'warm' | 'hot';
  last_interaction_at: string;
  total_quotes: number;
  potential_value: number;
}

export const useLeads = () => {
  const { company } = useCompany();
  const queryClient = useQueryClient();

  // Fetch all leads for the company
  const { data: leads, isLoading } = useQuery({
    queryKey: ['crm_leads', company?.id],
    queryFn: async () => {
      if (!company?.id) return [];

      // Unified query getting score and profile info
      const { data, error } = await supabase
        .from('crm_lead_scores')
        .select(`
          score,
          temperature,
          last_interaction_at,
          customer_id,
          profile:customer_id (full_name, avatar_url)
        `)
        .eq('company_id', company.id)
        .order('score', { ascending: false });

      if (error) throw error;

      // Map to LeadOpportunity interface
      return data.map((item: any) => ({
        customer_id: item.customer_id,
        customer_name: item.profile?.full_name || 'Cliente sem nome',
        customer_avatar: item.profile?.avatar_url,
        score: item.score,
        temperature: item.temperature,
        last_interaction_at: item.last_interaction_at,
        // @TODO [CRITICAL]: These values are currently MOCKED as 0.
        // Needs a dedicated SQL function or view to aggregate total quotes and sum projected values 
        // from the `proposals` or `orders` tables per customer.
        total_quotes: 0, 
        potential_value: 0
      })) as LeadOpportunity[];
    },
    enabled: !!company?.id,
  });

  // Mutation to recalculate score (runs the RPC)
  const refreshScoreMutation = useMutation({
    mutationFn: async (customerId: string) => {
      if (!company?.id) return;
      const { data, error } = await supabase.rpc('calculate_lead_score', {
        p_company_id: company.id,
        p_customer_id: customerId
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_leads', company?.id] });
    }
  });

  return {
    leads,
    isLoading,
    refreshScore: refreshScoreMutation.mutate,
    isRefreshing: refreshScoreMutation.isPending
  };
};
