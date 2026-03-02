import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Home, ClipboardList, User } from 'lucide-react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/providers/AuthProvider';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const { session, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !session) {
            router.replace('/(auth)/login');
        }
    }, [session, loading]);

    if (loading) return null;

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#2563eb', // brand-accent
                headerShown: true,
                tabBarStyle: {
                    backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#ffffff',
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Início',
                    tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Pedidos',
                    tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color }) => <User size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
