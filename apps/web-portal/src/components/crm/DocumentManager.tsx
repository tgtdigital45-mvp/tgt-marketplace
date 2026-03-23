import React from 'react';
import { 
  FileText, 
  Download, 
  Plus, 
  Loader2, 
  FileCheck, 
  Clock, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useDocuments, CRMDocument } from '@portal/hooks/useDocuments';
import { supabase } from '@tgt/core';

interface DocumentManagerProps {
  customerId: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ customerId }) => {
  const { documents, isLoading, generateDocument, isGenerating } = useDocuments(customerId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed': return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border border-emerald-100"><FileCheck className="w-3 h-3" /> Assinado</span>;
      case 'pending_signature': return <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border border-amber-100"><Clock className="w-3 h-3" /> Pendente</span>;
      default: return <span className="text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border border-slate-100">Rascunho</span>;
    }
  };

  const handleDownload = async (doc: CRMDocument) => {
    const { data, error } = await supabase.storage
      .from('crm_documents')
      .download(doc.file_path);
    
    if (error) {
      console.error('Error downloading:', error);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin mb-2" />
        <p className="text-slate-400 text-sm">Carregando documentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-primary" />
            Documentos & Contratos
        </h3>
        <button 
          onClick={() => generateDocument({ type: 'proposal' })}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Nova Proposta
        </button>
      </div>

      {/* Manual Upload Section (Placeholder) */}
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center group hover:border-brand-primary/30 transition-all cursor-pointer">
        <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-2 text-slate-400 group-hover:text-brand-primary group-hover:scale-110 transition-all">
            <Plus className="w-5 h-5" />
        </div>
        <p className="text-sm font-bold text-slate-600">Arraste aqui um documento</p>
        <p className="text-[10px] text-slate-400">PDF, PNG ou JPG (Max 5MB)</p>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <div key={doc.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-brand-primary/30 transition-all group flex items-start gap-4">
               <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                   doc.type === 'contract' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
               }`}>
                    <FileText className="w-6 h-6" />
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{doc.name}</h4>
                    {getStatusBadge(doc.status)}
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-3">
                    <Clock className="w-3 h-3" />
                    Gerado em {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="flex items-center gap-2">
                    <button 
                        onClick={() => handleDownload(doc)}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                    >
                        <Download className="w-3 h-3" /> Download
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-all">
                        <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400">
            <AlertCircle className="w-10 h-10 mb-2 opacity-10 mx-auto" />
            <p className="text-sm">Nenhum documento gerado para este cliente.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;
