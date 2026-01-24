import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotificationProvider, useNotifications } from '../contexts/NotificationContext';
// import { AuthProvider } from '../contexts/AuthContext'; // Unused
import { BrowserRouter } from 'react-router-dom';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
    supabase: {
        channel: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn(),
        })),
        removeChannel: vi.fn(),
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
    },
}));

// Mock Auth
vi.mock('./AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'test-user-id', email: 'test@example.com' },
        loading: false,
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const TestComponent = () => {
    const { unreadCount, notifications } = useNotifications();
    return (
        <div>
            <span data-testid="unread-count">{unreadCount}</span>
            <span data-testid="notif-count">{notifications.length}</span>
        </div>
    );
};

describe('NotificationContext', () => {
    it('provides initial notification state', async () => {
        render(
            <BrowserRouter>
                <NotificationProvider>
                    <TestComponent />
                </NotificationProvider>
            </BrowserRouter>
        );

        expect(screen.getByTestId('unread-count').textContent).toBe('0');
        expect(screen.getByTestId('notif-count').textContent).toBe('0');
    });
});
