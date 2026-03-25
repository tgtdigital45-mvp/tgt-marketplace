import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Notification } from '@tgt/core';
import { supabase } from '@tgt/core';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { devLog, devWarn } from '@/utils/logger';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const isMounted = React.useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (!user) {
            if (isMounted.current) {
                setNotifications([]);
                setLoading(false);
            }
            return;
        }

        const fetchNotifications = async () => {
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;
                if (isMounted.current) setNotifications(data || []);
            } catch (err: any) {
                const error = err as Error;
                if (error.name === 'AbortError' || error.message?.includes('aborted')) return;
                console.error('Error fetching notifications:', error);

                // Critical: Check for JWT expiration
                if ((err as any)?.code === 'PGRST303' || error.message?.includes('JWT expired')) {
                    devWarn("NotificationContext: JWT expired. Triggering logout.");
                    logout();
                }
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };

        // Fetch initial notifications
        fetchNotifications();

        // Subscribe to realtime updates
        const channelName = `notifications:user:${user.id}`;
        devLog(`Subscribing to channel: ${channelName}`);

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    if (!isMounted.current) return;
                    devLog('Realtime notification received:', payload.eventType);

                    if (payload.eventType === 'INSERT') {
                        const newNotification = payload.new as Notification;
                        setNotifications((prev) => [newNotification, ...prev]);
                        addToast(newNotification.title, 'info');
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications((prev) =>
                            prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    devLog(`Successfully subscribed to ${channelName}`);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error(`Failed to subscribe to ${channelName}`);
                } else if (status === 'TIMED_OUT') {
                    console.error(`Subscription to ${channelName} timed out`);
                }
            });

        return () => {
            devLog(`Unsubscribing from channel: ${channelName}`);
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', id);

            if (error) throw error;

            if (isMounted.current) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, read: true } : n))
                );
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);

            if (error) throw error;

            if (isMounted.current) {
                setNotifications((prev) =>
                    prev.map((n) => ({ ...n, read: true }))
                );
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, markAsRead, markAllAsRead, loading }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
