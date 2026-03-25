import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@tgt/core';

import { LoadingSpinner, Badge, Button, LoadingSkeleton } from '@tgt/ui-web';
import { useCheckout } from '@/hooks/useCheckout';
import { ScheduleModal } from '@/components/booking/ScheduleModal';


import {
  ArrowLeft, Clock, ShieldCheck, Download, AlertCircle, FileText,
  CheckCircle, MessageSquare, Search, Video, CreditCard, Check, XCircle,
  Archive, Flag, Ban, Trash2, MapPin, Briefcase, Plus, MoreVertical
} from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

const ReviewModal = lazy(() => import('@/components/orders/ReviewModal'));
const DisputeModal = lazy(() => import('@/components/orders/DisputeModal'));

const PLATFORM_FEE = 0.10;

interface OrderProposal {
  id: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  estimated_duration: string | null;
  notes: string | null;
  payment_method?: 'upfront' | 'on_completion';
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  job_id?: string;
  order_id?: string;
  is_system_message?: boolean;
  proposal_id?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  order_proposals?: OrderProposal | null;
  type?: string;
  metadata?: any;
}

interface Thread {
  threadId: string;
  jobId?: string;
  orderId?: string;
  jobTitle: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  partnerLocation?: string;
  partnerCategory?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ClientMessagesPage: React.FC = () => {
  const { user } = useAuth();
  const { state } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { redirectToCheckout } = useCheckout();
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [orderForSchedule, setOrderForSchedule] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active'>('all');

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };
  
  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchThreads = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('get_chat_threads', { p_user_id: user.id });
      if (error) throw error;
      const mapped: Thread[] = (data || []).map((t: any) => ({
        threadId: t.thread_id,
        jobId: t.job_id,
        orderId: t.order_id,
        jobTitle: t.job_title,
        partnerId: t.partner_id,
        partnerName: t.partner_name,
        partnerAvatar: t.partner_avatar,
        lastMessage: t.last_message_content,
        lastMessageTime: t.last_message_time,
        unreadCount: Number(t.unread_count),
      }));
      setThreads(mapped);

      const threadParam = searchParams.get('thread');
      const targetId = threadParam || state?.threadId;
      
      if (targetId) {
        let target = mapped.find(t => t.threadId === targetId || t.orderId === targetId);
        
        if (!target) {
            // Check if it's a new order that doesn't have messages yet
            const { data: orderData } = await supabase
              .from('orders')
              .select('id, service_title, service:services(title), seller:profiles!orders_seller_id_fkey(id, full_name, avatar_url, companies(company_name, logo_url))')
              .eq('id', targetId)
              .maybeSingle();

            if (orderData) {
              const sellerProfile = (orderData as any).seller;
              const companyData = sellerProfile?.companies?.[0];
              
              target = {
                threadId: orderData.id,
                orderId: orderData.id,
                jobTitle: (orderData as any).service?.title || (orderData as any).service_title || 'Serviço Contratado',
                partnerId: sellerProfile?.id || '',
                partnerName: companyData?.company_name || sellerProfile?.full_name || 'Empresa',
                partnerAvatar: companyData?.logo_url || sellerProfile?.avatar_url,
                lastMessage: 'Envie a primeira mensagem!',
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0
              };
              mapped.unshift(target);
            }
        }

        if (target) {
          setActiveThread(target);
          // Don't clear URL immediately if we need 'success' param later, but let's just clear 'thread'
          searchParams.delete('thread');
          setSearchParams(searchParams, { replace: true });
        }
      }
      
      setThreads(mapped);
    } catch (err) {
      console.error('[ClientMessages] fetchThreads error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, searchParams, state?.threadId, setSearchParams]);

  const fetchMessages = useCallback(async (threadId: string, isJob: boolean) => {
    if (!user) return;
    const col = isJob ? 'job_id' : 'order_id';
    const { data } = await supabase
      .from('messages')
      .select(`*, order_proposals(id, amount, status, estimated_duration, notes)`)
      .eq(col, threadId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  }, [user]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  useEffect(() => {
    if (!activeThread || !user) return;
    fetchMessages(activeThread.threadId, !!activeThread.jobId);
    
    // Update unread count locally
    setThreads(prev => prev.map(t =>
      t.threadId === activeThread.threadId ? { ...t, unreadCount: 0 } : t
    ));

    // Mark messages as read in Database
    const markAsRead = async () => {
      const col = activeThread.jobId ? 'job_id' : 'order_id';
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq(col, activeThread.threadId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
    };
    markAsRead();

    const success = searchParams.get('success');
    if (success === 'true' && activeThread.orderId) {
      searchParams.delete('success');
      setSearchParams(searchParams);
      
      supabase.from('orders').select('*').eq('id', activeThread.orderId).single().then(({ data }) => {
          if (data) {
              setOrderForSchedule(data);
              setScheduleModalOpen(true);
          }
      });
    }

    const col = activeThread.jobId ? 'job_id' : 'order_id';
    const sub = supabase
      .channel(`chat_thread_client:${activeThread.threadId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `${col}=eq.${activeThread.threadId}`
      }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id !== user.id) {
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
          setThreads(prev => prev.map(t =>
            t.threadId === activeThread.threadId
              ? { ...t, lastMessage: msg.content, lastMessageTime: msg.created_at, unreadCount: 0 }
              : t
          ));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [activeThread, user, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread || !user) return;
    const payload: any = {
      sender_id: user.id, receiver_id: activeThread.partnerId,
      content: newMessage, job_id: activeThread.jobId, order_id: activeThread.orderId
    };
    const { error } = await supabase.from('messages').insert(payload);
    if (!error) {
      setMessages(prev => [...prev, { id: 'temp-' + Date.now(), ...payload, created_at: new Date().toISOString(), is_read: false }]);
      setNewMessage('');
    }
  };

  const handleProposalAction = async (proposalId: string, action: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('order_proposals')
        .update({ status: action })
        .eq('id', proposalId);
      if (error) throw error;

      if (action === 'accepted' && activeThread?.orderId) {
        await supabase.rpc('transition_saga_status', {
          p_order_id: activeThread.orderId,
          p_new_status: 'ORDER_ACTIVE'
        });
        await supabase.from('messages').insert({
          order_id: activeThread.orderId,
          sender_id: user?.id,
          receiver_id: activeThread.partnerId,
          content: '✅ Orçamento aceito! O pedido foi confirmado.',
          is_system_message: true,
        });
      }

      if (action === 'rejected' && activeThread?.orderId) {
        await supabase.from('messages').insert({
          order_id: activeThread.orderId,
          sender_id: user?.id,
          receiver_id: activeThread.partnerId,
          content: '❌ Orçamento recusado.',
          is_system_message: true,
        });
      }

      addToast(action === 'accepted' ? 'Proposta aceita!' : 'Proposta recusada.', action === 'accepted' ? 'success' : 'info');
      fetchMessages(activeThread!.threadId, !!activeThread!.jobId);
    } catch {
      addToast('Erro ao responder proposta.', 'error');
    }
  };

  // Handler para propostas enviadas via metadata (msg.type === 'proposal')
  const handleMetadataProposalAction = async (messageId: string, action: 'accepted' | 'rejected', proposalValue?: number) => {
    try {
      // Buscar metadata atual da mensagem
      const { data: msgData, error: fetchErr } = await supabase
        .from('messages')
        .select('metadata')
        .eq('id', messageId)
        .single();
      if (fetchErr) throw fetchErr;

      const updatedMetadata = { ...msgData.metadata, status: action };
      const { error: updateErr } = await supabase
        .from('messages')
        .update({ metadata: updatedMetadata })
        .eq('id', messageId);
      if (updateErr) throw updateErr;

      // Atualizar estado local imediatamente (UI otimista)
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, metadata: updatedMetadata } : m
      ));

      if (action === 'accepted' && activeThread?.orderId) {
        // Atualizar order.price com o valor da proposta aceita
        if (proposalValue) {
          await supabase
            .from('orders')
            .update({ price: proposalValue })
            .eq('id', activeThread.orderId);
        }
        await supabase.rpc('transition_saga_status', {
          p_order_id: activeThread.orderId,
          p_new_status: 'ORDER_ACTIVE'
        });
        await supabase.from('messages').insert({
          order_id: activeThread.orderId,
          sender_id: user?.id,
          receiver_id: activeThread.partnerId,
          content: '✅ Proposta aceita! Redirecionando para o pagamento do sinal...',
          is_system_message: true,
        });

        // Redireciona para o Checkout passando o order_id e messageId (como proposal_id)
        redirectToCheckout({ order_id: activeThread.orderId, proposal_id: messageId });
        return; // Interrompe para não carregar mais nada e efetuar o redirect
      }

      if (action === 'rejected' && activeThread?.orderId) {
        await supabase.from('messages').insert({
          order_id: activeThread.orderId,
          sender_id: user?.id,
          receiver_id: activeThread.partnerId,
          content: '❌ Proposta recusada.',
          is_system_message: true,
        });
      }

      addToast(action === 'accepted' ? 'Proposta aceita!' : 'Proposta recusada.', action === 'accepted' ? 'success' : 'info');
      fetchMessages(activeThread!.threadId, !!activeThread!.jobId);
    } catch {
      addToast('Erro ao responder proposta.', 'error');
    }
  };

  const filteredThreads = threads.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.partnerName.toLowerCase().includes(q) && !t.jobTitle.toLowerCase().includes(q)) return false;
    }
    if (activeTab === 'active') return !!t.orderId;
    return true;
  });

  const activeCount = threads.filter(t => t.orderId).length;

  return (
    <>
      <Helmet><title>Minhas Mensagens | CONTRATTO</title></Helmet>

      <div className="pt-24 pb-6 bg-[#F8FAFC] h-screen flex flex-col overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex-grow flex flex-col max-w-[1600px] mx-auto min-h-0">
          <div className="mb-4 flex items-center gap-3 shrink-0">
            <Link to="/perfil/cliente" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-brand-primary transition-colors">
              <ArrowLeft size={16} className="mr-1.5" />Voltar ao Perfil
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100/50 flex flex-grow min-h-0 overflow-hidden">

            {/* ── Coluna Esquerda: Inbox ── */}
            <div className={`w-full md:w-[280px] lg:w-[300px] shrink-0 flex flex-col border-r border-gray-100 bg-white ${activeThread ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-gray-100 space-y-3">
                <h2 className="text-base font-bold text-gray-900 tracking-tight">Conversas</h2>
                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary/50"
                  />
                </div>
                {/* Tabs */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'all' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                  >Tudo</button>
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === 'active' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    Em andamento
                    {activeCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0 rounded-full font-bold ${activeTab === 'active' ? 'bg-white/30 text-white' : 'bg-brand-primary/10 text-brand-primary'}`}>
                        {activeCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Thread list */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading
                  ? <div className="p-4 space-y-3"><LoadingSkeleton className="h-16 w-full rounded-2xl" /><LoadingSkeleton className="h-16 w-full rounded-2xl" /></div>
                  : filteredThreads.length === 0
                    ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                        <MessageSquare size={32} className="text-gray-200 mb-3" />
                        <p className="text-gray-400 text-sm">Nenhuma conversa.</p>
                      </div>
                    )
                    : filteredThreads.map(t => (
                      <button
                        key={t.threadId}
                        onClick={() => setActiveThread(t)}
                        className={`w-full p-4 flex gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${activeThread?.threadId === t.threadId ? 'bg-blue-50 border-l-[3px] border-l-brand-primary' : ''}`}
                      >
                        <div className="w-11 h-11 bg-gray-200 rounded-full shrink-0 flex items-center justify-center font-bold text-gray-500 overflow-hidden shadow-sm">
                          {t.partnerAvatar ? <img src={t.partnerAvatar} className="w-full h-full object-cover" alt="" /> : t.partnerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="font-bold text-sm text-gray-900 truncate">{t.partnerName}</span>
                            <span className="text-[10px] text-gray-400 ml-1 shrink-0">{new Date(t.lastMessageTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <p className="text-[10px] text-brand-primary uppercase font-bold truncate mb-0.5">{t.jobTitle}</p>
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-gray-400 truncate flex-grow">{t.lastMessage}</p>
                            {t.unreadCount > 0 && (
                              <span className="shrink-0 bg-brand-primary text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                {t.unreadCount > 9 ? '9+' : t.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                }
              </div>
            </div>

            {/* ── Coluna Central: Chat ── */}
            <div className={`flex-1 flex flex-col min-w-0 bg-slate-50 ${!activeThread ? 'hidden md:flex' : 'flex'}`}>
              {activeThread ? (
                <>
                  <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setActiveThread(null)} className="md:hidden text-gray-500 p-1"><ArrowLeft size={18} /></button>
                      <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold overflow-hidden shadow-sm shrink-0">
                        {activeThread.partnerAvatar ? <img src={activeThread.partnerAvatar} className="w-full h-full object-cover" alt="" /> : activeThread.partnerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-bold text-gray-800 truncate text-sm">{activeThread.partnerName}</h3>
                        <p className="text-[10px] text-brand-primary font-bold uppercase truncate">{activeThread.jobTitle}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 md:gap-2 text-gray-400">
                       <button className="p-2 hover:bg-gray-50 rounded-lg hover:text-brand-primary transition-colors hidden sm:block" title="Videochamada"><Video size={18} /></button>
                       <button className="p-2 hover:bg-gray-50 rounded-lg hover:text-gray-700 transition-colors hidden sm:block" title="Arquivar"><Archive size={18} /></button>
                       <button className="p-2 hover:bg-red-50 rounded-lg hover:text-red-500 transition-colors hidden sm:block" title="Denunciar"><Flag size={18} /></button>
                       <button className="p-2 hover:bg-red-50 rounded-lg hover:text-red-500 transition-colors hidden sm:block" title="Bloquear"><Ban size={18} /></button>
                       <button className="p-2 hover:bg-red-50 rounded-lg hover:text-red-500 transition-colors hidden sm:block" title="Apagar"><Trash2 size={18} /></button>
                       <button className="p-2 hover:bg-gray-50 rounded-lg sm:hidden"><MoreVertical size={18} /></button>
                    </div>
                  </div>

                  <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 pb-12 space-y-4 custom-scrollbar min-h-0">
                    {messages.map(msg => {
                      const isMe = msg.sender_id === user?.id;

                      if (msg.is_system_message) {
                        // Payment request card
                        let paymentData: any = null;
                        try {
                          const parsed = JSON.parse(msg.content);
                          if (parsed.type === 'payment_request') paymentData = parsed;
                        } catch { /* plain system message */ }

                        if (paymentData) {
                          return (
                            <div key={msg.id} className="flex justify-center my-2">
                              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 w-full max-w-sm">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-7 h-7 bg-brand-primary/10 rounded-full flex items-center justify-center">
                                    <CreditCard size={14} className="text-brand-primary" />
                                  </div>
                                  <div>
                                    <span className="font-bold text-sm text-gray-900">{paymentData.title}</span>
                                    <p className="text-[10px] text-gray-400">Solicitação de pagamento</p>
                                  </div>
                                </div>
                                {paymentData.description && <p className="text-xs text-gray-500 mb-3">{paymentData.description}</p>}
                                <div className="space-y-1 text-xs bg-gray-50 rounded-xl p-3 mb-3">
                                  <div className="flex justify-between font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>R$ {paymentData.amount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-gray-400">
                                    <span>Inclui taxa da plataforma (10%)</span>
                                    <span>R$ {paymentData.fee.toFixed(2)}</span>
                                  </div>
                                </div>
                                <Button size="sm" className="w-full text-xs bg-brand-primary hover:bg-brand-primary/90">
                                  Pagar Agora — R$ {paymentData.amount.toFixed(2)}
                                </Button>
                                <p className="text-[10px] text-gray-400 text-center mt-2">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          );
                        }

                        // Plain system message (video call, status updates, etc.)
                        return (
                          <div key={msg.id} className="flex justify-center my-2">
                            <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-full text-center max-w-xs">
                              {msg.content}
                            </div>
                          </div>
                        );
                      }

                      // ── Proposta via metadata (enviada pelo profissional via DashboardMensagensPage) ──
                      if (msg.type === 'proposal' && msg.metadata) {
                        const proposal = msg.metadata;
                        const isPending = proposal.status === 'pending';
                        const isAccepted = proposal.status === 'accepted';
                        const isRejected = proposal.status === 'rejected';
                        return (
                          <div key={msg.id} className="flex justify-center my-3">
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-5 w-full max-w-sm">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-1">Proposta de Serviço</p>
                                  <span className="font-black text-2xl leading-none tracking-tight text-gray-900">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.totalValue)}
                                  </span>
                                </div>
                                <Badge className={
                                  isAccepted ? 'bg-emerald-500 text-white border-0 text-[10px]' :
                                  isRejected ? 'bg-red-500 text-white border-0 text-[10px]' :
                                  'bg-amber-400 text-white border-0 text-[10px]'
                                }>
                                  {isAccepted ? 'Aceita ✓' : isRejected ? 'Recusada' : 'Aguardando'}
                                </Badge>
                              </div>

                              {/* Descrição */}
                              {proposal.description && (
                                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{proposal.description}</p>
                              )}

                              {/* Breakdown financeiro */}
                              <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100 mb-3">
                                <div className="flex justify-between font-medium text-slate-500">
                                  <span>Valor do Serviço</span>
                                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.totalValue)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-slate-800 pt-1.5 border-t border-slate-200 mt-1.5">
                                  <span>Total a Pagar</span>
                                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.totalValue)}</span>
                                </div>
                              </div>

                              {/* Condições */}
                              <div className="text-[11px] space-y-1.5 mb-4">
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <CreditCard size={12} />
                                  <span className="font-bold">Sinal inicial ({proposal.upfrontPercentage}%):</span>
                                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.upfrontAmount)}</span>
                                </div>
                                {proposal.estimatedDuration && (
                                  <div className="flex items-center gap-1.5 text-gray-500">
                                    <Clock size={12} />
                                    <span className="font-bold">Prazo:</span>
                                    <span>{proposal.estimatedDuration}</span>
                                  </div>
                                )}
                              </div>

                              {/* Notas do profissional */}
                              {proposal.notes && (
                                <div className="text-[11px] italic mb-4 p-2.5 rounded-lg border bg-amber-50/50 border-amber-100/50 text-slate-600">
                                  <div className="font-bold not-italic mb-1 flex items-center gap-1">
                                    <MessageSquare size={10} /> Notas do profissional:
                                  </div>
                                  "{proposal.notes}"
                                </div>
                              )}

                              {/* Botões aceitar/recusar — só se pending e enviado pelo profissional */}
                              {isPending && !isMe && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleMetadataProposalAction(msg.id, 'rejected', proposal.totalValue)}
                                    className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors"
                                  >
                                    <XCircle size={13} /> Recusar
                                  </button>
                                  <button
                                    onClick={() => handleMetadataProposalAction(msg.id, 'accepted', proposal.totalValue)}
                                    className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 font-medium transition-colors"
                                  >
                                    <Check size={13} /> Aceitar Proposta
                                  </button>
                                </div>
                              )}

                              <p className="text-[10px] text-gray-400 text-center mt-3">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[82%] px-4 py-3 rounded-2xl shadow-sm text-sm break-words ${isMe ? 'bg-brand-primary text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                            {msg.file_url && (
                              msg.file_type === 'image'
                                ? <img src={msg.file_url} className="max-w-xs rounded-lg cursor-pointer max-h-48 object-cover mb-2" onClick={() => window.open(msg.file_url || '', '_blank')} alt="anexo" />
                                : <a href={msg.file_url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 underline mb-2 ${isMe ? 'text-blue-100' : 'text-brand-primary'}`}>Ver Anexo</a>
                            )}

                            {/* Quote and Booking Request Cards (Read-only on client side) */}
                            {msg.type === 'quote_request' && msg.metadata && (
                              <div className={`rounded-xl overflow-hidden mt-1 mb-2 border ${isMe ? 'border-brand-primary/40 bg-brand-primary' : 'border-gray-200 bg-white shadow-sm'}`}>
                                  <div className={`p-3 font-bold flex items-center gap-2 border-b ${isMe ? 'border-white/20 text-white' : 'border-gray-100 text-gray-900'}`}>
                                      <FileText size={18} /> Sua Solicitação de Orçamento
                                  </div>
                                  <div className={`p-3 space-y-3 ${isMe ? 'text-blue-50' : 'text-gray-600'}`}>
                                      {msg.metadata.notes && (
                                          <p className="whitespace-pre-wrap text-[13px]">{msg.metadata.notes}</p>
                                      )}
                                      
                                      {msg.metadata.responses && Object.keys(msg.metadata.responses).length > 0 && (
                                          <div className={`p-3 rounded-lg flex flex-col gap-2 ${isMe ? 'bg-black/10 text-white' : 'bg-gray-50 text-gray-800'}`}>
                                              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Respostas do Questionário</p>
                                              {Object.entries(msg.metadata.responses).map(([q, a], idx) => (
                                                  <div key={idx} className="text-xs">
                                                      <span className="font-bold opacity-90">{q}:</span> <span className="opacity-100">{a as React.ReactNode}</span>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                      
                                      {msg.metadata.budgetExpectation && (
                                          <div className={`p-2 rounded mt-2 text-xs font-semibold flex justify-between items-center ${isMe ? 'bg-black/10 text-white' : 'bg-brand-primary/10 text-brand-primary'}`}>
                                              <span>Sua Expectativa:</span>
                                              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(msg.metadata.budgetExpectation))}</span>
                                          </div>
                                      )}
                                  </div>
                              </div>
                            )}

                            {msg.type === 'booking_request' && msg.metadata && (
                              <div className={`rounded-xl overflow-hidden mt-1 mb-2 border ${isMe ? 'border-brand-primary/40 bg-brand-primary' : 'border-gray-200 bg-white shadow-sm'}`}>
                                  <div className={`p-3 font-bold flex items-center gap-2 border-b ${isMe ? 'border-white/20 text-white' : 'border-gray-100 text-gray-900'}`}>
                                      <Briefcase size={18} /> Solicitação de Agendamento
                                  </div>
                                  <div className={`p-3 space-y-3 ${isMe ? 'text-blue-50' : 'text-gray-600'}`}>
                                      <div className={`p-3 rounded-lg flex flex-col gap-2 ${isMe ? 'bg-black/10 text-white' : 'bg-gray-50 text-gray-800'}`}>
                                          <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                                              <span className="font-bold text-xs uppercase opacity-80">Valor Total Booking:</span>
                                              <span className="font-black">R$ {msg.metadata.price.toFixed(2)}</span>
                                          </div>
                                          {msg.metadata.scheduledFor && (
                                              <div className="text-xs flex gap-2 items-center">
                                                  <Clock size={14} className="opacity-80"/>
                                                  <span className="font-bold opacity-90">Para:</span> 
                                                  <span className="opacity-100">{new Date(msg.metadata.scheduledFor).toLocaleString('pt-BR')}</span>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                            )}

                            {/* Proposal card (tabela order_proposals) — cliente pode aceitar/recusar */}
                            {msg.order_proposals && (
                              <ClientProposalCard
                                proposal={msg.order_proposals}
                                isMe={isMe}
                                onAccept={() => handleProposalAction(msg.order_proposals!.id, 'accepted')}
                                onReject={() => handleProposalAction(msg.order_proposals!.id, 'rejected')}
                              />
                            )}

                            <span>{msg.content}</span>
                            <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-white border-t border-gray-100">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-grow p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
                      />
                      <Button variant="primary" type="submit" disabled={!newMessage.trim()}>Enviar</Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-gray-400">
                  <MessageSquare size={48} className="opacity-10 mb-4" />
                  <p className="text-sm font-medium">Selecione uma conversa</p>
                </div>
              )}
            </div>

            {/* ── Coluna Direita: Painel do Cliente ── */}
            {activeThread && (
              <div className="hidden lg:flex w-[280px] shrink-0 flex-col bg-white border-l border-gray-100 overflow-y-auto">
                <ClientInfoPanel thread={activeThread} />
              </div>
            )}
          </div>
        </div>
      </div>

      <ScheduleModal 
        isOpen={scheduleModalOpen} 
        onClose={() => setScheduleModalOpen(false)} 
        order={orderForSchedule} 
        onSuccess={() => {
          setScheduleModalOpen(false);
          // O toast e as novas mensagens já são feitas dentro do próprio ScheduleModal
        }} 
      />
    </>
  );
};

// ─── Client Proposal Card ───────────────────────────────────────────────────

const ClientProposalCard: React.FC<{
  proposal: OrderProposal;
  isMe: boolean;
  onAccept: () => void;
  onReject: () => void;
}> = ({ proposal, isMe, onAccept, onReject }) => {
  const feeAmount = proposal.amount * PLATFORM_FEE;
  const subtotal = proposal.amount - feeAmount;

  return (
    <div className={`p-4 rounded-2xl mb-2 border min-w-[280px] max-w-sm ${isMe ? 'bg-brand-primary/95 border-brand-primary text-white shadow-md' : 'bg-white border-gray-200 shadow-sm'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
           <span className="text-[10px] uppercase tracking-widest opacity-80 font-black mb-1 block">Orçamento</span>
           <span className={`font-black text-2xl leading-none tracking-tight`}>
             R$ {proposal.amount.toFixed(2)}
           </span>
        </div>
        <Badge className={
          proposal.status === 'accepted' ? 'bg-emerald-500 text-white border-0 text-[10px]' :
          proposal.status === 'rejected' ? 'bg-red-500 text-white border-0 text-[10px]' :
          'bg-amber-400 text-white border-0 text-[10px]'
        }>
          {proposal.status === 'accepted' ? 'Aceita' : proposal.status === 'rejected' ? 'Recusada' : 'Aguardando'}
        </Badge>
      </div>

      {/* Invoice Breakdown style */}
      <div className={`text-xs space-y-1.5 rounded-xl p-3 mb-3 border ${isMe ? 'bg-white/10 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
        <div className={`flex justify-between font-medium opacity-80`}>
          <span>Subtotal do Serviço</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>
        <div className={`flex justify-between font-medium opacity-80`}>
          <span>Taxa da plataforma (10%)</span>
          <span>R$ {feeAmount.toFixed(2)}</span>
        </div>
        <div className={`flex justify-between font-bold pt-1.5 mt-1.5 border-t ${isMe ? 'border-white/20' : 'border-slate-200'}`}>
          <span>Total a Pagar</span>
          <span>R$ {proposal.amount.toFixed(2)}</span>
        </div>
      </div>
      
      <div className={`text-[11px] space-y-1.5 mb-3 opacity-90`}>
        <div className="flex items-center gap-1.5">
           <CreditCard size={12} /> 
           <span className="font-bold">Pagamento:</span> 
           <span>{proposal.payment_method === 'on_completion' ? 'Na Conclusão do Serviço' : '100% Escrow (Protegido)'}</span>
        </div>
        {proposal.estimated_duration && (
          <div className="flex items-center gap-1.5">
            <Clock size={12} /> <span className="font-bold">Prazo:</span> <span>{proposal.estimated_duration}</span>
          </div>
        )}
      </div>

      {proposal.notes && (
        <div className={`text-[11px] italic mb-3 p-2.5 rounded-lg border ${isMe ? 'bg-white/5 border-white/10' : 'bg-amber-50/50 border-amber-100/50 text-slate-600'}`}>
          <div className="font-bold not-italic mb-1 flex items-center gap-1"><MessageSquare size={10} /> Notas do profissional:</div>
          "{proposal.notes}"
        </div>
      )}

      {/* Accept/Reject buttons — only if pending and sent by partner (not me) */}
      {proposal.status === 'pending' && !isMe && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors"
          >
            <XCircle size={12} /> Recusar
          </button>
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 font-medium transition-colors"
          >
            <Check size={12} /> Aceitar
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Client Info Panel (Coluna Direita) ────────────────────────────────────────

const ClientInfoPanel: React.FC<{ thread: Thread }> = ({ thread }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!thread.orderId) return;
    setLoadingOrder(true);
    const { data } = await supabase.from('orders').select('*').eq('id', thread.orderId).single();
    if (data) setOrder(data);
    setLoadingOrder(false);
  }, [thread.orderId]);

  useEffect(() => {
    setOrder(null);
    fetchOrder();
    if (!thread.orderId) return;
    const ch = supabase.channel(`cow2_${thread.orderId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${thread.orderId}` }, fetchOrder)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [thread.orderId, fetchOrder]);

  const isJobThread = !!thread.jobId && !thread.orderId;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Partner profile */}
      <div className="p-6 bg-white border-b border-gray-100 flex flex-col items-center text-center relative">
        <div className="absolute top-4 right-4">
           {isJobThread
            ? <Badge className="bg-gray-100 text-gray-600 font-bold border-0 text-[9px]">Negociação</Badge>
            : <Badge className="bg-emerald-100 text-emerald-700 font-bold border-0 text-[9px]">Ativo</Badge>
           }
        </div>
        <div className="w-20 h-20 bg-brand-primary/5 rounded-full flex items-center justify-center font-bold text-brand-primary text-2xl overflow-hidden mb-4 shadow-inner ring-4 ring-slate-50">
          {thread.partnerAvatar
            ? <img src={thread.partnerAvatar} className="w-full h-full object-cover" alt="" />
            : thread.partnerName.charAt(0).toUpperCase()}
        </div>
        <h3 className="font-black text-slate-800 text-lg tracking-tight">{thread.partnerName}</h3>
        <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{thread.partnerCategory || 'Profissional Verificado'}</p>
        
        <div className="flex items-center gap-1.5 mt-4 text-slate-400 text-xs font-medium">
          <MapPin size={12} />
          <span>{thread.partnerLocation || 'Brasil'}</span>
        </div>
      </div>

      {/* Colaborar Actions */}
      <div className="px-5 py-6 bg-white border-b border-gray-100">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Colaborar</p>
         <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" size="sm" className="w-full text-[10px] h-9 flex items-center justify-center gap-1.5 p-0" title="Contratar">
               <Briefcase size={13} /> Contratar
            </Button>
            <Button variant="outline" size="sm" className="w-full text-[10px] h-9 flex items-center justify-center gap-1.5 p-0 bg-white" title="Nova Proposta">
               <Plus size={13} /> Proposta
            </Button>
            <Button variant="outline" size="sm" className="w-full text-[10px] h-9 flex items-center justify-center gap-1.5 p-0 bg-white" title="Solicitar Pagamento">
               <CreditCard size={13} /> Pagamento
            </Button>
            <Button variant="outline" size="sm" className="w-full text-[10px] h-9 flex items-center justify-center gap-1.5 p-0 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 bg-white" title="Videochamada">
               <Video size={13} /> Reunião
            </Button>
         </div>
      </div>

      {/* Escrow protection badge */}
      {thread.orderId && (
        <div className="px-5 pt-6 pb-2">
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700 mb-2">
              <ShieldCheck size={16} />
              <span className="text-[11px] font-black uppercase tracking-widest">Proteção CONTRATTO</span>
            </div>
            <p className="text-xs text-emerald-600 font-medium leading-relaxed">Seu pagamento está seguro. O profissional só recebe após você aprovar a entrega final.</p>
          </div>
        </div>
      )}

      {/* Briefing / Order management */}
      {thread.orderId && (
        <div className="p-5 flex-grow overflow-y-auto">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Gestão do Pedido</p>

          {loadingOrder
            ? <LoadingSkeleton className="h-24 w-full rounded-2xl" />
            : order && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-wrap gap-1.5">
                    {order.status === 'active' && <Badge className="bg-blue-600 text-white border-0 text-[10px]">Em Andamento</Badge>}
                    {order.status === 'in_progress' && <Badge className="bg-blue-500 text-white border-0 text-[10px]">Em Revisão</Badge>}
                    {order.status === 'delivered' && <Badge className="bg-amber-500 text-white border-0 text-[10px]">Ag. Aprovação</Badge>}
                    {order.status === 'completed' && <Badge className="bg-emerald-600 text-white border-0 text-[10px]">Finalizado</Badge>}
                </div>

                {/* Download delivery */}
                {(order.status === 'delivered' || order.status === 'completed') && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-blue-700 mb-2 flex items-center gap-1"><Download size={11} /> Entrega Disponível</p>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full text-[11px]"
                      onClick={async () => {
                        const filePath = (order.package_snapshot as any)?.latest_delivery;
                        if (!filePath) { addToast("Arquivo não encontrado.", "error"); return; }
                        const { data, error } = await supabase.storage.from('order-deliverables').createSignedUrl(filePath, 60);
                        if (error) { addToast("Erro ao gerar link.", "error"); return; }
                        if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                      }}
                    >Baixar Arquivos</Button>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  {order.status === 'delivered' && (
                    <>
                      <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => setIsReviewModalOpen(true)}>
                        <CheckCircle size={13} className="mr-1.5" />Aprovar e Finalizar
                      </Button>
                      <Button
                        size="sm" variant="secondary"
                        className="w-full text-amber-600 border-amber-200 hover:bg-amber-50 text-xs"
                        onClick={async () => {
                          if (order.revision_count >= 3) { addToast("Limite de revisões atingido.", "error"); return; }
                          const { error } = await supabase.from('orders').update({
                            status: 'in_progress',
                            revision_count: (order.revision_count || 0) + 1
                          }).eq('id', order.id);
                          if (!error) {
                            await supabase.from('messages').insert({
                              order_id: order.id, sender_id: user?.id, receiver_id: thread.partnerId,
                              content: `📝 Revisão #${(order.revision_count || 0) + 1} solicitada.`, is_system_message: true,
                            });
                            addToast("Revisão solicitada.", "success");
                            fetchOrder();
                          }
                        }}
                      >Solicitar Revisão ({order.revision_count || 0}/3)</Button>
                    </>
                  )}
                  {['active', 'in_progress', 'delivered'].includes(order.status) && (
                    <Button size="sm" variant="secondary" className="w-full bg-white text-red-500 hover:bg-red-50 border border-red-200 text-xs" onClick={() => setIsDisputeModalOpen(true)}>
                      <AlertCircle size={13} className="mr-1.5" />Abrir Disputa
                    </Button>
                  )}
                </div>

                <div className="pt-3 border-t text-[9px] text-gray-400 flex items-center gap-1.5">
                  <Clock size={10} /> Criado em {new Date(order.created_at).toLocaleDateString()}
                </div>

                {isReviewModalOpen && (
                  <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><LoadingSpinner /></div>}>
                    <ReviewModal
                      orderId={order.id} reviewerId={order.buyer_id} revieweeId={order.seller_id}
                      isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onSuccess={fetchOrder}
                    />
                  </Suspense>
                )}
                {isDisputeModalOpen && (
                  <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><LoadingSpinner /></div>}>
                    <DisputeModal
                      orderId={order.id} buyerId={order.buyer_id!} sellerId={order.seller_id!}
                      isOpen={isDisputeModalOpen} onClose={() => setIsDisputeModalOpen(false)} onSuccess={fetchOrder}
                    />
                  </Suspense>
                )}
              </div>
            )
          }
        </div>
      )}

      {/* Job thread — no order yet */}
      {isJobThread && (
        <div className="p-4 flex-grow">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Sobre a Conversa</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Você está em fase de negociação. Assim que um orçamento for enviado, você poderá aceitar e confirmar o pedido aqui.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientMessagesPage;
