import React, { useRef, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationItem from '@/components/NotificationItem';

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
    const { notifications, markAsRead, markAllAsRead, loading } = useNotifications();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const recentNotifications = notifications.slice(0, 5);
    const hasUnread = notifications.some((n) => !n.read);

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
                {hasUnread && (
                    <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Marcar todas como lidas
                    </button>
                )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-2 text-sm">Carregando...</p>
                    </div>
                ) : recentNotifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p className="text-sm">Nenhuma notificação</p>
                    </div>
                ) : (
                    recentNotifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={markAsRead}
                        />
                    ))
                )}
            </div>

            {/* Footer */}
            {notifications.length > 5 && (
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={() => {
                            // TODO: Navigate to full notifications page
                            onClose();
                        }}
                        className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Ver todas as notificações
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
