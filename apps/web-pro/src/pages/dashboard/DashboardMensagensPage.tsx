import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@tgt/shared';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { LoadingSpinner } from '@tgt/shared';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import { ChevronRight, MessageSquare, Paperclip, Zap, ArrowLeft, Clock, MessagesSquare } from 'lucide-react';

const DeliveryModal = lazy(() => import('@/components/orders/DeliveryModal'));

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
    read_at?: string | null;
    job_id?: string;
    order_id?: string;
    // Relationships for UI render
    order_proposals?: OrderProposal | null;
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
    const navigate = useNavigate();

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
            const { data, error } = await supabase.rpc('get_chat_threads', {
                p_user_id: user.id
            });

            if (error) throw error;

            const mappedThreads: Thread[] = (data || []).map((t: any) => ({
                threadId: t.thread_id,
                jobId: t.job_id,
                orderId: t.order_id,
                jobTitle: t.job_title,
                partnerId: t.partner_id,
                partnerName: t.partner_name,
                partnerAvatar: t.partner_avatar,
                lastMessage: t.last_message_content,
                lastMessageTime: t.last_message_time,
                unreadCount: Number(t.unread_count)
            }));

            setThreads(mappedThreads);
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
            .select(`
                *,
                order_proposals (
                    id,
                    amount,
                    status,
                    estimated_duration,
                    notes
                )
            `)
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
                .channel(`chat_thread_pro:${activeThread.threadId}`)
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

    const handleAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeThread || !user) return;
        try {
            setUploadingFile(true);
            const path = `messages/${activeThread.threadId}/${Date.now()}-${file.name}`;
            await supabase.storage.from('attachments').upload(path, file);
            const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(path);
            const msgType = file.type.startsWith('image/') ? 'image' : 'file';

            const insertPayload: any = {
                sender_id: user.id,
                receiver_id: activeThread.partnerId,
                content: msgType === 'image' ? '🖼️ Imagem anexada' : '📄 Arquivo anexado',
                file_url: publicUrl,
                file_type: msgType,
                job_id: activeThread.jobId,
                order_id: activeThread.orderId
            };

            await supabase.from('messages').insert(insertPayload);
            setMessages(prev => [...prev, {
                id: 'temp-' + Date.now(),
                ...insertPayload,
                created_at: new Date().toISOString(),
                read_at: null
            }]);
        } catch (err) {
            console.error('Attachment error:', err);
        } finally {
            setUploadingFile(false);
            e.target.value = '';
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
            <Helmet>
                <title>Mensagens | Dashboard CONTRATTO</title>
            </Helmet>

            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <span>Dashboard</span><ChevronRight size={12} />
                    <span className="text-gray-600 font-medium">Mensagens</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Mensagens</h1>
            </motion.div>

            <div className="h-[calc(100vh-240px)] flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Sidebar */}
                <div className={`${activeThread ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-gray-100 flex-col`}>
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-bold text-sm">Conversas</div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {loading ? <div className="p-4"><LoadingSkeleton className="h-16 w-full" /></div> :
                            threads.length === 0 ? <div className="p-8 text-center text-gray-400 text-sm">Nenhuma conversa.</div> :
                                threads.map(t => (
                                    <button key={t.threadId} onClick={() => setActiveThread(t)} className={`w-full p-4 flex gap-3 hover:bg-gray-50 text-left border-b border-gray-50 ${activeThread?.threadId === t.threadId ? 'bg-primary-50 border-r-4 border-primary-500' : ''}`}>
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-gray-500 overflow-hidden">
                                            {t.partnerAvatar ? <img src={t.partnerAvatar} className="w-full h-full object-cover" /> : t.partnerName.charAt(0)}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="font-semibold text-gray-900 truncate">{t.partnerName}</span>
                                                <span className="text-[10px] text-gray-400">{new Date(t.lastMessageTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            <p className="text-xs text-primary-500 truncate">{t.jobTitle}</p>
                                            <p className="text-sm text-gray-500 truncate mt-1">{t.lastMessage}</p>
                                        </div>
                                    </button>
                                ))
                        }
                    </div>
                </div>

                {/* Chat & Widget */}
                <div className={`${!activeThread ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-row relative`}>
                    <div className="flex flex-col flex-grow bg-slate-50 relative border-r border-gray-100 min-w-0">
                        {activeThread ? (
                            <>
                                <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3 shadow-sm z-10">
                                    <button onClick={() => setActiveThread(null)} className="md:hidden text-gray-500"><ArrowLeft size={18} /></button>
                                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                                        {activeThread.partnerAvatar ? <img src={activeThread.partnerAvatar} className="w-full h-full object-cover" /> : activeThread.partnerName.charAt(0)}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <h3 className="font-bold text-gray-800 truncate">{activeThread.partnerName}</h3>
                                        <p className="text-[10px] text-primary-500 uppercase font-bold">{activeThread.jobTitle}</p>
                                    </div>
                                </div>

                                <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                    {messages.map((msg) => {
                                        const isMe = msg.sender_id === user?.id;
                                        
                                        if (msg.is_system_message) {
                                            return (
                                                <div key={msg.id} className="flex justify-center my-2">
                                                    <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full text-center">
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            )
                                        }

                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm text-sm break-words ${isMe ? 'bg-primary-500 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                                                    {msg.file_url ? (
                                                        msg.file_type === 'image' ? (
                                                           <img src={msg.file_url} className="max-w-xs rounded-lg cursor-pointer max-h-48 object-cover mb-2" onClick={() => window.open(msg.file_url || '', '_blank')} /> 
                                                        ) : (
                                                            <a href={msg.file_url} target="_blank" className={`flex items-center gap-2 underline mb-2 ${isMe ? 'text-blue-100' : 'text-primary-500'}`}>Ver Anexo</a>
                                                        )
                                                    ) : null}
                                                    
                                                    {msg.order_proposals ? (
                                                        <div className={`p-3 rounded-lg mb-2 border ${isMe ? 'bg-primary-600 border-primary-400' : 'bg-green-50 border-green-200'}`}>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-bold text-lg">R$ {msg.order_proposals.amount?.toFixed(2)}</span>
                                                                <Badge className={
                                                                    msg.order_proposals.status === 'accepted' ? 'bg-green-500 text-white border-0' :
                                                                    msg.order_proposals.status === 'rejected' ? 'bg-red-500 text-white border-0' :
                                                                    'bg-gray-100/20 px-1 border-0'
                                                                }>
                                                                    {msg.order_proposals.status === 'accepted' ? 'Aceita' :
                                                                     msg.order_proposals.status === 'rejected' ? 'Recusada' : 'Aguardando'}
                                                                </Badge>
                                                            </div>
                                                            {msg.order_proposals.estimated_duration && <p className="text-xs opacity-90"><Clock size={10} className="inline mr-1"/>{msg.order_proposals.estimated_duration}</p>}
                                                            {msg.order_proposals.notes && <p className="text-xs opacity-90 italic mt-1">"{msg.order_proposals.notes}"</p>}
                                                        </div>
                                                    ) : null}

                                                    <span>{msg.content}</span>
                                                    <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="p-4 bg-white border-t border-gray-100">
                                    {showQuickReplies && (
                                        <div className="mb-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                            {QUICK_REPLIES.map(r => <button key={r} onClick={() => { setNewMessage(r); setShowQuickReplies(false); }} className="block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b last:border-0">{r}</button>)}
                                        </div>
                                    )}
                                    <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                                        <button type="button" onClick={() => setShowQuickReplies(!showQuickReplies)} className={`p-2 rounded-lg ${showQuickReplies ? 'bg-primary-50 text-primary-500' : 'text-gray-400'}`}><Zap size={18} /></button>
                                        <label className="cursor-pointer p-2 text-gray-400"><Paperclip size={18} /><input type="file" className="hidden" onChange={handleAttachment} /></label>
                                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." className="flex-grow p-2.5 bg-gray-50 border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm" />
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

                    {/* Order Widget */}
                    {activeThread?.orderId && (
                        <div className="hidden lg:flex w-72 flex-col bg-white shrink-0">
                            <OrderSummaryWidget 
                                orderId={activeThread.orderId} 
                                threadId={activeThread.threadId}
                                partnerId={activeThread.partnerId}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const OrderSummaryWidget: React.FC<{ orderId: string; threadId: string; partnerId: string }> = ({ orderId, threadId, partnerId }) => {
    const { user } = useAuth();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    
    // Budget State
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [budgetAmount, setBudgetAmount] = useState('');
    const [budgetDuration, setBudgetDuration] = useState('');
    const [budgetNotes, setBudgetNotes] = useState('');
    const [sendingBudget, setSendingBudget] = useState(false);
    
    const { addToast } = useToast();

    const fetchOrder = useCallback(async () => {
        const { data } = await supabase.from('orders').select('*, services:service_id(price_type, title)').eq('id', orderId).single();
        if (data) setOrder(data);
        setLoading(false);
    }, [orderId]);

    useEffect(() => {
        fetchOrder();
        const ch = supabase.channel(`ow_${orderId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, fetchOrder).subscribe();
        return () => { ch.unsubscribe(); };
    }, [orderId, fetchOrder]);

    const handleSendBudget = async () => {
        if (!order || !user) return;
        const numericPrice = parseFloat(budgetAmount.replace(',', '.'));
        if (isNaN(numericPrice) || numericPrice <= 0) {
            addToast('Digite um valor válido.', 'error');
            return;
        }
        setSendingBudget(true);
        try {
            // 1. Create formal proposal
            const { data: proposalData, error: proposalError } = await supabase
                .from('order_proposals')
                .insert({
                    order_id: order.id,
                    company_id: order.seller_id,
                    amount: numericPrice,
                    estimated_duration: budgetDuration.trim() || null,
                    notes: budgetNotes.trim() || null,
                    status: 'pending'
                })
                .select('id')
                .single();
            if (proposalError) throw proposalError;

            // 2. Update order total price
            const { error: orderError } = await supabase
                .from('orders')
                .update({ price: numericPrice })
                .eq('id', order.id);
            if (orderError) throw orderError;

            // 3. Send message linking to proposal
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    order_id: order.id,
                    sender_id: user.id,
                    receiver_id: partnerId,
                    content: `Orçamento de R$ ${numericPrice.toFixed(2)} enviado.`,
                    proposal_id: proposalData.id
                });
            if (msgError) throw msgError;

            addToast(`Orçamento de R$ ${numericPrice.toFixed(2)} foi enviado.`, 'success');
            setIsBudgetModalOpen(false);
            setBudgetAmount('');
            setBudgetDuration('');
            setBudgetNotes('');
            fetchOrder();
        } catch (e: any) {
            console.error('Erro ao enviar orçamento:', e);
            addToast(`Falha ao enviar orçamento.`, 'error');
        } finally {
            setSendingBudget(false);
        }
    };

    if (loading) return <div className="p-6 space-y-4"><LoadingSkeleton className="h-20 w-full" /></div>;
    if (!order) return null;

    const isBudgetOrder = order.services?.price_type === 'budget';

    return (
        <div className="p-6 space-y-6">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Gestão de Pedido</h3>
            <div className="space-y-3">
                <h4 className="font-bold text-sm text-gray-900 leading-tight">{order.service_title}</h4>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-transparent border border-gray-200 text-gray-600 text-[9px] h-4 py-0">{order.package_tier}</Badge>
                    {(order.price || !isBudgetOrder) && (
                        <span className="text-sm font-bold text-primary-600">R$ {order.price}</span>
                    )}
                    {(isBudgetOrder && !order.price) && (
                        <span className="text-sm font-bold text-amber-500">A Orçar</span>
                    )}
                </div>
                <div className="flex gap-1.5 pt-1">
                    {order.status === 'active' && <Badge className="bg-blue-600 text-white text-[9px]">Ativo</Badge>}
                    {order.status === 'delivered' && <Badge className="bg-amber-500 text-white text-[9px]">Entregue</Badge>}
                    {order.status === 'completed' && <Badge className="bg-emerald-600 text-white text-[9px]">Concluído</Badge>}
                </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
                 {/* Budget Handling for Professional */}
                 {isBudgetOrder && !order.price && order.saga_status === 'WAITING_ACCEPTANCE' && (
                    <Button size="sm" className="w-full text-xs" onClick={() => setIsBudgetModalOpen(true)}>
                        Enviar Proposta de Orçamento
                    </Button>
                 )}

                {/* Normal Service Handling for Professional */}
                {!isBudgetOrder && order.saga_status === 'WAITING_ACCEPTANCE' && (
                    <Button size="sm" className="w-full text-xs" onClick={async () => {
                        await supabase.rpc('transition_saga_status', { p_order_id: orderId, p_new_status: 'ORDER_ACTIVE' });
                        addToast("Pedido aceito!", "success");
                    }}>Aceitar Pedido</Button>
                )}

                {(order.status === 'active' || order.status === 'in_progress') && order.saga_status === 'ORDER_ACTIVE' && (
                    <>
                        <Button size="sm" className="w-full text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsDeliveryModalOpen(true)}>
                            {order.status === 'in_progress' ? 'Enviar Nova Versão' : 'Entregar Trabalho'}
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                            <Button size="sm" variant="secondary" className="text-[10px] h-8 bg-gray-100">Formulário</Button>
                            <Button size="sm" variant="secondary" className="text-[10px] h-8 bg-gray-100">Documento</Button>
                        </div>
                    </>
                )}

                {(order.status === 'active' || order.status === 'in_progress' || order.status === 'delivered') && (
                    <Button
                        variant="secondary"
                        className="w-full bg-white text-red-500 hover:bg-red-50 border border-red-200 text-xs mt-2"
                        onClick={async () => {
                            if (confirm("Tem certeza? Esta ação cancelará o pedido e estornará o valor integralmente para o comprador. O dinheiro sairá de sua carteira pendente.")) {
                                try {
                                    const { data, error } = await supabase.functions.invoke('process-refund', {
                                        body: { order_id: order.id, reason: 'requested_by_customer' }
                                    });
                                    if (error) throw error;
                                    if (data?.error) throw new Error(data.error);
                                    addToast("Pedido estornado com sucesso.", "success");
                                    fetchOrder();
                                } catch (err: any) {
                                    addToast("Erro ao estornar: " + err.message, "error");
                                }
                            }
                        }}
                    >
                        Cancelar e Estornar Cliente
                    </Button>
                )}
            </div>
            <div className="pt-4 border-t text-[9px] text-gray-400 flex items-center gap-1.5"><Clock size={10} /> Criado em {new Date(order.created_at).toLocaleDateString()}</div>

            {isDeliveryModalOpen && (
                <Suspense fallback={
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <LoadingSpinner />
                    </div>
                }>
                    <DeliveryModal
                        orderId={order.id}
                        isOpen={isDeliveryModalOpen}
                        onClose={() => setIsDeliveryModalOpen(false)}
                        onSuccess={fetchOrder}
                    />
                </Suspense>
            )}

            {/* Budget Modal */}
            {isBudgetModalOpen && (
               <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                   <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Enviar Orçamento</h2>
                            <p className="text-sm text-gray-500 mb-6">Preencha os dados da proposta que será enviada para o cliente. Se aceito, o pedido será confirmado.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor Final (R$)</label>
                                    <input 
                                        type="number" 
                                        placeholder="Ex: 500.00" 
                                        className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                                        value={budgetAmount}
                                        onChange={(e) => setBudgetAmount(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração Estimada</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: 3 dias úteis" 
                                        className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                                        value={budgetDuration}
                                        onChange={(e) => setBudgetDuration(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações da Proposta (Opcional)</label>
                                    <textarea 
                                        placeholder="Detalhes sobre o que está incluído..." 
                                        className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                                        value={budgetNotes}
                                        onChange={(e) => setBudgetNotes(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <Button variant="secondary" className="flex-1" onClick={() => setIsBudgetModalOpen(false)}>Cancelar</Button>
                                <Button 
                                    className="flex-1" 
                                    isLoading={sendingBudget} 
                                    onClick={handleSendBudget}
                                >
                                    Enviar Proposta
                                </Button>
                            </div>
                        </div>
                   </div>
               </div> 
            )}
        </div>
    );
};

export default DashboardMensagensPage;
