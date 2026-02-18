import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification } from '@tgt/shared';
import { formatDistanceToNow } from '@/utils/dateUtils';

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const getIcon = () => {
        switch (notification.type) {
            case 'booking_created':
            case 'booking_confirmed':
            case 'booking_completed':
            case 'booking_cancelled':
                return '📅';
            case 'message_received':
                return '💬';
            case 'review_received':
                return '⭐';
            case 'company_approved':
                return '✅';
            case 'company_rejected':
                return '❌';
            default:
                return '🔔';
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 ${!notification.read ? 'bg-blue-50' : ''
                }`}
        >
            <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{getIcon()}</span>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
                        {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at))}
                    </p>
                </div>
                {!notification.read && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></span>
                )}
            </div>
        </div>
    );
};

export default NotificationItem;
