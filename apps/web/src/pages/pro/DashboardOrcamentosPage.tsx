import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import Button from '@/components/ui/Button';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

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
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Orçamentos</h2>
        <p className="text-gray-500 text-sm mt-1">Responda às solicitações e envie propostas para seus clientes.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'pending' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Recebidos
          {pendingCount > 0 && (
            <span className="bg-yellow-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{pendingCount}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'sent' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Propostas Enviadas
          {sentCount > 0 && (
            <span className="bg-purple-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{sentCount}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'history' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Histórico
        </button>
      </div>

      {/* Quote List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 w-full rounded-xl" />
          ))
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium">Nenhuma solicitação aqui.</p>
            <p className="text-sm mt-1">
              {activeTab === 'pending' && 'Quando clientes solicitarem orçamentos, eles aparecerão aqui.'}
              {activeTab === 'sent' && 'As propostas enviadas aparecerão aqui.'}
              {activeTab === 'history' && 'Orçamentos aprovados ou recusados aparecerão aqui.'}
            </p>
          </div>
        ) : (
          filteredQuotes.map(quote => {
            const badge = STATUS_MAP[quote.status] || { label: quote.status, color: 'bg-gray-100 text-gray-800' };
            return (
              <div key={quote.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary font-bold text-sm flex-shrink-0 overflow-hidden">
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                        placeholder="Ex: 350.00"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Escopo do Serviço *</label>
                      <textarea
                        rows={3} maxLength={1000}
                        value={proposalForm.scope}
                        onChange={e => setProposalForm(p => ({ ...p, scope: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none transition-all"
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
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Prazo de Entrega</label>
                        <input
                          type="date"
                          value={proposalForm.deadline}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setProposalForm(p => ({ ...p, deadline: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
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
