import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { MessageSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { useNavigate } from 'react-router-dom';

interface Thread {
    threadId: string;
    partnerName: string;
    partnerAvatar?: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
}

const MessagesDropdown: React.FC = () => {
    const { user } = useAuth();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useOnClickOutside(dropdownRef, () => setIsOpen(false));

    const fetchThreads = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase.rpc('get_chat_threads', { p_user_id: user.id });
            if (error) throw error;
            const mapped: Thread[] = (data || []).map((t: any) => ({
                threadId: t.thread_id,
                partnerName: t.partner_name,
                partnerAvatar: t.partner_avatar,
                lastMessage: t.last_message_content,
                lastMessageTime: t.last_message_time,
                unreadCount: Number(t.unread_count),
            }));
            setThreads(mapped);
        } catch (err) {
            console.error('[MessagesDropdown] Error fetching threads:', err);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchThreads();
            const sub = supabase.channel('header_messages_sync')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, () => {
                    fetchThreads();
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, () => {
                    fetchThreads(); // Atualiza se as mensagens forem marcadas como lidas
                })
                .subscribe();
            return () => { sub.unsubscribe(); };
        }
    }, [user, fetchThreads]);

    const handleThreadClick = () => {
        // Redirecionamento simplificado – Vai para a tela de mensagens que já sabe qual chat abrir ou exibe todos.
        if (user?.type === 'company' || user?.type === 'professional') {
            navigate('/painel/mensagens');
        } else {
            navigate('/minhas-mensagens');
        }
        setIsOpen(false);
    };

    const handleViewAll = () => {
        if (user?.type === 'company' || user?.type === 'professional') {
            navigate('/painel/mensagens');
        } else {
            navigate('/minhas-mensagens');
        }
        setIsOpen(false);
    };

    const totalUnread = threads.reduce((acc, t) => acc + t.unreadCount, 0);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchThreads(); }}
                className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-brand-primary transition-colors focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Mensagens"
            >
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                {totalUnread > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand-primary border-2 border-white rounded-full"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl ring-1 ring-black/5 py-2 z-50 overflow-hidden"
                        style={{ marginTop: '0.5rem' }}
                    >
                        <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-sm font-semibold text-gray-900">Mensagens</h3>
                            <button
                                onClick={handleViewAll}
                                className="text-xs text-brand-primary hover:text-brand-primary/80 font-medium"
                            >
                                Ver todas
                            </button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto">
                            {threads.length === 0 ? (
                                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                    Nenhuma mensagem por enquanto.
                                </div>
                            ) : (
                                <ul>
                                    {threads.slice(0, 5).map((thread) => (
                                        <li key={thread.threadId}>
                                            <button
                                                onClick={() => handleThreadClick()}
                                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3 border-b border-gray-50 last:border-0 ${thread.unreadCount > 0 ? 'bg-blue-50/30' : ''}`}
                                            >
                                                <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center font-bold text-gray-500 shadow-sm border border-gray-200">
                                                    {thread.partnerAvatar ? (
                                                        <img src={thread.partnerAvatar} alt={thread.partnerName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        thread.partnerName.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <p className={`text-sm truncate ${thread.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                                                            {thread.partnerName}
                                                        </p>
                                                        <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
                                                            {new Date(thread.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs truncate ${thread.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                                        {thread.lastMessage}
                                                    </p>
                                                </div>
                                                {thread.unreadCount > 0 && (
                                                    <div className="flex-shrink-0 flex items-center justify-center mt-2">
                                                        <span className="w-4 h-4 rounded-full bg-brand-primary text-white text-[9px] font-bold flex items-center justify-center">
                                                            {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                                                        </span>
                                                    </div>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MessagesDropdown;
