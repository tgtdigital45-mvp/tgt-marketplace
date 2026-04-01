import { useQuery } from '@tanstack/react-query';
import { supabase } from '@tgt/core';
import { useCompany } from '@/contexts/CompanyContext';

export interface FunnelStageData {
  name: string;
  slug: string;
  item_count: number;
  total_value: number;
  order_index: number;
}

export interface TemperatureData {
  temperature: string;
  count: number;
}

export interface CRMStats {
  pipeline_value: number;
  conversion_rate: number;
  funnel_data: FunnelStageData[];
  temperature_data: TemperatureData[];
  period: string;
}

export function useCRMAnalytics(days: number = 30) {
  const { company } = useCompany();

  return useQuery({
    queryKey: ['crm-analytics', company?.id, days],
    queryFn: async () => {
      if (!company?.id) return null;

      const { data, error } = await supabase.rpc('get_crm_dashboard_stats', {
        p_company_id: company.id,
        p_days: days
      });

      if (error) throw error;
      return data as CRMStats;
    },
    enabled: !!company?.id
  });
}
