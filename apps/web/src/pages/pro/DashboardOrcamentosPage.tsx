import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Button from '@/components/ui/Button';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  FileText,
  Paperclip,
  X as XIcon,
  Inbox,
  Send,
  History,
} from 'lucide-react';

interface Quote {
  id: string;
  client_id: string;
  company_id: string;
  service_id?: string;
  title: string;
  description: string;
  photos: string[];
  status: 'pending' | 'viewed' | 'proposal_sent' | 'approved' | 'rejected';
  proposal_value?: number;
  proposal_scope?: string;
  proposal_validity_days?: number;
  proposal_deadline?: string;
  proposal_sent_at?: string;
  created_at: string;
  client?: {
    full_name: string;
    avatar_url?: string;
  };
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Novo', color: 'bg-yellow-100 text-yellow-800' },
  viewed: { label: 'Visualizado', color: 'bg-blue-100 text-blue-800' },
  proposal_sent: { label: 'Proposta Enviada', color: 'bg-purple-100 text-purple-800' },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Recusado', color: 'bg-red-100 text-red-800' },
};

const DashboardOrcamentosPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'sent' | 'history'>('pending');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    value: '',
    scope: '',
    validity_days: '7',
    deadline: '',
  });

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: co } = await supabase
        .from('companies')
        .select('id')
        .eq('profile_id', user.id)
        .single();
      if (co) {
        setCompanyId(co.id);
        fetchQuotes(co.id);
      } else {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const fetchQuotes = async (cId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quotes')
      .select('*, client:profiles!client_id(full_name, avatar_url)')
      .eq('company_id', cId)
      .order('created_at', { ascending: false });
    if (!error) setQuotes((data as Quote[]) || []);
    setLoading(false);
  };

  const handleViewQuote = async (quote: Quote) => {
    setSelectedQuote(quote);
    setShowProposalForm(false);
    setProposalForm({ value: '', scope: '', validity_days: '7', deadline: '' });
    if (quote.status === 'pending') {
      await supabase
        .from('quotes')
        .update({ status: 'viewed', proposal_viewed_at: new Date().toISOString() })
        .eq('id', quote.id);
      setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'viewed' } : q));
    }
  };

  const handleSendProposal = async () => {
    if (!selectedQuote || !proposalForm.value || !proposalForm.scope) return;
    setSubmitting(true);
    const { error } = await supabase
      .from('quotes')
      .update({
        status: 'proposal_sent',
        proposal_value: parseFloat(proposalForm.value),
        proposal_scope: proposalForm.scope,
        proposal_validity_days: parseInt(proposalForm.validity_days) || 7,
        proposal_deadline: proposalForm.deadline || null,
        proposal_sent_at: new Date().toISOString(),
      })
      .eq('id', selectedQuote.id);
    if (!error) {
      addToast('Proposta enviada com sucesso!', 'success');
      setSelectedQuote(null);
      setShowProposalForm(false);
      if (companyId) fetchQuotes(companyId);
    } else {
      addToast('Erro ao enviar proposta.', 'error');
    }
    setSubmitting(false);
  };

  const filteredQuotes = quotes.filter(q => {
    if (activeTab === 'pending') return ['pending', 'viewed'].includes(q.status);
    if (activeTab === 'sent') return q.status === 'proposal_sent';
    return ['approved', 'rejected'].includes(q.status);
  });

  const pendingCount = quotes.filter(q => ['pending', 'viewed'].includes(q.status)).length;
  const sentCount = quotes.filter(q => q.status === 'proposal_sent').length;

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
          <span>Dashboard</span><ChevronRight size={12} />
          <span className="text-gray-600 font-medium">Orcamentos</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Orcamentos</h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
          Responda solicitacoes e envie propostas para seus clientes
        </p>
      </motion.div>

      {/* ─── Pill-Style Tabs ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto"
      >
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'pending'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
          }`}
        >
          <Inbox size={14} className={activeTab === 'pending' ? 'text-primary-500' : ''} />
          <span className="hidden sm:inline">Recebidos</span>
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{pendingCount}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'sent'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
          }`}
        >
          <Send size={14} className={activeTab === 'sent' ? 'text-primary-500' : ''} />
          <span className="hidden sm:inline">Propostas Enviadas</span>
          {sentCount > 0 && (
            <span className="bg-purple-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{sentCount}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
          }`}
        >
          <History size={14} className={activeTab === 'history' ? 'text-primary-500' : ''} />
          <span className="hidden sm:inline">Historico</span>
        </button>
      </motion.div>

      {/* Quote List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 w-full rounded-xl" />
          ))
        ) : filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 px-6 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-gray-300" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 mb-1">Nenhuma solicitacao aqui</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {activeTab === 'pending' && 'Quando clientes solicitarem orcamentos, eles aparecerao aqui.'}
              {activeTab === 'sent' && 'As propostas enviadas aparecerao aqui.'}
              {activeTab === 'history' && 'Orcamentos aprovados ou recusados aparecerao aqui.'}
            </p>
          </div>
        ) : (
          filteredQuotes.map(quote => {
            const badge = STATUS_MAP[quote.status] || { label: quote.status, color: 'bg-gray-100 text-gray-800' };
            return (
              <div key={quote.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center text-primary-500 font-bold text-sm flex-shrink-0 overflow-hidden">
                      {quote.client?.avatar_url ? (
                        <img src={quote.client.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        quote.client?.full_name?.charAt(0) || 'C'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 font-medium">{quote.client?.full_name || 'Cliente'}</p>
                      <p className="font-semibold text-gray-900 truncate">{quote.title}</p>
                      <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{quote.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
                    <p className="text-xs text-gray-400">{new Date(quote.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {quote.photos.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Paperclip size={12} />
                    {quote.photos.length} foto{quote.photos.length > 1 ? 's' : ''} anexada{quote.photos.length > 1 ? 's' : ''}
                  </p>
                )}

                {quote.proposal_value && (
                  <div className="mt-2 p-2.5 bg-purple-50 rounded-lg text-xs text-purple-700 font-medium">
                    Proposta: <strong>R$ {quote.proposal_value.toFixed(2).replace('.', ',')}</strong>
                    {quote.proposal_validity_days && ` · Válida por ${quote.proposal_validity_days} dias`}
                    {quote.proposal_deadline && ` · Prazo: ${new Date(quote.proposal_deadline).toLocaleDateString('pt-BR')}`}
                  </div>
                )}

                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                  <Button size="sm" variant="outline" onClick={() => handleViewQuote(quote)}>
                    Ver Detalhes
                  </Button>
                  {['pending', 'viewed'].includes(quote.status) && (
                    <Button size="sm" variant="primary" onClick={() => { handleViewQuote(quote); setShowProposalForm(true); }}>
                      Enviar Proposta
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail + Proposal Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e => { if (e.target === e.currentTarget) { setSelectedQuote(null); setShowProposalForm(false); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedQuote.title}</h3>
                  <p className="text-sm text-gray-500">Solicitado por <strong>{selectedQuote.client?.full_name}</strong></p>
                </div>
                <button
                  onClick={() => { setSelectedQuote(null); setShowProposalForm(false); }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <XIcon size={18} />
                </button>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Descrição da necessidade</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{selectedQuote.description}</p>
              </div>

              {/* Photos */}
              {selectedQuote.photos.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Fotos anexadas</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedQuote.photos.map((photo, i) => (
                      <img
                        key={i}
                        src={photo}
                        alt={`Foto ${i + 1}`}
                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(photo)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Existing proposal summary */}
              {selectedQuote.proposal_value && !showProposalForm && (
                <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="text-xs font-bold text-purple-600 uppercase mb-2">Proposta Enviada</p>
                  <p className="font-bold text-gray-900 text-lg">R$ {selectedQuote.proposal_value.toFixed(2).replace('.', ',')}</p>
                  {selectedQuote.proposal_scope && <p className="text-sm text-gray-600 mt-1">{selectedQuote.proposal_scope}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    {selectedQuote.proposal_validity_days && <span>Válida: {selectedQuote.proposal_validity_days} dias</span>}
                    {selectedQuote.proposal_deadline && <span>Prazo: {new Date(selectedQuote.proposal_deadline).toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
              )}

              {/* Proposal Form */}
              {showProposalForm && ['pending', 'viewed'].includes(selectedQuote.status) && (
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="font-bold text-gray-800 mb-4">Enviar Proposta</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Valor (R$) *</label>
                      <input
                        type="number" min="0" step="0.01"
                        value={proposalForm.value}
                        onChange={e => setProposalForm(p => ({ ...p, value: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        placeholder="Ex: 350.00"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Escopo do Serviço *</label>
                      <textarea
                        rows={3} maxLength={1000}
                        value={proposalForm.scope}
                        onChange={e => setProposalForm(p => ({ ...p, scope: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none transition-all"
                        placeholder="Descreva o que está incluso nesta proposta..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Validade (dias)</label>
                        <input
                          type="number" min="1" max="30"
                          value={proposalForm.validity_days}
                          onChange={e => setProposalForm(p => ({ ...p, validity_days: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Prazo de Entrega</label>
                        <input
                          type="date"
                          value={proposalForm.deadline}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setProposalForm(p => ({ ...p, deadline: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" onClick={() => setShowProposalForm(false)}>Cancelar</Button>
                      <Button
                        variant="primary"
                        onClick={handleSendProposal}
                        isLoading={submitting}
                        disabled={!proposalForm.value || !proposalForm.scope}
                      >
                        Enviar Proposta
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA to show form */}
              {!showProposalForm && ['pending', 'viewed'].includes(selectedQuote.status) && (
                <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                  <Button variant="primary" onClick={() => setShowProposalForm(true)}>
                    Enviar Proposta
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOrcamentosPage;
