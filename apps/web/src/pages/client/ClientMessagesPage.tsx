import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@tgt/shared';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Button from '@/components/ui/Button';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  job_id?: string;
  order_id?: string;
}

interface Thread {
  threadId: string; // The unified ID (jobId or orderId)
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchThreads = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch all messages where user is sender or receiver
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

      // Helper to identify partner
      const getPartnerId = (msg: any) => msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

      allMessages.forEach(msg => {
        const partnerId = getPartnerId(msg);
        if (partnerId && (msg.job_id || msg.order_id)) {
          partnerIdsToFetch.add(partnerId);
        }
      });

      // Fetch profiles/companies
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
        if (!msg.job_id && !msg.order_id) return;

        const threadId = msg.job_id || msg.order_id;
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

      // Handle startConversationWith (From InquiryModal now passed as activeJobId)
      const state = (location as any).state as { activeJobId?: string };

      if (state?.activeJobId) {
        const targetThread = uniqueThreads.get(state.activeJobId);
        if (targetThread) {
          setActiveThread(targetThread);
        } else {
          // If it's a new job with no messages yet, we might need to fetch the job details manually
          // providing 'ghost' thread functionality.
          // Logic: Fetch job, create "Empty" thread.
          const { data: job } = await supabase
            .from('jobs')
            .select('title, user_id, category_id') // We need to find who is the other party? 
            // Wait, if I am the client (user_id of job), who is the provider?
            // The proposal tells us the provider.
            .eq('id', state.activeJobId)
            .single();

          // This part is tricky. Who are we talking to?
          // InquiryModal created a message, so it SHOULD be in `allMessages`.
          // If InquiryModal created a message, `allMessages` has it.
          // So if it's not in uniqueThreads, maybe replication lag?
        }
      }

      setThreads(Array.from(uniqueThreads.values()));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, location.state]);

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
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Update last message in thread list
          setThreads(prev => prev.map(t =>
            t.threadId === activeThread.threadId
              ? { ...t, lastMessage: newMsg.content, lastMessageTime: newMsg.created_at, unreadCount: 0 }
              : t
          ));
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [activeThread, user, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread || !user) return;

    const optimisticMsg: Message = {
      id: 'temp-' + Date.now(),
      sender_id: user.id,
      receiver_id: activeThread.partnerId,
      content: newMessage,
      created_at: new Date().toISOString(),
      read_at: null,
      job_id: activeThread.jobId,
      order_id: activeThread.orderId
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');

    const insertPayload: any = {
      sender_id: user.id,
      receiver_id: activeThread.partnerId,
      content: optimisticMsg.content
    };

    if (activeThread.jobId) insertPayload.job_id = activeThread.jobId;
    if (activeThread.orderId) insertPayload.order_id = activeThread.orderId;

    const { error } = await supabase.from('messages').insert(insertPayload);

    if (error) {
      console.error('Error sending:', error);
      // Optionally remove optimistic message
    }
  };

  return (
    <>
      <Helmet>
        <title>Minhas Mensagens | CONTRATTO</title>
      </Helmet>

      <div className="pt-24 pb-12 bg-[#F8FAFC] min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link to="/perfil" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#00b09b] transition-colors">
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mr-3 hidden sm:flex">
                <ArrowLeft size={16} />
              </div>
              <ArrowLeft size={16} className="mr-2 sm:hidden" />
              Voltar para Perfil
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100/50 overflow-hidden flex h-[700px]">
            {/* Sidebar (Thread List) */}
            <div className={`w-full md:w-1/3 flex flex-col border-r border-gray-100 bg-white ${activeThread ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-6 border-b border-gray-100 flex-shrink-0 bg-white/50 backdrop-blur-md">
                <h2 className="text-xl font-black text-[#1E293B] tracking-tight">Conversas</h2>
                <p className="text-xs text-gray-400 font-medium mt-1">Gerencie suas mensagens</p>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="p-6 space-y-4">
                    <LoadingSkeleton className="h-16 w-full rounded-2xl" />
                    <LoadingSkeleton className="h-16 w-full rounded-2xl" />
                    <LoadingSkeleton className="h-16 w-full rounded-2xl" />
                  </div>
                ) : threads.length === 0 ? (
                  <div className="p-8 text-center flex-1 flex flex-col items-center justify-center m-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare size={24} className="text-gray-300" />
                    </div>
                    <h3 className="text-[#1E293B] font-bold text-lg">Nenhuma conversa</h3>
                    <p className="text-gray-500 text-sm mt-1 mb-6">Você ainda não tem mensagens com empresas.</p>
                    <Link to="/empresas">
                      <Button size="sm" className="shadow-md shadow-brand-primary/20">Encontrar profissionais</Button>
                    </Link>
                  </div>
                ) : (
                  threads.map(thread => (
                    <button
                      key={thread.threadId}
                      onClick={() => setActiveThread(thread)}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${activeThread?.threadId === thread.threadId ? 'bg-blue-50 border-l-4 border-l-brand-primary' : ''}`}
                    >
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-gray-500 font-bold overflow-hidden shadow-sm relative">
                        {thread.partnerAvatar ? (
                          <img src={thread.partnerAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          thread.partnerName.charAt(0)
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-semibold text-gray-900 truncate">{thread.partnerName}</span>
                          <span className="text-xs text-gray-500 ml-2 truncate max-w-[100px] block">{thread.jobTitle}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500 truncate pr-2">{thread.lastMessage}</p>
                          {thread.unreadCount > 0 && (
                            <span className="bg-brand-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col min-w-0 bg-gray-50/50 ${!activeThread ? 'hidden md:flex' : 'flex'}`}>
              {activeThread ? (
                <>
                  <div className="p-3 md:p-4 bg-white border-b border-gray-100 flex items-center gap-3 shadow-sm z-10 sticky top-0">
                    <button onClick={() => setActiveThread(null)} className="md:hidden text-gray-500 p-1 -ml-1">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                      {activeThread.partnerAvatar ? (
                        <img src={activeThread.partnerAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        activeThread.partnerName.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-800 truncate">{activeThread.partnerName}</h3>
                      <p className="text-xs text-brand-primary truncate">{activeThread.jobTitle}</p>
                      <span className="text-xs text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                      </span>
                    </div>
                  </div>

                  <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
                    {messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl shadow-sm text-sm break-words ${isMe
                              ? 'bg-brand-primary text-white rounded-br-none'
                              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                              }`}
                          >
                            {msg.content}
                            <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-3 md:p-4 bg-white border-t border-gray-100 z-10">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-grow p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
                      />
                      <Button variant="primary" type="submit" disabled={!newMessage.trim()} className="px-4">
                        Enviar
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-600">Suas Mensagens</h3>
                  <p className="text-sm mt-2">Selecione uma conversa para começar.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientMessagesPage;
