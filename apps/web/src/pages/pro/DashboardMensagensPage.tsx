import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@tgt/core';

import { LoadingSpinner, Badge, Button, LoadingSkeleton } from '@tgt/ui-web';
import { ProposalModal } from '@/components/orders/ProposalModal';


import { motion } from 'framer-motion';
import {
    ChevronRight, Paperclip, Zap, ArrowLeft, Clock,
    MessagesSquare, Search, Video, CreditCard, X, Check, XCircle, FileText
} from 'lucide-react';

const DeliveryModal = lazy(() => import('@/components/orders/DeliveryModal'));

const PLATFORM_FEE = 0.10; // 10% taxa Contratto

const QUICK_REPLIES = [
    'Estou a caminho do local',
    'Chego em 10 minutos',
    'Por favor, confirme o endereço',
    'Serviço concluído com sucesso!',
    'Podemos reagendar para amanhã?',
];

interface OrderProposal {
    id: string;
    amount: number;
    status: 'pending' | 'accepted' | 'rejected';
    estimated_duration: string | null;
    notes: string | null;
}

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    file_url?: string | null;
    file_type?: string | null;
    proposal_id?: string | null;
    is_system_message?: boolean;
    created_at: string;
    is_read: boolean;
    job_id?: string;
    order_id?: string;
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
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DashboardMensagensPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [activeThread, setActiveThread] = useState<Thread | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Sidebar filters
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'leads'>('all');

    // Proposal modal
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [sendingProposal, setSendingProposal] = useState(false);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => { scrollToBottom(); }, [messages, activeThread]);

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
        } catch (err) {
            console.error('[DashboardMensagens] Error fetching threads:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchMessages = useCallback(async (threadId: string, isJob: boolean) => {
        if (!user) return;
        const filterColumn = isJob ? 'job_id' : 'order_id';
        const { data } = await supabase
            .from('messages')
            .select(`*, order_proposals(id, amount, status, estimated_duration, notes)`)
            .eq(filterColumn, threadId)
            .order('created_at', { ascending: true });
        if (data) setMessages(data);
    }, [user]);

    useEffect(() => { fetchThreads(); }, [fetchThreads]);

    useEffect(() => {
        if (!activeThread || !user) return;
        fetchMessages(activeThread.threadId, !!activeThread.jobId);
        setThreads(prev => prev.map(t =>
            t.threadId === activeThread.threadId ? { ...t, unreadCount: 0 } : t
        ));

        const filterColumn = activeThread.jobId ? 'job_id' : 'order_id';
        const sub = supabase
            .channel(`chat_thread_pro:${activeThread.threadId}`)
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'messages',
                filter: `${filterColumn}=eq.${activeThread.threadId}`
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
        return () => { sub.unsubscribe(); };
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
            setThreads(prev => prev.map(t =>
                t.threadId === activeThread.threadId ? { ...t, lastMessage: payload.content, lastMessageTime: new Date().toISOString() } : t
            ));
        }
    };

    const handleAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeThread || !user) return;
        try {
            setUploadingFile(true);
            const path = `messages/${activeThread.threadId}/${Date.now()}-${file.name}`;
            await supabase.storage.from('attachments').upload(path, file);
            const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(path);
            const msgType = file.type.startsWith('image/') ? 'image' : 'file';
            const payload: any = {
                sender_id: user.id, receiver_id: activeThread.partnerId,
                content: msgType === 'image' ? '🖼️ Imagem anexada' : '📄 Arquivo anexado',
                file_url: publicUrl, file_type: msgType,
                job_id: activeThread.jobId, order_id: activeThread.orderId
            };
            await supabase.from('messages').insert(payload);
            setMessages(prev => [...prev, { id: 'temp-' + Date.now(), ...payload, created_at: new Date().toISOString(), is_read: false }]);
        } catch (err) {
            console.error('Attachment error:', err);
        } finally {
            setUploadingFile(false);
            e.target.value = '';
        }
    };

    const handleVideoCall = async () => {
        if (!activeThread || !user) return;
        const roomId = activeThread.threadId.replace(/-/g, '').slice(0, 16);
        const videoUrl = `https://meet.jit.si/contratto-${roomId}`;
        const payload: any = {
            sender_id: user.id, receiver_id: activeThread.partnerId,
            content: `📹 Videochamada iniciada. Acesse: ${videoUrl}`,
            is_system_message: true,
            job_id: activeThread.jobId, order_id: activeThread.orderId
        };
        await supabase.from('messages').insert(payload);
        setMessages(prev => [...prev, { id: 'temp-' + Date.now(), ...payload, created_at: new Date().toISOString(), is_read: false }]);
        window.open(videoUrl, '_blank');
    };

    const handleSendProposal = async (proposalData: { description: string; totalValue: number; upfrontPercentage: number; estimatedDuration?: string; notes?: string }) => {
        if (!activeThread || !user) return;
        setSendingProposal(true);
        try {
            const payload: any = {
                sender_id: user.id, receiver_id: activeThread.partnerId,
                content: 'Enviei uma proposta para o seu projeto.',
                type: 'proposal',
                metadata: {
                    totalValue: proposalData.totalValue,
                    description: proposalData.description,
                    status: 'pending',
                    upfrontPercentage: proposalData.upfrontPercentage,
                    upfrontAmount: proposalData.totalValue * (proposalData.upfrontPercentage / 100),
                    estimatedDuration: proposalData.estimatedDuration || null,
                    notes: proposalData.notes || null,
                },
                job_id: activeThread.jobId, order_id: activeThread.orderId
            };
            await supabase.from('messages').insert(payload);
            setMessages(prev => [...prev, { id: 'temp-' + Date.now(), ...payload, created_at: new Date().toISOString(), is_read: false }]);
            addToast('Proposta enviada com sucesso!', 'success');
            setIsProposalModalOpen(false);
        } catch {
            addToast('Erro ao enviar proposta.', 'error');
        } finally {
            setSendingProposal(false);
        }
    };

    const handleSendQuoteProposal = () => {
        setIsProposalModalOpen(true);
    };

    const filteredThreads = threads.filter(t => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!t.partnerName.toLowerCase().includes(q) && !t.jobTitle.toLowerCase().includes(q)) return false;
        }
        if (activeTab === 'leads') return !!t.jobId && !t.orderId;
        return true;
    });

    const leadsCount = threads.filter(t => t.jobId && !t.orderId).length;

    return (
        <div className="w-full space-y-5">
            <Helmet><title>Mensagens | Dashboard CONTRATTO</title></Helmet>

            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <span>Dashboard</span><ChevronRight size={12} />
                    <span className="text-gray-600 font-medium">Mensagens</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Mensagens</h1>
            </motion.div>

            <div className="h-[calc(100vh-220px)] flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                {/* ── Coluna Esquerda: Inbox ── */}
                <div className={`${activeThread ? 'hidden md:flex' : 'flex'} w-full md:w-[280px] lg:w-[300px] shrink-0 border-r border-gray-100 flex-col`}>
                    {/* Search */}
                    <div className="p-3 border-b border-gray-100 bg-gray-50/50 space-y-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar conversa..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-400"
                            />
                        </div>
                        {/* Tabs */}
                        <div className="flex gap-1">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'all' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                            >Tudo</button>
                            <button
                                onClick={() => setActiveTab('leads')}
                                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === 'leads' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                Leads
                                {leadsCount > 0 && (
                                    <span className={`text-[10px] px-1.5 py-0 rounded-full font-bold ${activeTab === 'leads' ? 'bg-white/30 text-white' : 'bg-primary-100 text-primary-600'}`}>
                                        {leadsCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Thread list */}
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {loading
                            ? <div className="p-4 space-y-3"><LoadingSkeleton className="h-16 w-full" /><LoadingSkeleton className="h-16 w-full" /></div>
                            : filteredThreads.length === 0
                                ? <div className="p-8 text-center text-gray-400 text-sm">Nenhuma conversa.</div>
                                : filteredThreads.map(t => (
                                    <button
                                        key={t.threadId}
                                        onClick={() => setActiveThread(t)}
                                        className={`w-full p-3.5 flex gap-3 hover:bg-gray-50 text-left border-b border-gray-50 transition-colors ${activeThread?.threadId === t.threadId ? 'bg-primary-50 border-r-2 border-r-primary-500' : ''}`}
                                    >
                                        <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0 flex items-center justify-center font-bold text-gray-500 overflow-hidden">
                                            {t.partnerAvatar ? <img src={t.partnerAvatar} className="w-full h-full object-cover" alt="" /> : t.partnerName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <span className="font-semibold text-sm text-gray-900 truncate">{t.partnerName}</span>
                                                <span className="text-[10px] text-gray-400 ml-1 shrink-0">{new Date(t.lastMessageTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            <p className="text-[11px] text-primary-500 truncate font-medium">{t.jobTitle}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <p className="text-xs text-gray-400 truncate flex-grow">{t.lastMessage}</p>
                                                {t.unreadCount > 0 && (
                                                    <span className="shrink-0 bg-primary-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
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
                <div className={`${!activeThread ? 'hidden md:flex' : 'flex'} flex-col flex-grow min-w-0 bg-slate-50`}>
                    {activeThread ? (
                        <>
                            {/* Chat header */}
                            <div className="p-3.5 bg-white border-b border-gray-100 flex items-center gap-3 shadow-sm z-10">
                                <button onClick={() => setActiveThread(null)} className="md:hidden text-gray-500 p-1">
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                                    {activeThread.partnerAvatar
                                        ? <img src={activeThread.partnerAvatar} className="w-full h-full object-cover" alt="" />
                                        : activeThread.partnerName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-bold text-gray-800 truncate text-sm">{activeThread.partnerName}</h3>
                                    <p className="text-[10px] text-primary-500 uppercase font-bold truncate">{activeThread.jobTitle}</p>
                                </div>
                                <button onClick={handleVideoCall} title="Videochamada" className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors">
                                    <Video size={18} />
                                </button>
                            </div>

                            {/* Messages */}
                            <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {messages.map((msg) => {
                                    const isMe = msg.sender_id === user?.id;

                                    if (msg.is_system_message) {
                                        // Try to parse payment request payload
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
                                                            <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
                                                                <CreditCard size={14} className="text-emerald-600" />
                                                            </div>
                                                            <span className="font-bold text-sm text-gray-900">{paymentData.title}</span>
                                                        </div>
                                                        {paymentData.description && <p className="text-xs text-gray-500 mb-3">{paymentData.description}</p>}
                                                        <div className="space-y-1 text-xs bg-gray-50 rounded-xl p-3">
                                                            <div className="flex justify-between text-gray-600">
                                                                <span>Valor do serviço</span>
                                                                <span className="font-semibold">R$ {paymentData.amount.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-gray-400">
                                                                <span>Taxa Contratto (10%)</span>
                                                                <span>-R$ {paymentData.fee.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-emerald-600 font-bold border-t border-gray-200 pt-1 mt-1">
                                                                <span>Você recebe</span>
                                                                <span>R$ {paymentData.net.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 text-center mt-2">
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={msg.id} className="flex justify-center my-2">
                                                <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-full text-center max-w-xs">
                                                    {msg.content}
                                                </div>
                                            </div>
                                        );
                                    }

                                    const isQuoteRequest = msg.type === 'quote_request' && msg.metadata;
                                    const isProposal = msg.type === 'proposal' && msg.metadata;

                                    if (isQuoteRequest) {
                                        return (
                                            <div key={msg.id} className="flex justify-start my-4">
                                                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 w-full max-w-lg">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                                                            <MessagesSquare size={16} className="text-primary-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 text-sm">Briefing Recebido</h4>
                                                            <p className="text-[10px] text-gray-500">O cliente respondeu ao questionário</p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {/* responses pode ser array [{question,answer}] ou objeto {pergunta: resposta} */}
                                                        {Array.isArray(msg.metadata.responses)
                                                            ? msg.metadata.responses.map((resp: any, i: number) => (
                                                                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                                    <p className="text-xs font-bold text-gray-700 mb-1">{resp.question}</p>
                                                                    <p className="text-sm text-gray-900">{resp.answer}</p>
                                                                </div>
                                                            ))
                                                            : msg.metadata.responses && Object.keys(msg.metadata.responses).length > 0
                                                                ? Object.entries(msg.metadata.responses).map(([q, a], i) => (
                                                                    <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                                        <p className="text-xs font-bold text-gray-700 mb-1">{q}</p>
                                                                        <p className="text-sm text-gray-900">{a as string}</p>
                                                                    </div>
                                                                ))
                                                                : null
                                                        }
                                                        {msg.metadata.notes && (
                                                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                                <p className="text-xs font-bold text-gray-700 mb-1">Observações adicionais</p>
                                                                <p className="text-sm text-gray-900 whitespace-pre-wrap">{msg.metadata.notes}</p>
                                                            </div>
                                                        )}
                                                        {msg.metadata.budgetExpectation && (
                                                            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                                                <p className="text-xs font-bold text-emerald-800 mb-1">Expectativa de orçamento</p>
                                                                <p className="text-sm text-emerald-900 font-medium">{msg.metadata.budgetExpectation}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-3">
                                                        <p className="text-[10px] text-gray-400">
                                                            Recebido às {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        <Button size="sm" onClick={handleSendQuoteProposal}>Responder com Proposta</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[82%] px-4 py-3 rounded-2xl shadow-sm text-sm break-words ${isMe ? 'bg-primary-500 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                                                {msg.file_url && (
                                                    msg.file_type === 'image'
                                                        ? <img src={msg.file_url} className="max-w-xs rounded-lg cursor-pointer max-h-48 object-cover mb-2" onClick={() => window.open(msg.file_url || '', '_blank')} alt="anexo" />
                                                        : <a href={msg.file_url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 underline mb-2 ${isMe ? 'text-blue-100' : 'text-primary-500'}`}>Ver Anexo</a>
                                                )}

                                                {msg.order_proposals && (
                                                    <ProposalCard
                                                        proposal={msg.order_proposals}
                                                        isMe={isMe}
                                                        onStatusChange={() => fetchMessages(activeThread.threadId, !!activeThread.jobId)}
                                                    />
                                                )}

                                                {!msg.order_proposals && isProposal ? (
                                                    <div className={`rounded-xl overflow-hidden mt-1 mb-2 border ${isMe ? 'border-primary-400 bg-primary-600' : 'border-gray-200 bg-white shadow-sm'}`}>
                                                        <div className={`p-3 font-bold flex items-center gap-2 border-b ${isMe ? 'border-primary-400/50 text-white' : 'border-gray-100 text-gray-900'}`}>
                                                            <FileText size={18} /> Proposta de Serviço
                                                        </div>
                                                        <div className={`p-3 space-y-3 ${isMe ? 'text-primary-100' : 'text-gray-600'}`}>
                                                            <p className="whitespace-pre-wrap text-[13px]">{msg.metadata.description}</p>
                                                            
                                                            <div className={`p-3 rounded-lg flex flex-col gap-1 ${isMe ? 'bg-primary-700/50 text-white' : 'bg-gray-50 text-gray-800'}`}>
                                                                <div className="flex items-center justify-between font-bold">
                                                                    <span>Valor Total Cobrado:</span>
                                                                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(msg.metadata.totalValue)}</span>
                                                                </div>
                                                                {isMe && (
                                                                    <div className="text-[11px] text-primary-200 flex justify-between">
                                                                        <span>Taxas (TGT + Stripe):</span>
                                                                        <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((msg.metadata.platformFee || 0) + (msg.metadata.stripeFee || 0))}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className={`p-2 rounded mt-2 text-xs font-semibold flex justify-between items-center ${isMe ? 'bg-black/10' : 'bg-primary-50 text-primary-600'}`}>
                                                                <span>Sinal Antecipado ({msg.metadata.upfrontPercentage}%):</span>
                                                                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(msg.metadata.upfrontAmount)}</span>
                                                            </div>
                                                            
                                                            <div className="flex items-center justify-center pt-2">
                                                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                    msg.metadata.status === 'accepted' ? 'bg-emerald-500 text-white' :
                                                                    msg.metadata.status === 'rejected' ? 'bg-red-500 text-white' :
                                                                    'bg-amber-400 text-white'
                                                                }`}>
                                                                    {msg.metadata.status === 'accepted' ? 'Aceita' : msg.metadata.status === 'rejected' ? 'Recusada' : 'Aguardando Avaliação'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : !msg.order_proposals && (
                                                    <span>{msg.content}</span>
                                                )}
                                                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Message input */}
                            <div className="p-3.5 bg-white border-t border-gray-100">
                                {showQuickReplies && (
                                    <div className="mb-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                        {QUICK_REPLIES.map(r => (
                                            <button key={r} onClick={() => { setNewMessage(r); setShowQuickReplies(false); }} className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b last:border-0">
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                                    <button type="button" onClick={() => setShowQuickReplies(!showQuickReplies)} className={`p-2 rounded-lg ${showQuickReplies ? 'bg-primary-50 text-primary-500' : 'text-gray-400 hover:text-gray-600'}`}>
                                        <Zap size={18} />
                                    </button>
                                    <label className="cursor-pointer p-2 text-gray-400 hover:text-gray-600">
                                        <Paperclip size={18} />
                                        <input type="file" className="hidden" onChange={handleAttachment} disabled={uploadingFile} />
                                    </label>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder="Digite sua mensagem..."
                                        className="flex-grow p-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                                    />
                                    <Button variant="primary" size="sm" type="submit">Enviar</Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-gray-400">
                            <MessagesSquare size={48} className="opacity-20 mb-3" />
                            <p className="text-sm font-medium">Selecione uma conversa</p>
                        </div>
                    )}
                </div>

                {/* ── Coluna Direita: Painel de Ações ── */}
                {activeThread && (
                    <div className="hidden lg:flex w-[280px] shrink-0 flex-col bg-white border-l border-gray-100 overflow-y-auto">
                        <InfoPanel
                            thread={activeThread}
                            onVideoCall={handleVideoCall}
                            onRequestPayment={() => setIsProposalModalOpen(true)}
                        />
                    </div>
                )}
            </div>

            {/* ── Proposal Modal ── */}
            <ProposalModal
                isOpen={isProposalModalOpen}
                onClose={() => setIsProposalModalOpen(false)}
                onSubmit={handleSendProposal}
                isProCompany={true}
                isSending={sendingProposal}
            />
        </div>
    );
};

// ─── Proposal Card ─────────────────────────────────────────────────────────────

const ProposalCard: React.FC<{
    proposal: OrderProposal;
    isMe: boolean;
    onStatusChange: () => void;
}> = ({ proposal, isMe, onStatusChange }) => {
    const feeAmount = proposal.amount * PLATFORM_FEE;
    const netAmount = proposal.amount - feeAmount;

    return (
        <div className={`p-3 rounded-xl mb-2 border ${isMe ? 'bg-primary-600 border-primary-400' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className={`font-bold text-lg ${isMe ? 'text-white' : 'text-gray-900'}`}>
                    R$ {proposal.amount.toFixed(2)}
                </span>
                <Badge className={
                    proposal.status === 'accepted' ? 'bg-emerald-500 text-white border-0 text-[10px]' :
                    proposal.status === 'rejected' ? 'bg-red-500 text-white border-0 text-[10px]' :
                    'bg-amber-400 text-white border-0 text-[10px]'
                }>
                    {proposal.status === 'accepted' ? 'Aceita' : proposal.status === 'rejected' ? 'Recusada' : 'Aguardando'}
                </Badge>
            </div>

            {/* Fee breakdown */}
            <div className={`text-[11px] space-y-0.5 mb-2 rounded-lg p-2 ${isMe ? 'bg-primary-700/50' : 'bg-gray-50'}`}>
                <div className={`flex justify-between ${isMe ? 'text-primary-200' : 'text-gray-500'}`}>
                    <span>Taxa Contratto (10%)</span>
                    <span>-R$ {feeAmount.toFixed(2)}</span>
                </div>
                <div className={`flex justify-between font-bold ${isMe ? 'text-emerald-300' : 'text-emerald-600'}`}>
                    <span>Você recebe</span>
                    <span>R$ {netAmount.toFixed(2)}</span>
                </div>
            </div>

            {proposal.estimated_duration && (
                <p className={`text-xs mb-1 ${isMe ? 'text-primary-200' : 'text-gray-500'}`}>
                    <Clock size={10} className="inline mr-1" />{proposal.estimated_duration}
                </p>
            )}
            {proposal.notes && (
                <p className={`text-xs italic ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>"{proposal.notes}"</p>
            )}
        </div>
    );
};

// ─── Info Panel (Coluna Direita) ────────────────────────────────────────────────

const InfoPanel: React.FC<{
    thread: Thread;
    onVideoCall: () => void;
    onRequestPayment: () => void;
}> = ({ thread, onVideoCall, onRequestPayment }) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [order, setOrder] = useState<any>(null);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

    const fetchOrder = useCallback(async () => {
        if (!thread.orderId) return;
        setLoadingOrder(true);
        const { data } = await supabase.from('orders').select('*, services:service_id(requires_quote, title)').eq('id', thread.orderId).single();
        if (data) setOrder(data);
        setLoadingOrder(false);
    }, [thread.orderId]);

    useEffect(() => {
        setOrder(null);
        fetchOrder();
        if (!thread.orderId) return;
        const ch = supabase.channel(`ow2_${thread.orderId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${thread.orderId}` }, fetchOrder)
            .subscribe();
        return () => { ch.unsubscribe(); };
    }, [thread.orderId, fetchOrder]);

    const isJobThread = !!thread.jobId && !thread.orderId;

    return (
        <div className="flex flex-col h-full">
            {/* Partner profile */}
            <div className="p-5 border-b border-gray-100 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full mx-auto flex items-center justify-center font-bold text-primary-600 text-xl overflow-hidden mb-3">
                    {thread.partnerAvatar
                        ? <img src={thread.partnerAvatar} className="w-full h-full object-cover" alt="" />
                        : thread.partnerName.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{thread.partnerName}</h3>
                <p className="text-xs text-primary-500 font-medium mt-0.5 truncate px-2">{thread.jobTitle}</p>
                <div className="mt-2">
                    {isJobThread
                        ? <span className="inline-block text-[10px] bg-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-full">Lead / Consulta</span>
                        : <span className="inline-block text-[10px] bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full">Projeto Ativo</span>
                    }
                </div>
            </div>

            {/* Quick actions */}
            <div className="p-4 border-b border-gray-100 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ações Rápidas</p>
                <button
                    onClick={onRequestPayment}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-sm font-medium text-gray-700 hover:text-primary-700 transition-all"
                >
                    <CreditCard size={16} className="text-primary-500 shrink-0" />
                    Solicitar Pagamento
                </button>
                <button
                    onClick={onVideoCall}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 text-sm font-medium text-gray-700 hover:text-violet-700 transition-all"
                >
                    <Video size={16} className="text-violet-500 shrink-0" />
                    Iniciar Videochamada
                </button>
            </div>

            {/* Order management (order threads only) */}
            {thread.orderId && (
                <div className="p-4 flex-grow overflow-y-auto">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Gestão do Pedido</p>

                    {loadingOrder
                        ? <LoadingSkeleton className="h-20 w-full" />
                        : order && (
                            <div className="space-y-2">
                                <h4 className="font-bold text-sm text-gray-900 leading-tight">{order.service_title}</h4>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="secondary" className="bg-transparent border border-gray-200 text-gray-600 text-[9px] h-4 py-0">{order.package_tier}</Badge>
                                    {order.price
                                        ? <span className="text-sm font-bold text-primary-600">R$ {order.price}</span>
                                        : <span className="text-sm font-bold text-amber-500">A Orçar</span>
                                    }
                                </div>
                                <div className="flex gap-1.5">
                                    {order.status === 'active' && <Badge className="bg-blue-600 text-white text-[9px]">Ativo</Badge>}
                                    {order.status === 'delivered' && <Badge className="bg-amber-500 text-white text-[9px]">Entregue</Badge>}
                                    {order.status === 'completed' && <Badge className="bg-emerald-600 text-white text-[9px]">Concluído</Badge>}
                                </div>

                                <div className="pt-2 border-t space-y-2">
                                    {order.saga_status === 'WAITING_ACCEPTANCE' && !order.price && order.services?.requires_quote && (
                                        <Button size="sm" className="w-full text-xs" onClick={onRequestPayment}>
                                            Enviar Proposta de Orçamento
                                        </Button>
                                    )}
                                    {order.saga_status === 'WAITING_ACCEPTANCE' && !order.services?.requires_quote && (
                                        <Button size="sm" className="w-full text-xs" onClick={async () => {
                                            await supabase.rpc('transition_saga_status', { p_order_id: thread.orderId, p_new_status: 'ORDER_ACTIVE' });
                                            addToast("Pedido aceito!", "success");
                                            fetchOrder();
                                        }}>Aceitar Pedido</Button>
                                    )}
                                    {(order.status === 'active' || order.status === 'in_progress') && order.saga_status === 'ORDER_ACTIVE' && (
                                        <Button size="sm" className="w-full text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsDeliveryModalOpen(true)}>
                                            {order.status === 'in_progress' ? 'Enviar Nova Versão' : 'Entregar Trabalho'}
                                        </Button>
                                    )}
                                    {['active', 'in_progress', 'delivered'].includes(order.status) && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full bg-white text-red-500 hover:bg-red-50 border border-red-200 text-xs"
                                            onClick={async () => {
                                                if (!confirm("Isso cancelará o pedido e estornará o valor ao comprador. Confirma?")) return;
                                                const { data, error } = await supabase.functions.invoke('process-refund', { body: { order_id: order.id, reason: 'requested_by_customer' } });
                                                if (error || data?.error) {
                                                    addToast("Erro ao estornar.", "error");
                                                } else {
                                                    addToast("Pedido estornado com sucesso.", "success");
                                                    fetchOrder();
                                                }
                                            }}
                                        >Cancelar e Estornar</Button>
                                    )}
                                </div>

                                <div className="pt-3 border-t text-[9px] text-gray-400 flex items-center gap-1.5">
                                    <Clock size={10} /> Criado em {new Date(order.created_at).toLocaleDateString()}
                                </div>

                                {isDeliveryModalOpen && (
                                    <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><LoadingSpinner /></div>}>
                                        <DeliveryModal
                                            orderId={order.id}
                                            isOpen={isDeliveryModalOpen}
                                            onClose={() => setIsDeliveryModalOpen(false)}
                                            onSuccess={fetchOrder}
                                        />
                                    </Suspense>
                                )}
                            </div>
                        )
                    }
                </div>
            )}
        </div>
    );
};

export default DashboardMensagensPage;
