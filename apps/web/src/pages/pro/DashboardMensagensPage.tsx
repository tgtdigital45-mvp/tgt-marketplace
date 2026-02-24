import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@tgt/shared';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Button from '@/components/ui/Button';

const QUICK_REPLIES = [
    'Estou a caminho do local',
    'Chego em 10 minutos',
    'Por favor, confirme o endereço',
    'Serviço concluído com sucesso!',
    'Podemos reagendar para amanhã?',
];

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    type?: 'text' | 'image' | 'file';
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

const DashboardMensagensPage: React.FC = () => {
    const { user } = useAuth();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [activeThread, setActiveThread] = useState<Thread | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeThread]);

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

            // Helper to identify partner (the client)
            const getPartnerId = (msg: any) => msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

            allMessages.forEach(msg => {
                const partnerId = getPartnerId(msg);
                if (partnerId && (msg.job_id || msg.order_id)) {
                    partnerIdsToFetch.add(partnerId);
                }
            });

            // Fetch profiles for partners (clients)
            let profilesMap: Record<string, any> = {};
            if (partnerIdsToFetch.size > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', Array.from(partnerIdsToFetch));

                profiles?.forEach(p => profilesMap[p.id] = p);
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
                        partnerName: profile?.full_name || 'Cliente',
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
            // Mark as read in UI
            setThreads(prev => prev.map(t =>
                t.threadId === activeThread.threadId ? { ...t, unreadCount: 0 } : t
            ));

            const filterColumn = activeThread.jobId ? 'job_id' : 'order_id';

            // Subscribe to new messages for this Job/Order
            const subscription = supabase
                .channel(`chat_thread_pro:${activeThread.threadId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `${filterColumn}=eq.${activeThread.threadId}`
                }, (payload) => {
                    const newMsg = payload.new as Message;

                    // Only add if it's NOT from the current user (to avoid dupes with optimistic UI)
                    if (newMsg.sender_id !== user.id) {
                        setMessages(prev => {
                            if (prev.some(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });

                        // Update thread list last message
                        setThreads(prev => prev.map(t =>
                            t.threadId === activeThread.threadId
                                ? { ...t, lastMessage: newMsg.content, lastMessageTime: newMsg.created_at, unreadCount: 0 } // Mark as read since we are viewing it
                                : t
                        ));
                    }
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
            // Remove optimistic message if needed
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        }
    };

    const handleAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeThread || !user) return;
        try {
            setUploadingFile(true);
            const path = `messages/${activeThread.threadId}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(path);
            const msgType = file.type.startsWith('image/') ? 'image' : 'file';
            const insertPayload: any = {
                sender_id: user.id,
                receiver_id: activeThread.partnerId,
                content: publicUrl,
                type: msgType,
            };
            if (activeThread.jobId) insertPayload.job_id = activeThread.jobId;
            if (activeThread.orderId) insertPayload.order_id = activeThread.orderId;
            const optimisticMsg: Message = {
                id: 'temp-' + Date.now(),
                sender_id: user.id,
                receiver_id: activeThread.partnerId,
                content: publicUrl,
                type: msgType,
                created_at: new Date().toISOString(),
                read_at: null,
                job_id: activeThread.jobId,
                order_id: activeThread.orderId,
            };
            setMessages(prev => [...prev, optimisticMsg]);
            const { error } = await supabase.from('messages').insert(insertPayload);
            if (error) setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
        } catch (err) {
            console.error('Attachment error:', err);
        } finally {
            setUploadingFile(false);
            e.target.value = '';
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <Helmet>
                <title>Mensagens | Dashboard CONTRATTO</title>
            </Helmet>
            {/* Sidebar List */}
            <div className={`${activeThread ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-gray-100 flex-col`}>
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Mensagens</h2>
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-4 space-y-4">
                            <LoadingSkeleton className="h-16 w-full rounded-lg" />
                            <LoadingSkeleton className="h-16 w-full rounded-lg" />
                            <LoadingSkeleton className="h-16 w-full rounded-lg" />
                        </div>
                    ) : threads.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            Nenhuma conversa iniciada.
                        </div>
                    ) : (
                        threads.map(thread => (
                            <button
                                key={thread.threadId}
                                onClick={() => setActiveThread(thread)}
                                className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${activeThread?.threadId === thread.threadId ? 'bg-blue-50 border-r-4 border-brand-primary' : ''}`}
                            >
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-gray-500 font-bold overflow-hidden relative">
                                    {thread.partnerAvatar ? (
                                        <img src={thread.partnerAvatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        thread.partnerName.charAt(0)
                                    )}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-semibold text-gray-900 truncate">{thread.partnerName}</span>
                                        <span className="text-xs text-gray-400 flex-shrink-0">
                                            {new Date(thread.lastMessageTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-brand-primary truncate max-w-[150px]">{thread.jobTitle}</p>
                                        {thread.unreadCount > 0 && (
                                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                        )}
                                    </div>
                                    <p className={`text-sm truncate mt-1 ${thread.unreadCount > 0 ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                                        {thread.lastMessage}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`${!activeThread ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col bg-slate-50 relative`}>
                {activeThread ? (
                    <>
                        <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3 shadow-sm z-10 shrink-0">
                            <button onClick={() => setActiveThread(null)} className="md:hidden text-gray-500 mr-2">
                                ←
                            </button>
                            <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                                {activeThread.partnerAvatar ? (
                                    <img src={activeThread.partnerAvatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    activeThread.partnerName.charAt(0)
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{activeThread.partnerName}</h3>
                                <p className="text-xs text-brand-primary">{activeThread.jobTitle}</p>
                            </div>
                        </div>

                        <div
                            ref={chatContainerRef}
                            className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar"
                        >
                            {messages.map((msg) => {
                                const isMe = msg.sender_id === user?.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm text-sm break-words ${isMe
                                                ? 'bg-brand-primary text-white rounded-br-none'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                                }`}
                                        >
                                            {msg.type === 'image' ? (
                                                <img
                                                    src={msg.content}
                                                    alt="Imagem"
                                                    className="max-w-xs rounded-lg cursor-pointer"
                                                    onClick={() => window.open(msg.content, '_blank')}
                                                />
                                            ) : msg.type === 'file' ? (
                                                <a href={msg.content} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 underline ${isMe ? 'text-blue-100' : 'text-brand-primary'}`}>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                    Abrir arquivo
                                                </a>
                                            ) : (
                                                msg.content
                                            )}
                                            <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100">
                            {/* Quick Replies Panel */}
                            {showQuickReplies && (
                                <div className="mb-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                    {QUICK_REPLIES.map(reply => (
                                        <button
                                            key={reply}
                                            onClick={() => { setNewMessage(reply); setShowQuickReplies(false); }}
                                            className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                                        >
                                            {reply}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                                {/* Quick Replies Toggle */}
                                <button
                                    type="button"
                                    title="Respostas Rápidas"
                                    onClick={() => setShowQuickReplies(v => !v)}
                                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${showQuickReplies ? 'bg-brand-primary/10 text-brand-primary' : 'text-gray-400 hover:text-brand-primary hover:bg-gray-100'}`}
                                >
                                    ⚡
                                </button>
                                {/* Attachment */}
                                <label htmlFor="chat-attachment" className="cursor-pointer p-2 rounded-lg text-gray-400 hover:text-brand-primary hover:bg-gray-100 transition-colors flex-shrink-0" title="Anexar arquivo">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                    <input id="chat-attachment" type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleAttachment} disabled={uploadingFile} />
                                </label>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={uploadingFile ? 'Enviando arquivo...' : 'Digite sua mensagem...'}
                                    disabled={uploadingFile}
                                    className="flex-grow p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm disabled:opacity-60"
                                />
                                <Button variant="primary" type="submit" disabled={!newMessage.trim() || uploadingFile}>
                                    Enviar
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-16 h-16 mb-4 opacity-20" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                        </svg>
                        <p>Selecione uma conversa para começar</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardMensagensPage;
