import React, { useState, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Bell, Check, Info, Briefcase, Calendar, MessageSquare, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { useNavigate } from 'react-router-dom';
import { Notification } from '@tgt/shared';

const NotificationsDropdown: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useOnClickOutside(dropdownRef, () => setIsOpen(false));

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
            setIsOpen(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'booking_confirmed':
            case 'booking_created':
            case 'proposal_accepted':
                return <Calendar className="w-4 h-4 text-green-500" />;
            case 'proposal_received':
                return <Briefcase className="w-4 h-4 text-blue-500" />;
            case 'message_received':
                return <MessageSquare className="w-4 h-4 text-purple-500" />;
            case 'review_received':
                return <Star className="w-4 h-4 text-yellow-500" />;
            default:
                return <Info className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-brand-primary transition-colors focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Notificações"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
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
                    >
                        <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="text-xs text-brand-primary hover:text-brand-primary/80 font-medium flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" />
                                    Marcar todas como lidas
                                </button>
                            )}
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                    Nenhuma notificação por enquanto.
                                </div>
                            ) : (
                                <ul>
                                    {notifications.map((notification) => (
                                        <li key={notification.id}>
                                            <button
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3 border-b border-gray-50 last:border-0 ${!notification.read ? 'bg-blue-50/30' : ''
                                                    }`}
                                            >
                                                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!notification.read ? 'bg-white shadow-sm' : 'bg-gray-100'
                                                    }`}>
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        {new Date(notification.created_at).toLocaleDateString()} • {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <div className="flex-shrink-0 mt-2">
                                                        <div className="w-2 h-2 bg-brand-primary rounded-full"></div>
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

export default NotificationsDropdown;
