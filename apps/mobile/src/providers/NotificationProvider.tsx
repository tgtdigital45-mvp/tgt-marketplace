import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import { Animated, Easing, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase, Notification } from '@tgt/shared';
import { useAuth } from './AuthProvider';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Toast UI state
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const toastTranslateY = useRef(new Animated.Value(-100)).current;

    // Toast mechanics
    const showToast = (message: string) => {
        setToastMessage(message);
        Animated.sequence([
            Animated.timing(toastTranslateY, {
                toValue: 50, // drops down from top
                duration: 300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.delay(3000), // wait 3s
            Animated.timing(toastTranslateY, {
                toValue: -100, // goes back up
                duration: 300,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            })
        ]).start(() => setToastMessage(null));
    };

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        const fetchNotifications = async () => {
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (!error && data) {
                    setNotifications(data);
                }
            } catch (err) {
                console.error('Error fetching mobile notifications:', err);
            }
        };

        fetchNotifications();

        const channelName = `mobile-notifications:${user.id}`;
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
                (payload: any) => {
                    if (payload.eventType === 'INSERT') {
                        const newNotif = payload.new as Notification;
                        setNotifications((prev) => [newNotif, ...prev]);
                        showToast(newNotif.title || 'Nova Notificação!');
                    } else if (payload.eventType === 'UPDATE') {
                        const updated = payload.new as Notification;
                        setNotifications((prev) =>
                            prev.map((n) => (n.id === updated.id ? updated : n))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
        if (!error) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
        if (!error) {
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
            {children}

            {/* Simple Animated Toast Overlay */}
            <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastTranslateY }] }]}>
                {toastMessage && (
                    <TouchableOpacity style={styles.toastBox} onPress={() => toastTranslateY.setValue(-100)}>
                        <Text style={styles.toastText} numberOfLines={2}>{toastMessage}</Text>
                    </TouchableOpacity>
                )}
            </Animated.View>
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        elevation: 9999,
    },
    toastBox: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        maxWidth: '90%',
    },
    toastText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    }
});
