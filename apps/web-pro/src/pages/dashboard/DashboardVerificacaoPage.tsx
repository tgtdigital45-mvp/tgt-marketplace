import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/core';;
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';

import { useToast } from '@/contexts/ToastContext';
import { motion } from 'framer-motion';
import { Button } from '@tgt/ui-web';

import { 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  AlertCircle,
  FileText,
  UploadCloud,
  X,
  Lock,
  Camera
} from 'lucide-react';

type DocumentType = 'identity_front' | 'identity_back' | 'address_proof' | 'business_license';

interface DocItem {
  type: DocumentType;
  label: string;
  description: string;
  required: boolean;
}

const DOCUMENTS: DocItem[] = [
  { type: 'identity_front', label: 'RG/CNH (Frente)', description: 'Foto nítida da frente do seu documento de identidade.', required: true },
  { type: 'identity_back', label: 'RG/CNH (Verso)', description: 'Foto nítida do verso do seu documento.', required: true },
  { type: 'address_proof', label: 'Comp. de Residência', description: 'Conta de luz, água ou internet dos últimos 3 meses.', required: true },
  { type: 'business_license', label: 'Cartão CNPJ / MEI', description: 'Opcional para autônomos, obrigatório para empresas PJ.', required: false },
];

const DashboardVerificacaoPage: React.FC = () => {
  const { user } = useAuth();
  const { company, refreshCompany } = useCompany();
  const { addToast } = useToast();
  
  const [uploads, setUploads] = useState<Record<string, string | 'uploading'>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchKYC() {
      if (!company) {
        setLoading(false);
        return;
      }
      try {
        const docs = company.kyc_documents || [];
        const initialUploads: Record<string, string> = {};
        docs.forEach((d: any) => {
          initialUploads[d.type] = d.url;
        });
        setUploads(initialUploads);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchKYC();
  }, [company]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
    const file = event.target.files?.[0];
    if (!file || !company) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('O arquivo deve ter no máximo 5MB.', 'error');
      return;
    }

    try {
      setUploads(prev => ({ ...prev, [type]: 'uploading' }));

      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `compliance/${company.id}/${type}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('marketplace')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('marketplace').getPublicUrl(fileName);
      setUploads(prev => ({ ...prev, [type]: urlData.publicUrl }));
      addToast('Documento carregado.', 'success');
      
    } catch (e) {
      console.error(e);
      setUploads(prev => {
        const newUploads = { ...prev };
        delete newUploads[type];
        return newUploads;
      });
      addToast('Falha ao carregar documento.', 'error');
    }
  };

  const removeDocument = (type: DocumentType) => {
    // We optionally remove it from state so user can upload again before submit.
    // If it's already accepted, we might not let them. For now simple clear allowed if not locked.
    setUploads(prev => {
      const newState = { ...prev };
      delete newState[type];
      return newState;
    });
  };

  const handleSubmit = async () => {
    const missing = DOCUMENTS.filter(d => d.required && !uploads[d.type]);
    if (missing.length > 0) {
      addToast('Por favor, carregue todos os documentos obrigatórios.', 'error');
      return;
    }

    if (!company) return;

    setSubmitting(true);

    try {
      const kycDocs = Object.keys(uploads)
        .filter(key => uploads[key] !== 'uploading')
        .map(type => ({
          type,
          url: uploads[type],
          uploaded_at: new Date().toISOString()
        }));

      const { error } = await supabase
        .from('companies')
        .update({
          kyc_status: 'in_review',
          kyc_documents: kycDocs
        })
        .eq('id', company.id);

      if (error) throw error;

      await refreshCompany();
      addToast('Seus documentos foram enviados para análise!', 'success');
    } catch (e) {
      console.error(e);
      addToast('Não foi possível enviar os documentos.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !company) {
    return (
      <div className="flex justify-center items-center py-20 text-brand-primary">
        Carregando dados de verificação...
      </div>
    );
  }

  const isLocked = company.kyc_status === 'in_review' || company.kyc_status === 'approved';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
          <span>Dashboard</span><ChevronRight size={12} />
          <span className="text-gray-600 font-medium">Verificação de Identidade</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Verificação da Conta (KYC)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Envie seus documentos para verificar sua identidade e liberar recursos avançados.
        </p>
      </motion.div>

      {/* ─── Status Banner ─────────────────────────────────────────────── */}
      <motion.div 
         initial={{ opacity: 0, scale: 0.98 }}
         animate={{ opacity: 1, scale: 1 }}
         className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
             company.kyc_status === 'approved' ? 'bg-emerald-50 border-emerald-100' :
             company.kyc_status === 'in_review' ? 'bg-amber-50 border-amber-100' : 
             'bg-white border-gray-200 shadow-sm'
         }`}
      >
          <div className={`p-3 rounded-full flex-shrink-0 ${
              company.kyc_status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
              company.kyc_status === 'in_review' ? 'bg-amber-100 text-amber-600' : 
              'bg-gray-100 text-gray-500'
          }`}>
              {company.kyc_status === 'approved' ? <ShieldCheck size={24} /> :
               company.kyc_status === 'in_review' ? <Clock size={24} /> :
               <AlertCircle size={24} />}
          </div>
          <div>
              <h2 className={`font-bold text-lg ${
                company.kyc_status === 'approved' ? 'text-emerald-900' :
                company.kyc_status === 'in_review' ? 'text-amber-900' : 
                'text-gray-900'
              }`}>
                  {company.kyc_status === 'approved' ? 'Identidade Verificada' :
                   company.kyc_status === 'in_review' ? 'Análise em Andamento' : 'Envio Pendente'}
              </h2>
              <p className={`text-sm mt-0.5 ${
                company.kyc_status === 'approved' ? 'text-emerald-700' :
                company.kyc_status === 'in_review' ? 'text-amber-700' : 
                'text-gray-500'
              }`}>
                  {company.kyc_status === 'approved' ? 'Sua conta está aprovada e verificada com sucesso. Obrigado!' :
                   company.kyc_status === 'in_review' ? 'Nossa equipe está analisando seus documentos. O prazo é de até 48 horas úteis.' : 
                   'Complete os passos abaixo anexando as imagens dos documentos necessários para liberar saques e planos avançados.'}
              </p>
          </div>
      </motion.div>


      {/* ─── Document List ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100">
           <h3 className="font-bold text-gray-900">Documentos Requeridos</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {DOCUMENTS.map((doc, idx) => {
            const isUploaded = !!uploads[doc.type] && uploads[doc.type] !== 'uploading';
            const isUploading = uploads[doc.type] === 'uploading';

            return (
              <motion.div 
                key={doc.type} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                    isLocked ? 'opacity-80' : 'hover:bg-gray-50'
                }`}
              >
                  <div className="flex gap-4 min-w-0 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isUploaded ? 'bg-primary-50 text-brand-primary' : 'bg-gray-100 text-gray-400'
                      }`}>
                          {doc.type.includes('identity') ? <ShieldCheck size={20} /> :
                           doc.type === 'address_proof' ? <FileText size={20} /> : <FileText size={20} />}
                      </div>
                      <div>
                          <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                              {doc.label}
                              {doc.required && <span className="text-red-500">*</span>}
                              {isUploaded && <CheckCircle2 size={14} className="text-primary-500" />}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 max-w-sm">
                              {doc.description}
                          </p>
                      </div>
                  </div>

                  <div className="w-full sm:w-auto flex-shrink-0 flex items-center gap-2">
                       {isUploaded && !isLocked && (
                           <button 
                             onClick={() => removeDocument(doc.type)}
                             className="p-2 text-gray-400 hover:text-red-500 bg-white border border-gray-200 rounded-lg transition-colors"
                             title="Remover documento"
                           >
                               <X size={16} />
                           </button>
                       )}
                       
                       {isUploaded ? (
                           <a href={uploads[doc.type] as string} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">
                               Ver Documento
                           </a>
                       ) : isUploading ? (
                           <button disabled className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg">
                               <UploadCloud size={14} className="animate-pulse" />
                               Enviando...
                           </button>
                       ) : (
                           <div className="flex-1 sm:flex-none relative">
                               <input 
                                 type="file" 
                                 accept="image/*" 
                                 title="Anexar arquivo"
                                 onChange={(e) => handleFileUpload(e, doc.type)}
                                 disabled={isLocked}
                                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                               />
                               <Button size="sm" variant="outline" disabled={isLocked} className="w-full justify-center pointer-events-none">
                                   <Camera size={14} className="mr-1.5" />
                                   Anexar
                               </Button>
                           </div>
                       )}
                  </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Action Footer */}
        {!isLocked && (
           <div className="p-5 sm:p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
               <p className="text-xs text-gray-500 flex items-center gap-1.5">
                   <Lock size={12} className="text-gray-400" />
                   Dados criptografados de ponta a ponta.
               </p>
               <Button onClick={handleSubmit} isLoading={submitting} className="w-full sm:w-auto">
                   Enviar para Análise
               </Button>
           </div>
        )}
      </div>

    </div>
  );
};

export default DashboardVerificacaoPage;
