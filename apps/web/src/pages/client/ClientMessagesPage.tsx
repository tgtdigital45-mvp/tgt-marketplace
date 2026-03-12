import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@tgt/shared';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { LoadingSpinner } from '@tgt/shared';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, MessageSquare, Clock, ShieldCheck, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ReviewModal = lazy(() => import('@/components/orders/ReviewModal'));
const DisputeModal = lazy(() => import('@/components/orders/DisputeModal'));

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  job_id?: string;
  order_id?: string;
  type?: 'text' | 'image' | 'file';
}

interface Thread {
  threadId: string;
  jobId?: string;
  orderId?: string;
  jobTitle: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const ClientMessagesPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchThreads = useCallback(async () => {
    if (!user) return;
    try {
      const { data: sent, error: sentError } = await supabase
        .from('messages')
        .select('*, jobs(title), orders(service_title)')
        .eq('sender_id', user.id);

      const { data: received, error: receivedError } = await supabase
        .from('messages')
        .select('*, jobs(title), orders(service_title)')
        .eq('receiver_id', user.id);

      if (sentError || receivedError) throw new Error('Failed to fetch messages');

      const allMessages = [...(sent || []), ...(received || [])];
      allMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const uniqueThreads = new Map<string, Thread>();
      const partnerIdsToFetch = new Set<string>();

      const getPartnerId = (msg: any) => msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

      allMessages.forEach(msg => {
        const partnerId = getPartnerId(msg);
        if (partnerId) partnerIdsToFetch.add(partnerId);
      });

      let profilesMap: Record<string, any> = {};
      if (partnerIdsToFetch.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', Array.from(partnerIdsToFetch));

        const { data: companies } = await supabase
          .from('companies')
          .select('profile_id, company_name, logo_url')
          .in('profile_id', Array.from(partnerIdsToFetch));

        profiles?.forEach(p => profilesMap[p.id] = p);
        companies?.forEach(c => {
          profilesMap[c.profile_id] = {
            id: c.profile_id,
            full_name: c.company_name,
            avatar_url: c.logo_url
          };
        });
      }

      allMessages.forEach((msg: any) => {
        const threadId = msg.job_id || msg.order_id;
        if (!threadId) return;

        if (!uniqueThreads.has(threadId)) {
          const partnerId = getPartnerId(msg);
          const profile = profilesMap[partnerId];

          let jobTitle = 'Serviço';
          if (msg.job_id && msg.jobs?.title) jobTitle = msg.jobs.title;
          else if (msg.order_id && msg.orders?.service_title) jobTitle = msg.orders.service_title;

          uniqueThreads.set(threadId, {
            threadId: threadId,
            jobId: msg.job_id,
            orderId: msg.order_id,
            jobTitle: jobTitle,
            partnerId: partnerId,
            partnerName: profile?.full_name || 'Usuário',
            partnerAvatar: profile?.avatar_url,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: (msg.receiver_id === user.id && !msg.read_at) ? 1 : 0
          });
        }
      });

      setThreads(Array.from(uniqueThreads.values()));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (threadId: string, isJob: boolean) => {
    if (!user) return;
    const filterColumn = isJob ? 'job_id' : 'order_id';
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq(filterColumn, threadId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  }, [user]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (activeThread && user) {
      fetchMessages(activeThread.threadId, !!activeThread.jobId);
      setThreads(prev => prev.map(t =>
        t.threadId === activeThread.threadId ? { ...t, unreadCount: 0 } : t
      ));

      const filterColumn = activeThread.jobId ? 'job_id' : 'order_id';
      const subscription = supabase
        .channel(`chat_thread_client:${activeThread.threadId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `${filterColumn}=eq.${activeThread.threadId}`
        }, (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id !== user.id) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setThreads(prev => prev.map(t =>
              t.threadId === activeThread.threadId
                ? { ...t, lastMessage: newMsg.content, lastMessageTime: newMsg.created_at, unreadCount: 0 }
                : t
            ));
          }
        })
        .subscribe();

      return () => { subscription.unsubscribe(); };
    }
  }, [activeThread, user, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread || !user) return;

    const insertPayload: any = {
      sender_id: user.id,
      receiver_id: activeThread.partnerId,
      content: newMessage,
      job_id: activeThread.jobId,
      order_id: activeThread.orderId
    };

    const { error } = await supabase.from('messages').insert(insertPayload);
    if (!error) {
      setMessages(prev => [...prev, {
        id: 'temp-' + Date.now(),
        ...insertPayload,
        created_at: new Date().toISOString(),
        read_at: null
      }]);
      setNewMessage('');
    }
  };

  return (
    <>
      <Helmet>
        <title>Minhas Mensagens | CONTRATTO</title>
      </Helmet>

      <div className="pt-24 pb-12 bg-[#F8FAFC] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <Link to="/perfil" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-brand-primary transition-colors">
              <ArrowLeft size={16} className="mr-2" />
              Voltar ao Perfil
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100/50 overflow-hidden flex h-[700px]">
            {/* Sidebar */}
            <div className={`w-full md:w-1/3 flex flex-col border-r border-gray-100 bg-white ${activeThread ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-6 border-b border-gray-100 bg-white/50">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Suas Conversas</h2>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? <div className="p-6 space-y-4"><LoadingSkeleton className="h-16 w-full rounded-2xl" /></div> :
                  threads.length === 0 ? (
                    <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
                      <MessageSquare size={32} className="text-gray-200 mb-4" />
                      <p className="text-gray-500 text-sm">Nenhuma mensagem ainda.</p>
                    </div>
                  ) : (
                    threads.map(t => (
                      <button key={t.threadId} onClick={() => setActiveThread(t)} className={`w-full p-4 flex gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${activeThread?.threadId === t.threadId ? 'bg-blue-50 border-l-4 border-brand-primary' : ''}`}>
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-gray-500 overflow-hidden shadow-sm">
                          {t.partnerAvatar ? <img src={t.partnerAvatar} className="w-full h-full object-cover" /> : t.partnerName.charAt(0)}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="font-bold text-gray-900 truncate">{t.partnerName}</span>
                            <span className="text-[10px] text-gray-400">{new Date(t.lastMessageTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <p className="text-[10px] text-brand-primary uppercase font-bold truncate mb-1">{t.jobTitle}</p>
                          <p className="text-sm text-gray-500 truncate">{t.lastMessage}</p>
                        </div>
                      </button>
                    ))
                  )}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-row min-w-0 bg-gray-50/50 ${!activeThread ? 'hidden md:flex' : 'flex'}`}>
              <div className="flex-grow flex flex-col min-w-0 bg-slate-50 relative border-r border-gray-100">
                {activeThread ? (
                  <>
                    <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3 shadow-sm z-10 sticky top-0">
                      <button onClick={() => setActiveThread(null)} className="md:hidden text-gray-500"><ArrowLeft size={18} /></button>
                      <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold overflow-hidden shadow-sm">
                        {activeThread.partnerAvatar ? <img src={activeThread.partnerAvatar} className="w-full h-full object-cover" /> : activeThread.partnerName.charAt(0)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-bold text-gray-800 truncate">{activeThread.partnerName}</h3>
                        <p className="text-xs text-brand-primary font-bold uppercase">{activeThread.jobTitle}</p>
                      </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                      {messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm text-sm break-words ${isMe ? 'bg-brand-primary text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                              {msg.content}
                              <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-gray-100">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." className="flex-grow p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm" />
                        <Button variant="primary" type="submit" disabled={!newMessage.trim()}>Enviar</Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-gray-400">
                    <MessageSquare size={48} className="opacity-10 mb-4" />
                    <p className="text-sm font-medium">Selecione uma conversa para visualizar as mensagens.</p>
                  </div>
                )}
              </div>

              {/* Client Order Summary Sidebar */}
              {activeThread?.orderId && (
                <div className="hidden lg:flex w-72 flex-col bg-white shrink-0">
                  <ClientOrderSummaryWidget orderId={activeThread.orderId} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ClientOrderSummaryWidget: React.FC<{ orderId: string }> = ({ orderId }) => {
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const { addToast } = useToast();

  const fetchOrder = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (data) setOrder(data);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    const ch = supabase.channel(`cow_${orderId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, fetchOrder).subscribe();
    return () => { ch.unsubscribe(); };
  }, [orderId, fetchOrder]);

  if (loading) return <div className="p-6 space-y-4"><LoadingSkeleton className="h-20 w-full" /></div>;
  if (!order) return null;

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Seu Pedido</h3>
      <div className="space-y-3">
        <h4 className="font-bold text-sm text-gray-900 leading-tight">{order.service_title}</h4>
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="text-[9px] h-4 py-0">{order.package_tier}</Badge>
          <span className="text-sm font-bold text-brand-primary">R$ {order.price}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {order.status === 'active' && <Badge className="bg-blue-600 text-white text-[9px]">Ativo</Badge>}
          {order.status === 'delivered' && <Badge className="bg-amber-500 text-white text-[9px]">Aguardando Aprovação</Badge>}
          {order.status === 'completed' && <Badge className="bg-emerald-600 text-white text-[9px]">Finalizado</Badge>}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-tight">Proteção CONTRATTO</span>
          </div>
          <p className="text-[10px] text-emerald-600 leading-relaxed font-medium">Seu pagamento está seguro em escrow e só será liberado quando você aprovar o serviço.</p>
        </div>

        {(order.status === 'delivered' || order.status === 'completed') && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mt-4">
            <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center">
              <Download size={14} className="mr-2" />
              Entrega Disponível
            </h3>
            <p className="text-[10px] text-blue-700 mb-3">
              O vendedor enviou os arquivos finais.
            </p>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white w-full text-xs"
              onClick={async () => {
                try {
                  const snapshot = order.package_snapshot as any;
                  const filePath = snapshot?.latest_delivery;

                  if (!filePath) {
                    addToast("Arquivo não encontrado.", "error");
                    return;
                  }

                  const { data, error } = await supabase.storage
                    .from('order-deliverables')
                    .createSignedUrl(filePath, 60);

                  if (error) throw error;
                  if (data?.signedUrl) {
                    window.open(data.signedUrl, '_blank');
                  }
                } catch (e: any) {
                  addToast("Erro: " + e.message, "error");
                }
              }}
            >
              Baixar Arquivos
            </Button>
          </div>
        )}

        <div className="space-y-2 mt-4">
          {order.status === 'delivered' && (
            <>
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => setIsReviewModalOpen(true)}>
                <CheckCircle size={14} className="mr-2" />
                Aprovar e Finalizar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="w-full text-red-600 border-red-200 hover:bg-red-50 text-xs"
                onClick={async () => {
                  if (order.revision_count >= 3) {
                    addToast("Limite de revisões atingido.", "error");
                    return;
                  }
                  try {
                    const { error } = await supabase.from('orders').update({
                      status: 'in_progress',
                      revision_count: (order.revision_count || 0) + 1
                    }).eq('id', order.id);

                    if (error) throw error;
                    await supabase.from('messages').insert({
                      order_id: order.id,
                      sender_id: user?.id,
                      content: `SYSTEM: O comprador solicitou a revisão #${(order.revision_count || 0) + 1}.`,
                    });

                    fetchOrder();
                    addToast("Revisão solicitada.", "success");
                  } catch (err: any) {
                    addToast("Erro ao solicitar revisão: " + err.message, "error");
                  }
                }}
              >
                Solicitar Revisão ({order.revision_count || 0}/3)
              </Button>
              <Button size="sm" variant="secondary" className="w-full bg-white text-gray-500 hover:bg-gray-100 border border-gray-200 text-xs" onClick={() => setIsDisputeModalOpen(true)}>
                <AlertCircle size={14} className="mr-2" />
                Abrir Disputa
              </Button>
            </>
          )}

          {(order.status === 'active' || order.status === 'in_progress') && (
            <Button size="sm" variant="secondary" className="w-full bg-white text-red-500 hover:bg-red-50 border border-red-200 text-xs mt-2" onClick={() => setIsDisputeModalOpen(true)}>
              <AlertCircle size={14} className="mr-2" />
              Abrir Disputa
            </Button>
          )}
        </div>

      </div>

      <div className="pt-4 border-t text-[9px] text-gray-400 flex items-center gap-1.5">
        <Clock size={10} />
        Criado em {new Date(order.created_at).toLocaleDateString()}
      </div>

      {isReviewModalOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <LoadingSpinner />
          </div>
        }>
          <ReviewModal
            orderId={order.id}
            reviewerId={order.buyer_id}
            revieweeId={order.seller_id}
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            onSuccess={fetchOrder}
          />
        </Suspense>
      )}

      {isDisputeModalOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <LoadingSpinner />
          </div>
        }>
          <DisputeModal
            orderId={order.id}
            buyerId={order.buyer_id!}
            sellerId={order.seller_id!}
            isOpen={isDisputeModalOpen}
            onClose={() => setIsDisputeModalOpen(false)}
            onSuccess={fetchOrder}
          />
        </Suspense>
      )}
    </div>
  );
};

export default ClientMessagesPage;
