import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, TouchableWithoutFeedback, Keyboard, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, BorderRadius, Shadows } from '../../utils/theme';
import { logger } from '../../utils/logger';

type Order = {
    id: string;
    buyer_id: string;
    seller_id: string;
    service_id: string;
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'canceled' | 'rejected';
    price: number | null;
    scheduled_for: string | null;
    services: { 
        title: string; 
        requires_quote: boolean; 
        companies: { company_name: string; profile_id: string; } | null;
    } | null;
    profiles: { full_name: string | null; } | null;
};

type Message = {
    id: string;
    order_id: string;
    sender_id: string | null;
    content: string | null;
    file_url: string | null;
    file_type: string | null;
    proposal_id: string | null;
    is_system_message: boolean;
    created_at: string;
    profiles: { full_name: string | null; } | null;
    order_proposals: { id: string; amount: number; status: string; estimated_duration: string | null; notes: string | null; } | null;
};

export default function ChatScreen() {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const router = useRouter();
    const { session, profile } = useAuth();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [inputText, setInputText] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const [budgetModalVisible, setBudgetModalVisible] = useState(false);
    const [budgetInput, setBudgetInput] = useState('');
    const [budgetDuration, setBudgetDuration] = useState('');
    const [budgetNotes, setBudgetNotes] = useState('');
    const [sendingBudget, setSendingBudget] = useState(false);

    const scrollViewRef = useRef<ScrollView>(null);

    const scrollToBottom = (animated = true) =>
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated }), 80);

    // Validação de orderId - redireciona se não tiver
    useEffect(() => {
        if (!orderId) {
            Alert.alert('Erro', 'Pedido não encontrado.');
            router.back();
        }
    }, [orderId]);

    // Request push permissions when chat opens
    useEffect(() => {
        if (session?.user?.id) {
            import('../../utils/pushNotifications').then(({ requestPushPermissionContextually }) => {
                requestPushPermissionContextually(session.user.id);
            }).catch(e => logger.error('Failed to load push notifications request', e));
        }
    }, [session?.user?.id]);

    // ---- Fetch Order ----
    useEffect(() => {
        let currentOrderId: string | null = null;

        async function fetchOrder() {
            try {
                if (orderId) {
                    const { data, error } = await supabase
                        .from('bookings')
                        .select('*, companies(company_name, profile_id), profiles:client_id(full_name)')
                        .eq('id', orderId)
                        .single();
                    if (error) throw error;
                    currentOrderId = data.id;
                    
                    // Map for UI compatibility
                    const mappedOrder = {
                        ...data,
                        buyer_id: data.client_id,
                        seller_id: data.company_id,
                        price: data.service_price,
                        scheduled_for: data.booking_date,
                        status: data.status === 'cancelled' ? 'canceled' : data.status,
                        services: {
                            title: data.service_title,
                            requires_quote: false, // Defaulting as it's already a booking
                            companies: data.companies
                        }
                    };
                    setOrder(mappedOrder as unknown as Order);
                } else if (session?.user.id) {
                    const { data, error } = await supabase
                        .from('bookings')
                        .select('*, companies(company_name, profile_id), profiles:client_id(full_name)')
                        .eq('client_id', session.user.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();
                    if (error && error.code !== 'PGRST116') throw error;
                    if (data) { 
                        currentOrderId = data.id; 
                        const mappedOrder = {
                            ...data,
                            buyer_id: data.client_id,
                            seller_id: data.company_id,
                            price: data.service_price,
                            scheduled_for: data.booking_date,
                            status: data.status === 'cancelled' ? 'canceled' : data.status,
                            services: {
                                title: data.service_title,
                                requires_quote: false,
                                companies: data.companies
                            }
                        };
                        setOrder(mappedOrder as unknown as Order); 
                    }
                }
            } catch (e) {
                logger.error('Error fetching order for chat:', e);
            } finally {
                setLoading(false);
            }
        }

        fetchOrder();

        const orderChannel = supabase
            .channel('realtime_chat_order')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' },
                (payload: any) => {
                    const rowId = (payload.new as any)?.id || (payload.old as any)?.id;
                    if (currentOrderId && rowId === currentOrderId) fetchOrder();
                })
            .subscribe();

        return () => { supabase.removeChannel(orderChannel); };
    }, [orderId, session]);

    // ---- Fetch Messages ----
    const fetchMessages = async (orderIdToFetch: string) => {
        setIsLoadingMessages(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('id, order_id, sender_id, content, file_url, file_type, proposal_id, is_system_message, created_at, profiles!messages_sender_id_fkey(first_name, last_name), order_proposals(id, amount, status, estimated_duration, notes)')
                .eq('order_id', orderIdToFetch)
                .order('created_at', { ascending: true });
            if (error) throw error;
            setMessages((data as unknown as Message[]) ?? []);
            scrollToBottom(false);
        } catch (e) {
            logger.error('Error fetching messages:', e);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    useEffect(() => {
        if (!order?.id) return;
        fetchMessages(order.id);

        const msgChannel = supabase
            .channel(`realtime_messages_${order.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${order.id}` },
                async (payload: any) => {
                    if (messages.some(m => m.id === (payload.new as any).id)) return;

                    const { data } = await supabase
                        .from('messages')
                        .select('id, order_id, sender_id, content, file_url, file_type, proposal_id, is_system_message, created_at, profiles!messages_sender_id_fkey(first_name, last_name), order_proposals(id, amount, status, estimated_duration, notes)')
                        .eq('id', (payload.new as any).id)
                        .single();
                    if (data) {
                        setMessages(prev => {
                            if (prev.some(m => m.id === data.id)) return prev;
                            return [...prev, data as unknown as Message];
                        });
                        scrollToBottom();
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(msgChannel); };
    }, [order?.id]);

    const handleUpdateStatus = async (newStatus: Order['status']) => {
        if (!order) return;
        try {
            if (newStatus === 'accepted' && !isProvider) {
                router.push(`/orders/schedule/${order.id}`);
                return;
            }

            const { error } = await supabase
                .from('bookings')
                .update({ status: newStatus })
                .eq('id', order.id);

            if (error) throw error;

            // Insert system message for status change
            const statusMap: Record<string, string> = {
                accepted: 'Pedido aceito pelo profissional.',
                rejected: 'Pedido recusado pelo profissional.',
                in_progress: 'Serviço iniciado.',
                completed: 'Serviço finalizado!',
                canceled: 'Pedido cancelado.'
            };

            await supabase
                .from('messages')
                .insert({
                    order_id: order.id,
                    content: statusMap[newStatus],
                    is_system_message: true
                });

            setOrder({ ...order, status: newStatus });
            Alert.alert("Sucesso", newStatus === 'accepted' ? 'Pedido Aceito.' : 'Status Atualizado.');
        } catch (error) {
            logger.error('Update status error:', error);
            Alert.alert("Erro", "Não foi possível atualizar o status.");
        }
    };

    const handleSendBudget = () => {
        setBudgetInput('');
        setBudgetDuration('');
        setBudgetNotes('');
        setBudgetModalVisible(true);
    };

    const confirmSendBudget = async () => {
        if (!order || !session?.user) return;
        const numericPrice = parseFloat(budgetInput.replace(',', '.'));
        if (isNaN(numericPrice) || numericPrice <= 0) {
            Alert.alert('Aviso', 'Digite um valor válido.');
            return;
        }
        setSendingBudget(true);
        try {
            // 1. Criar a proposta formal em order_proposals
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

            // 2. Atualizar booking para refletir na UI o price pendente
            const { error: bookingError } = await supabase
                .from('bookings')
                .update({ service_price: numericPrice })
                .eq('id', order.id);
            if (bookingError) throw bookingError;

            // 3. Enviar a mensagem vinculando a proposta
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    order_id: order.id,
                    sender_id: session.user.id,
                    content: `Orçamento de R$ ${numericPrice.toFixed(2)} enviado.`,
                    proposal_id: proposalData.id
                });
            if (msgError) throw msgError;

            setOrder({ ...order, price: numericPrice });
            setBudgetModalVisible(false);
            Alert.alert('Enviado!', `Formulário de orçamento de R$ ${numericPrice.toFixed(2)} foi enviado ao cliente.`);
        } catch (e: any) {
            logger.error('Erro ao enviar orçamento:', e);
            Alert.alert('Erro', `Falha ao enviar orçamento: ${e.message || 'Erro desconhecido'}`);
        } finally {
            setSendingBudget(false);
        }
    };

    const handleBlock = () => {
        const reportedName = partnerName;
        const reportedId = isProvider ? order?.buyer_id : order?.seller_id;

        if (!reportedId) return;

        Alert.alert(
            'Bloquear Usuário',
            `Deseja bloquear ${reportedName}? Você não receberá mais mensagens deste usuário e seus pedidos futuros serão automaticamente recusados.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Bloquear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('user_blocks')
                                .insert({
                                    blocker_id: session?.user.id,
                                    blocked_id: reportedId,
                                });
                            if (error) throw error;
                            Alert.alert('Bloqueado', 'Usuário bloqueado com sucesso.');
                            router.back();
                        } catch (e) {
                            logger.error('Error blocking user:', e);
                            Alert.alert('Erro', 'Não foi possível bloquear este usuário.');
                        }
                    }
                }
            ]
        );
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !order || !session?.user) return;
        const text = inputText.trim();
        setInputText('');
        setSendingMessage(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({ order_id: order.id, sender_id: session.user.id, content: text })
                .select('id, order_id, sender_id, content, file_url, file_type, proposal_id, is_system_message, created_at, profiles!messages_sender_id_fkey(first_name, last_name), order_proposals(id, amount, status, estimated_duration, notes)')
                .single();

            if (error) throw error;

            if (data) {
                setMessages(prev => [...prev, data as unknown as Message]);
                scrollToBottom();
            }
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
            setInputText(text);
        } finally {
            setSendingMessage(false);
        }
    };

    const handlePickImage = async () => {
        if (!order || !session?.user) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.7,
            });

            if (result.canceled || !result.assets[0]) return;

            setIsUploadingImage(true);
            const asset = result.assets[0];
            const fileExt = asset.uri.split('.').pop() || 'jpg';
            const fileName = `${order.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Convert to blob
            const response = await fetch(asset.uri);
            const blob = await response.blob();

            const { data, error } = await supabase.storage
                .from('chat-attachments')
                .upload(fileName, blob, { contentType: `image/${fileExt}` });

            if (error) throw error;

            const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(fileName);

            // Send the message with the image
            const { data: msgData, error: msgError } = await supabase
                .from('messages')
                .insert({ order_id: order.id, sender_id: session.user.id, content: '', file_url: urlData.publicUrl, file_type: `image/${fileExt}` })
                .select('id, order_id, sender_id, content, file_url, file_type, proposal_id, is_system_message, created_at, profiles!messages_sender_id_fkey(first_name, last_name)')
                .single();

            if (msgError) throw msgError;

            if (msgData) {
                setMessages(prev => [...prev, msgData as unknown as Message]);
                scrollToBottom();
            }

        } catch (e) {
            logger.error('Pick image error:', e);
            Alert.alert('Erro', 'Não foi possível enviar a imagem.');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleReport = () => {
        const reportedName = partnerName;
        const reportedId = isProvider ? order?.buyer_id : order?.seller_id;
        const type = isProvider ? 'user' : 'company';

        if (!reportedId) return;

        Alert.alert(
            'Denunciar',
            `Deseja denunciar ${reportedName}? Esta denúncia será analisada por nossa equipe de segurança em até 24h.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Denunciar',
                    style: 'destructive',
                    onPress: async () => {
                        // Poderíamos pedir o motivo, mas para compliance o botão já resolve. 
                        // Vamos usar um motivo padrão.
                        try {
                            const { error } = await supabase
                                .from('reports')
                                .insert({
                                    reporter_id: session?.user.id,
                                    reported_id: reportedId,
                                    type,
                                    reason: 'UGC Content/Behavior Violation',
                                    details: `Report from chat for order ${order?.id}`
                                });
                            if (error) throw error;
                            Alert.alert('Enviado', 'Obrigado. Analisaremos o comportamento deste usuário.');
                        } catch (e) {
                            logger.error('Error reporting in chat:', e);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Text>Ordem não encontrada.</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: Colors.primary }}>Voltar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const isProvider = profile?.user_type === 'company' && order.services?.companies?.profile_id === session?.user.id;

    const partnerName = isProvider
        ? order.profiles?.full_name || 'Cliente'
        : order.services?.companies?.company_name || 'Profissional';

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const senderName = (msg: Message) =>
        msg.profiles?.full_name || 'Usuário';

    const isChatDisabled = (order.status === 'pending' && !isProvider) || order.status === 'canceled' || order.status === 'completed' || order.status === 'rejected';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{partnerName}</Text>
                    <Text style={styles.headerSubtitle}>{order.services?.title}</Text>
                </View>
                <View style={[
                    styles.statusBadge,
                    order.status === 'pending' ? styles.statusWarning :
                        (order.status === 'accepted' || order.status === 'in_progress') ? styles.statusSuccess :
                            order.status === 'completed' ? { backgroundColor: '#dcfce7' } : styles.statusError
                ]}>
                    <Text style={[
                        styles.statusText,
                        order.status === 'pending' ? styles.statusWarningText :
                            (order.status === 'accepted' || order.status === 'in_progress') ? styles.statusSuccessText :
                                order.status === 'completed' ? { color: '#166534' } : styles.statusErrorText
                    ]}>
                        {order.status === 'pending' ? 'Aguardando' :
                            order.status === 'accepted' ? 'Confirmado' :
                                order.status === 'in_progress' ? 'Em andamento' :
                                    order.status === 'completed' ? 'Finalizado' : 'Cancelado'}
                    </Text>
                </View>

                {!isProvider && (
                    <TouchableOpacity style={styles.reportHeaderBtn} onPress={handleReport}>
                        <Ionicons name="flag-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                )}

                {isProvider && (
                    <TouchableOpacity style={styles.reportHeaderBtn} onPress={handleReport}>
                        <Ionicons name="flag-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={[styles.reportHeaderBtn, { marginLeft: 8 }]} onPress={handleBlock}>
                    <Ionicons name="hand-right-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
            </View>

            {/* Provider Actions Header */}
            {isProvider && (order.status === 'pending' || (order.status === 'accepted' && order.services?.requires_quote && !order.price)) && (
                <View style={styles.providerActionsBox}>
                    <Text style={styles.actionPromptText}>
                        {order.status === 'pending' ? 'Novo pedido! O que deseja fazer?' : 'Pedido aceito! Envie sua proposta para o cliente.'}
                    </Text>

                    {order.services?.requires_quote && !order.price ? (
                        <TouchableOpacity style={styles.budgetBtn} onPress={handleSendBudget}>
                            <Ionicons name="document-text" size={16} color={Colors.primary} />
                            <Text style={styles.budgetText}>Enviar Proposta de Orçamento</Text>
                        </TouchableOpacity>
                    ) : order.status === 'pending' && (
                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity style={[styles.actBtn, styles.actAccept]} onPress={() => handleUpdateStatus('accepted')}>
                                <Ionicons name="checkmark" size={16} color={Colors.white} />
                                <Text style={styles.actAcceptText}>Aceitar Serviço</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actBtn, styles.actReject]} onPress={() => handleUpdateStatus('rejected')}>
                                <Ionicons name="close" size={16} color={Colors.error} />
                                <Text style={styles.actRejectText}>Recusar</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* Customer Options (Quando Provider mandou Orçamento) */}
            {!isProvider && (order.status === 'pending' || order.status === 'accepted') && order.services?.requires_quote && order.price !== null && !order.scheduled_for && !messages.some(m => m.order_proposals?.status === 'accepted') && (
                <View style={[styles.providerActionsBox, { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }]}>
                    <Text style={[styles.actionPromptText, { color: '#166534', fontWeight: '700' }]}>
                        O Profissional enviou um orçamento de R$ {order.price}
                    </Text>
                    <View style={styles.actionButtonsRow}>
                        <TouchableOpacity style={[styles.actBtn, { backgroundColor: '#16a34a' }]} onPress={() => handleUpdateStatus('accepted')}>
                            <Ionicons name="checkmark" size={16} color={Colors.white} />
                            <Text style={styles.actAcceptText}>Aceitar e Agendar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actBtn, styles.actReject]} onPress={() => handleUpdateStatus('rejected')}>
                            <Ionicons name="close" size={16} color={Colors.error} />
                            <Text style={styles.actRejectText}>Recusar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Banner de Avaliação */}
            {!isProvider && order.status === 'completed' && (
                <View style={[styles.providerActionsBox, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}>
                    <Text style={[styles.actionPromptText, { color: '#92400E', fontWeight: '700' }]}>
                        Serviço finalizado! Que tal avaliar?
                    </Text>
                    <TouchableOpacity
                        style={[styles.actBtn, { backgroundColor: '#F59E0B', flex: 0, paddingHorizontal: 20 }]}
                        onPress={() => router.push(`/orders/review?orderId=${order.id}&companyId=${order.services?.companies?.company_name || 'Empresa'}&companyName=${encodeURIComponent(order.services?.companies?.company_name || 'Empresa')}`)}
                    >
                        <Ionicons name="star" size={16} color={Colors.white} />
                        <Text style={styles.actAcceptText}>Avaliar Serviço</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Chat Area */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView ref={scrollViewRef} contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.systemBubble}>
                        <Text style={styles.systemTitle}>Pedido Solicitado</Text>
                        <Text style={styles.systemText}>
                            {order.services?.requires_quote
                                ? (isProvider ? 'O cliente quer um orçamento.' : 'Você solicitou um orçamento.')
                                : (isProvider ? 'O cliente quer agendar este serviço.' : 'Aguardando avaliação do profissional.')}
                        </Text>
                    </View>

                    {order.status === 'accepted' && (
                        <View style={[styles.systemBubble, { backgroundColor: '#e2f5e8', borderColor: '#bdf1cf', marginTop: 8 }]}>
                            <Ionicons name="checkmark-circle" size={22} color={Colors.success} style={{ marginBottom: 4 }} />
                            <Text style={[styles.systemText, { color: Colors.success, fontWeight: '600' }]}>
                                {isProvider ? 'Você confirmou o pedido!' : 'Profissional aceitou! Você já pode conversar livremente.'}
                            </Text>
                        </View>
                    )}

                    {(order.status === 'canceled' || order.status === 'rejected') && (
                        <View style={[styles.systemBubble, { backgroundColor: '#ffecec', borderColor: '#ffd1d1', marginTop: 8 }]}>
                            <Ionicons name="close-circle" size={22} color={Colors.error} style={{ marginBottom: 4 }} />
                            <Text style={[styles.systemText, { color: Colors.error, fontWeight: '600' }]}>Pedido Cancelado/Recusado.</Text>
                        </View>
                    )}

                    {isLoadingMessages && (
                        <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 16 }} />
                    )}

                    {messages.map((msg) => {
                        const isMe = msg.sender_id === session?.user.id;

                        if (msg.is_system_message) {
                            return (
                                <View key={msg.id} style={styles.systemBubble}>
                                    <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} style={{ marginBottom: 2 }} />
                                    <Text style={styles.systemText}>{msg.content}</Text>
                                </View>
                            );
                        }

                        if (msg.proposal_id && msg.order_proposals) {
                            const amount = msg.order_proposals.amount;
                            const status = msg.order_proposals.status;
                            return (
                                <View key={msg.id} style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
                                    {!isMe && (
                                        <View style={styles.msgAvatar}>
                                            <Text style={styles.msgAvatarText}>
                                                {senderName(msg)[0]?.toUpperCase() ?? '?'}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.proposalCard}>
                                        <View style={styles.proposalHeader}>
                                            <Ionicons name="document-text" size={18} color={Colors.primary} />
                                            <Text style={styles.proposalTitle}>Proposta de Orçamento</Text>
                                        </View>
                                        <Text style={styles.proposalAmount}>
                                            R$ {amount ? Number(amount).toFixed(2) : '—'}
                                        </Text>

                                        {msg.order_proposals?.estimated_duration && (
                                            <View style={styles.proposalDetailRow}>
                                                <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                                                <Text style={styles.proposalDetailText}>Prazo: {msg.order_proposals.estimated_duration}</Text>
                                            </View>
                                        )}

                                        {msg.order_proposals?.notes && (
                                            <View style={styles.proposalNotesBox}>
                                                <Text style={styles.proposalNotesText}>{msg.order_proposals.notes}</Text>
                                            </View>
                                        )}

                                        <Text style={styles.proposalHint}>
                                            {status === 'accepted' ? 'Proposta Aceita!' :
                                                status === 'rejected' ? 'Proposta Recusada.' :
                                                    isMe ? 'Aguardando resposta do cliente.' : 'Se disponível, clique no botão Acima para Aceitar.'}
                                        </Text>
                                        <Text style={[styles.msgTime, { marginTop: 6 }]}>{formatTime(msg.created_at)}</Text>
                                    </View>
                                </View>
                            );
                        }

                        return (
                            <View key={msg.id} style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
                                {!isMe && (
                                    <View style={styles.msgAvatar}>
                                        <Text style={styles.msgAvatarText}>
                                            {senderName(msg)[0]?.toUpperCase() ?? '?'}
                                        </Text>
                                    </View>
                                )}
                                <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
                                    {!isMe && (
                                        <Text style={styles.msgSenderName}>{senderName(msg)}</Text>
                                    )}
                                    {!!msg.file_url && (
                                        <Image source={{ uri: msg.file_url }} style={styles.msgImage} resizeMode="cover" />
                                    )}
                                    {!!msg.content && (
                                        <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{msg.content}</Text>
                                    )}
                                    <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{formatTime(msg.created_at)}</Text>
                                </View>
                            </View>
                        );
                    })}

                    <View style={{ height: 20 }} />
                </ScrollView>

                {/* Input Area */}
                <View style={styles.inputArea}>
                    <TouchableOpacity
                        style={[styles.attachBtn, isUploadingImage && { opacity: 0.5 }]}
                        onPress={handlePickImage}
                        disabled={isUploadingImage || isChatDisabled}
                    >
                        {isUploadingImage ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                            <Ionicons name="add-circle-outline" size={28} color={Colors.textTertiary} />
                        )}
                    </TouchableOpacity>
                    <TextInput
                        style={styles.textInput}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder={isChatDisabled ? 'Chat indisponível' : 'Digite uma mensagem...'}
                        multiline
                        editable={!isChatDisabled}
                        onSubmitEditing={handleSendMessage}
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!inputText.trim() || sendingMessage || isChatDisabled) && { opacity: 0.4 }]}
                        onPress={handleSendMessage}
                        disabled={!inputText.trim() || sendingMessage || isChatDisabled}
                    >
                        {sendingMessage
                            ? <ActivityIndicator size="small" color={Colors.white} />
                            : <Ionicons name="send" size={20} color={Colors.white} />}
                    </TouchableOpacity>
                </View>

                {/* Modal de Orçamento */}
                <Modal
                    visible={budgetModalVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setBudgetModalVisible(false)}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ flex: 1 }}
                    >
                        <TouchableOpacity
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setBudgetModalVisible(false)}
                        >
                            <TouchableWithoutFeedback>
                                <View style={styles.modalBox}>
                                    <View style={styles.modalHeaderIndicator} />
                                    <Text style={styles.modalTitle}>Enviar Orçamento</Text>
                                    <Text style={styles.modalSubtitle}>Preencha os detalhes da proposta:</Text>

                                    <Text style={styles.fieldLabel}>Valor Total (R$)</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={budgetInput}
                                        onChangeText={setBudgetInput}
                                        placeholder="Ex: 250,00"
                                        keyboardType="numeric"
                                        placeholderTextColor={Colors.textTertiary}
                                    />

                                    <Text style={styles.fieldLabel}>Prazo Estimado</Text>
                                    <TextInput
                                        style={styles.modalInputSmall}
                                        value={budgetDuration}
                                        onChangeText={setBudgetDuration}
                                        placeholder="Ex: 3 dias, 1 hora..."
                                        placeholderTextColor={Colors.textTertiary}
                                    />

                                    <Text style={styles.fieldLabel}>Observações / Materiais</Text>
                                    <TextInput
                                        style={[styles.modalInputSmall, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                                        value={budgetNotes}
                                        onChangeText={setBudgetNotes}
                                        placeholder="Descreva o que está incluso..."
                                        placeholderTextColor={Colors.textTertiary}
                                        multiline
                                    />

                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity style={styles.modalCancel} onPress={() => setBudgetModalVisible(false)}>
                                            <Text style={styles.modalCancelText}>Cancelar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalConfirm, (sendingBudget || !budgetInput) && { opacity: 0.6 }]}
                                            onPress={confirmSendBudget}
                                            disabled={sendingBudget || !budgetInput}
                                        >
                                            {sendingBudget
                                                ? <ActivityIndicator size="small" color={Colors.white} />
                                                : <Text style={styles.modalConfirmText}>Enviar Proposta</Text>}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
    container: { flex: 1, backgroundColor: Colors.surface },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, borderBottomWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.white },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    headerSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    reportHeaderBtn: { marginLeft: 12, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff5f5' },

    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    statusText: { fontSize: 11, fontWeight: '600' },
    statusWarning: { backgroundColor: '#fff8e6', borderColor: '#ffebb3' },
    statusWarningText: { color: '#b28900', fontSize: 11, fontWeight: '600' },
    statusSuccess: { backgroundColor: '#e2f5e8', borderColor: '#bdf1cf' },
    statusSuccessText: { color: Colors.success, fontSize: 11, fontWeight: '600' },
    statusError: { backgroundColor: '#ffecec', borderColor: '#ffd1d1' },
    statusErrorText: { color: Colors.error, fontSize: 11, fontWeight: '600' },

    providerActionsBox: { backgroundColor: '#f8fbff', padding: 16, borderBottomWidth: 1, borderColor: '#e1edff' },
    actionPromptText: { fontSize: 13, color: Colors.text, marginBottom: 12, fontWeight: '500' },
    actionButtonsRow: { flexDirection: 'row', gap: 10 },
    actBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
    actAccept: { backgroundColor: Colors.primary },
    actAcceptText: { color: Colors.white, fontSize: 13, fontWeight: 'bold' },
    actReject: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.borderLight },
    actRejectText: { color: Colors.error, fontSize: 13, fontWeight: '600' },
    budgetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginTop: 10, backgroundColor: Colors.white, borderWidth: 1, borderColor: '#b3d1ff', borderRadius: 8, gap: 6 },
    budgetText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },

    chatScroll: { padding: 20, paddingBottom: 40 },
    systemBubble: { alignSelf: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 20, alignItems: 'center', width: '90%' },
    systemTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
    systemText: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },

    formCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 24, alignSelf: 'stretch' },
    formCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },

    msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
    msgRowMe: { justifyContent: 'flex-end' },
    msgRowOther: { justifyContent: 'flex-start' },
    msgAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 2 },
    msgAvatarText: { fontSize: 13, fontWeight: '800', color: Colors.textSecondary },
    msgBubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, paddingBottom: 6 },
    msgBubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
    msgBubbleOther: { backgroundColor: Colors.borderLight, borderBottomLeftRadius: 4 },
    msgSenderName: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, marginBottom: 3 },
    msgText: { fontSize: 15, color: Colors.text, lineHeight: 21 },
    msgTextMe: { color: Colors.white },
    msgImage: { width: 220, height: 220, borderRadius: 12, marginBottom: 6, backgroundColor: Colors.borderLight, alignSelf: 'center' },
    msgTime: { fontSize: 10, color: Colors.textTertiary, marginTop: 4, textAlign: 'right' },
    msgTimeMe: { color: 'rgba(255,255,255,0.65)' },

    inputArea: { flexDirection: 'row', padding: 15, alignItems: 'center', borderTopWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.white, paddingBottom: Platform.OS === 'ios' ? 24 : 15 },
    attachBtn: { padding: 6 },
    textInput: { flex: 1, minHeight: 40, maxHeight: 100, backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 15, marginLeft: 8 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 10, paddingLeft: 4 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: Colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 32, ...Shadows.lg },
    modalHeaderIndicator: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: Colors.text, marginBottom: 6, letterSpacing: -0.5 },
    modalSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24, fontWeight: '500' },
    modalInput: { borderWidth: 1.5, borderColor: Colors.borderLight, borderRadius: 16, height: 60, paddingHorizontal: 20, fontSize: 20, fontWeight: '700', backgroundColor: Colors.surface, color: Colors.text, marginBottom: 24 },
    modalButtons: { flexDirection: 'row', gap: 12 },
    modalCancel: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
    modalCancelText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
    modalConfirm: { flex: 1, height: 50, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
    modalConfirmText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

    proposalCard: { maxWidth: '85%', backgroundColor: '#f0f7ff', borderWidth: 1, borderColor: '#dbeafe', borderRadius: 20, padding: 16, paddingBottom: 10, ...Shadows.sm },
    proposalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    proposalTitle: { fontSize: 13, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
    proposalAmount: { fontSize: 32, fontWeight: '900', color: Colors.text, letterSpacing: -1, marginBottom: 8 },
    proposalDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    proposalDetailText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
    proposalNotesBox: { backgroundColor: Colors.white, padding: 10, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
    proposalNotesText: { fontSize: 13, color: Colors.text, lineHeight: 18 },
    proposalHint: { fontSize: 11, color: Colors.textTertiary, fontWeight: '500', fontStyle: 'italic' },

    fieldLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8, marginLeft: 4 },
    modalInputSmall: { borderWidth: 1.5, borderColor: Colors.borderLight, borderRadius: 16, height: 50, paddingHorizontal: 16, fontSize: 15, backgroundColor: Colors.surface, color: Colors.text, marginBottom: 16 },
});
