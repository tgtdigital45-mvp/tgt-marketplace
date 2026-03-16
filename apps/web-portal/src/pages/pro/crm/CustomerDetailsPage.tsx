import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTransition } from '@tgt/ui-web';;
import { useCustomer, CustomerInteraction, InternalNote } from '@portal/hooks/useCustomer';
import { 
  User, 
  Mail, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Trash2, 
  Pin, 
  Clock, 
  ArrowLeft,
  ChevronRight,
  Plus,
  StickyNote,
  History,
  TrendingUp,
  Award,
  Loader2,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentManager from '@portal/components/crm/DocumentManager';

const CustomerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, metrics, interactions, notes, isLoading, addNote, deleteNote, isAddingNote } = useCustomer(id);
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'documents'>('timeline');
  const [newNote, setNewNote] = useState('');

  if (isLoading) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Carregando ficha do cliente...</p>
      </div>
    );
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNote(newNote);
    setNewNote('');
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white rounded-xl border border-slate-200 hover:border-brand-primary/30 text-slate-500 hover:text-brand-primary transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">CRM</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-slate-400">Clientes</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="font-bold text-slate-900">{profile?.full_name || 'Detalhes do Cliente'}</span>
          </div>
        </div>

        {/* Header / Profile Info */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-3xl bg-slate-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-300" />
                )}
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{profile?.full_name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    <span>{profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>Membro desde {new Date(profile?.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-8">
              <div className="text-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1 flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3" /> LTV Total
                </p>
                <p className="text-xl font-bold text-slate-900">R$ {metrics?.ltv?.toLocaleString('pt-BR') || '0,00'}</p>
              </div>
              <div className="text-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1 flex items-center justify-center gap-1">
                  <Award className="w-3 h-3" /> Pedidos
                </p>
                <p className="text-xl font-bold text-slate-900">{metrics?.total_orders || 0}</p>
              </div>
              <div className="hidden sm:block text-center p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                <p className="text-[10px] uppercase font-bold text-emerald-600/60 tracking-widest mb-1 flex items-center justify-center gap-1">
                  Ticket Médio
                </p>
                <p className="text-xl font-bold text-emerald-700">R$ {metrics?.avg_ticket?.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) || '0'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Timeline / Interaction Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 p-1 bg-slate-100 w-fit rounded-xl border border-slate-200">
              <button 
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'timeline' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <History className="w-4 h-4" />
                Linha do Tempo
              </button>
              <button 
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'notes' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <StickyNote className="w-4 h-4" />
                Notas Internas
              </button>
              <button 
                onClick={() => setActiveTab('documents')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'documents' ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FileText className="w-4 h-4" />
                Documentos
              </button>
            </div>

            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeTab === 'timeline' ? (
                  <motion.div 
                    key="timeline"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {interactions && interactions.length > 0 ? (
                      interactions.map((interaction, idx) => (
                        <div key={interaction.id} className="relative pl-8 pb-8 last:pb-0">
                          {/* Vertical Line */}
                          {idx !== interactions.length - 1 && (
                            <div className="absolute left-3.5 top-8 bottom-0 w-px bg-slate-200" />
                          )}
                          
                          {/* Icon Dot */}
                          <div className={`absolute left-0 top-0 w-7 h-7 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 ${
                            interaction.type === 'order' ? 'bg-emerald-500' :
                            interaction.type === 'quote' ? 'bg-blue-500' :
                            interaction.type === 'status_change' ? 'bg-amber-500' : 'bg-slate-400'
                          }`}>
                            {interaction.type === 'message' ? <MessageSquare className="w-3 h-3 text-white" /> : <Clock className="w-3 h-3 text-white" />}
                          </div>

                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-bold text-slate-800 text-sm">{interaction.title}</h4>
                              <span className="text-[10px] text-slate-400 font-medium">{new Date(interaction.created_at).toLocaleString('pt-BR')}</span>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed">{interaction.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-64 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                        <History className="w-10 h-10 mb-3 opacity-20" />
                        <p className="font-medium">Nenhuma interação registrada ainda.</p>
                      </div>
                    )}
                  </motion.div>
                ) : activeTab === 'documents' ? (
                  <motion.div 
                    key="documents"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <DocumentManager customerId={id || ''} />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="notes"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Add Note Form */}
                    <form onSubmit={handleAddNote} className="bg-white p-4 rounded-2xl border-2 border-slate-100 focus-within:border-brand-primary/30 transition-all">
                      <textarea 
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Adicione uma nota interna sobre este cliente..."
                        className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-700 min-h-[100px] resize-none"
                      />
                      <div className="flex justify-end pt-3 border-t border-slate-50">
                        <button 
                          disabled={isAddingNote || !newNote.trim()}
                          className="bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isAddingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Salvar Nota
                        </button>
                      </div>
                    </form>

                    {/* Notes List */}
                    <div className="space-y-4">
                      {notes && notes.length > 0 ? (
                        notes.map((note) => (
                          <div key={note.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-brand-primary/20 transition-all">
                            {note.is_pinned && (
                              <Pin className="w-3 h-3 text-brand-primary absolute top-4 right-4" />
                            )}
                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                            <div className="mt-4 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {new Date(note.created_at).toLocaleDateString('pt-BR')} em {new Date(note.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <button 
                                onClick={() => deleteNote(note.id)}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-48 bg-slate-50/50 rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                          <StickyNote className="w-10 h-10 mb-3 opacity-20" />
                          <p className="text-sm font-medium">Use notas para lembrar de detalhes importantes.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar / Quick Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Resumo Financeiro
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-sm text-slate-500">Último Pedido</span>
                  <span className="text-sm font-bold text-slate-800">
                    {metrics?.last_order_at ? new Date(metrics.last_order_at).toLocaleDateString('pt-BR') : 'Sem pedidos'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                  <span className="text-sm text-slate-500">Frequência</span>
                  <span className="text-sm font-bold text-slate-800">Mensal (Média)</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-slate-500">Nível de Satisfação</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div key={star} className={`w-2 h-2 rounded-full ${star <= 4 ? 'bg-amber-400' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-brand-primary p-6 rounded-3xl text-white shadow-xl shadow-brand-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Award className="w-20 h-20" />
              </div>
              <h3 className="font-bold text-lg mb-2 relative z-10">Insight de IA</h3>
              <p className="text-brand-light/80 text-xs leading-relaxed relative z-10">
                Este cliente tem um ticket médio alto e prefere comunicações rápidas. Sugerimos oferecer um pacote recorrente para aumentar o LTV.
              </p>
              <button className="mt-4 w-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 py-2 rounded-xl text-xs font-bold transition-all">
                Ver Sugestões
              </button>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
};

export default CustomerDetailsPage;
