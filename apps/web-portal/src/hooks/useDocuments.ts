import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@tgt/core';;
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'react-hot-toast';

export interface CRMDocument {
  id: string;
  company_id: string;
  customer_id: string;
  order_id: string | null;
  quote_id: string | null;
  name: string;
  file_path: string;
  type: 'proposal' | 'contract' | 'other';
  status: 'draft' | 'pending_signature' | 'signed' | 'expired';
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const useDocuments = (customerId?: string) => {
  const { company } = useCompany();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['crm_documents', company?.id, customerId],
    queryFn: async () => {
      if (!company?.id) return [];

      let query = supabase
        .from('crm_documents')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CRMDocument[];
    },
    enabled: !!company?.id,
  });

  const generateDocumentMutation = useMutation({
    mutationFn: async ({ orderId, quoteId, type }: { orderId?: string, quoteId?: string, type: 'proposal' | 'contract' }) => {
      const { data, error } = await supabase.functions.invoke('generate-crm-document', {
        body: { orderId, quoteId, type }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_documents', company?.id] });
      toast.success('Documento gerado com sucesso!');
    },
    onError: (err: any) => {
      toast.error('Erro ao gerar documento: ' + err.message);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('crm_documents')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm_documents', company?.id] });
      toast.success('Status atualizado!');
    }
  });

  return {
    documents,
    isLoading,
    generateDocument: generateDocumentMutation.mutate,
    isGenerating: generateDocumentMutation.isPending,
    updateStatus: updateStatusMutation.mutate
  };
};
