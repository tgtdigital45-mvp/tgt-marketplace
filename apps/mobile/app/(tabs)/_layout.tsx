import { Tabs } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors, Shadows } from '../../utils/theme';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';

function AnimatedTabIcon({ name, focused, color }: { name: any; focused: boolean; color: string }) {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withSpring(focused ? 1.15 : 1, {
            damping: 12,
            stiffness: 200,
        });
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Ionicons name={name} size={24} color={color} />
        </Animated.View>
    );
}

export default function TabLayout() {
    const { profile } = useAuth();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textTertiary,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: true,
                tabBarLabelStyle: styles.tabBarLabel,
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Início',
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon
                            name={focused ? 'home' : 'home-outline'}
                            focused={focused}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="browse"
                options={{
                    title: 'Explorar',
                    href: profile?.user_type === 'company' ? null : '/(tabs)/browse',
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon
                            name={focused ? 'search' : 'search-outline'}
                            focused={focused}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    title: 'Painel',
                    href: profile?.user_type === 'company' ? '/(tabs)/analytics' : null,
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon
                            name={focused ? 'bar-chart' : 'bar-chart-outline'}
                            focused={focused}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="scan"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Pedidos',
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon
                            name={focused ? 'receipt' : 'receipt-outline'}
                            focused={focused}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, focused }) => (
                        <AnimatedTabIcon
                            name={focused ? 'person' : 'person-outline'}
                            focused={focused}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        borderTopWidth: 0,
        height: Platform.OS === 'ios' ? 88 : 70,
        paddingBottom: Platform.OS === 'ios' ? 30 : 10,
        paddingTop: 10,
        ...Shadows.lg,
    },
    tabBarLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: -5,
        marginBottom: 5,
    },
});
