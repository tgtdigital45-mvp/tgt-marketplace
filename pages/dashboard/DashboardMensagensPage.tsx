import React, { useState, useEffect, useRef } from 'react';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    read: boolean;
}

interface Conversation {
    id: string; // The other user's ID
    name: string;
    email: string;
    avatar: string;
    lastMessage: string;
    unreadCount: number;
}

const DashboardMensagensPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Load Conversations (Group by sender)
    // In a real app we might have a 'conversations' table, but grouping messages works for MVP
    useEffect(() => {
        if (!user) return;

        const fetchConversations = async () => {
            setLoading(true);
            // Fetch all messages where I am the sender OR receiver
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching messages", error);
                return;
            }

            const convMap = new Map<string, Conversation>();

            // Process messages to build conversation list
            // We need to fetch user names if not stored. For MVP, we'll try to get from metadata or placeholder.
            // A better approach is to expand/join with profiles table.

            // To properly get names, we should ideally join with 'profiles'. 
            // supabase-js supports this via: .select('*, sender:sender_id(full_name), receiver:receiver_id(full_name)')
            // But let's keep it simple first or fetch profiles simply.

            for (const msg of data || []) {
                const isMe = msg.sender_id === user.id;
                const otherId = isMe ? msg.receiver_id : msg.sender_id;

                if (!convMap.has(otherId)) {
                    convMap.set(otherId, {
                        id: otherId,
                        name: 'Usuário ' + otherId.slice(0, 4), // Placeholder until we fetch profile
                        email: '',
                        avatar: `https://ui-avatars.com/api/?name=${otherId}&background=random`,
                        lastMessage: msg.content,
                        unreadCount: (!isMe && !msg.read) ? 1 : 0
                    });
                } else {
                    const conv = convMap.get(otherId)!;
                    if (!isMe && !msg.read) {
                        conv.unreadCount++;
                    }
                }
            }
            setConversations(Array.from(convMap.values()));
            setLoading(false);
        };

        fetchConversations();

        // Subscribe to NEW messages to update conversation list live
        const channel = supabase
            .channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMessage = payload.new as Message;
                if (newMessage.sender_id === user.id || newMessage.receiver_id === user.id) {
                    fetchConversations(); // Re-fetch to update order/unread
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user]);


    // 2. Load Messages for Selected Conversation
    useEffect(() => {
        if (!selectedConvId || !user) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedConvId}),and(sender_id.eq.${selectedConvId},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: true });

            if (error) console.error(error);
            else setMessages(data || []);

            // Mark as read
            await supabase
                .from('messages')
                .update({ read: true })
                .eq('sender_id', selectedConvId)
                .eq('receiver_id', user.id)
                .eq('read', false);
        };

        fetchMessages();

        // Subscribe to real-time messages for this chat
        const channel = supabase
            .channel(`chat:${selectedConvId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMsg = payload.new as Message;
                if (
                    (newMsg.sender_id === selectedConvId && newMsg.receiver_id === user.id) ||
                    (newMsg.sender_id === user.id && newMsg.receiver_id === selectedConvId)
                ) {
                    setMessages(prev => [...prev, newMsg]);
                    scrollToBottom();
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedConvId, user]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedConvId || !user) return;

        try {
            const { error } = await supabase.from('messages').insert({
                sender_id: user.id,
                receiver_id: selectedConvId,
                content: replyText,
                read: false
            });

            if (error) throw error;
            setReplyText('');
        } catch (err) {
            console.error(err);
            addToast("Erro ao enviar mensagem", "error");
        }
    };

    const selectedConv = conversations.find(c => c.id === selectedConvId);

    return (
        <div className="flex flex-1 min-h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-white">
            {/* Conversation List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b shrink-0 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-900">Mensagens</h3>
                </div>
                <ul className="overflow-y-auto flex-1 h-full">
                    {loading && <li className="p-4 text-center text-gray-500">Carregando...</li>}
                    {!loading && conversations.length === 0 && (
                        <li className="p-4 text-center text-gray-500 text-sm">Nenhuma conversa iniciada.</li>
                    )}
                    {conversations.map(conv => (
                        <li key={conv.id}
                            onClick={() => setSelectedConvId(conv.id)}
                            className={`flex items-center p-3 cursor-pointer border-b transition-colors ${selectedConvId === conv.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                        >
                            <img src={conv.avatar} alt={conv.name} className="w-10 h-10 rounded-full mr-3" />
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-800 truncate">{conv.name}</span>
                                    {conv.unreadCount > 0 && <span className="flex items-center justify-center w-5 h-5 bg-primary-500 text-white text-xs rounded-full shrink-0 ml-2">{conv.unreadCount}</span>}
                                </div>
                                <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Chat Area */}
            <div className="w-2/3 flex flex-col bg-gray-50">
                {selectedConvId ? (
                    <>
                        <div className="p-4 border-b bg-white flex items-center shrink-0 shadow-sm">
                            <img src={selectedConv?.avatar} alt={selectedConv?.name} className="w-10 h-10 rounded-full mr-3" />
                            <div>
                                <h3 className="font-semibold text-gray-900">{selectedConv?.name || 'Chat'}</h3>
                            </div>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender_id === user?.id ? 'bg-primary-500 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                                        <p>{msg.content}</p>
                                        <span className={`text-[10px] block mt-1 ${msg.sender_id === user?.id ? 'text-primary-100' : 'text-gray-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t bg-white shrink-0">
                            <div className="flex space-x-3">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                                    placeholder="Digite sua resposta..."
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                />
                                <Button onClick={handleSendReply}>Enviar</Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">Suas conversas</h3>
                        <p className="mt-1 text-sm text-gray-500">Selecione uma conversa para ver os detalhes.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardMensagensPage;
