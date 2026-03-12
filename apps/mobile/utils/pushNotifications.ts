import type * as NotificationsType from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { logger } from '../utils/logger';

// SDK 53 removed push notifications from Expo Go. Lazy-load to avoid side-effect warnings.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Notifications: typeof NotificationsType | null = isExpoGo ? null : require('expo-notifications');

if (Notifications) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}

/**
 * Registers the device for push notifications and saves the token in Supabase.
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
    if (!Notifications || !Device.isDevice) {
        if (!Notifications) logger.warn('Push notifications not available in Expo Go. Use a development build.');
        else logger.warn('Push notifications require a physical device.');
        return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        logger.warn('Push notification permission not granted.');
        return null;
    }

    // Get Expo Push Token
    try {
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;

        if (!projectId || projectId === 'YOUR_PROJECT_ID') {
            const msg = !projectId
                ? 'projectId não encontrado no app.json.'
                : 'Substitua "YOUR_PROJECT_ID" pelo seu Expo Project ID real no app.json.';
            logger.warn(`⚠️ Push Notifications: ${msg} Notificações desativadas.`);
            return null;
        }

        // Verifica se o ID tem formato de UUID básico antes de tentar
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
        if (!isUuid) {
            logger.warn('⚠️ Push Notifications: projectId no app.json não é um UUID válido.');
            return null;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });
        const token = tokenData.data;

        // Android channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Notificações',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#0066ff',
            });
        }

        // Save token to Supabase
        const { error: upsertError } = await supabase.from('push_tokens').upsert(
            {
                user_id: userId,
                token,
                platform: Platform.OS,
                is_active: true,
            },
            { onConflict: 'user_id,token' }
        );

        if (upsertError) {
            logger.error('Error saving push token to database:', upsertError);
            return null;
        }

        return token;
    } catch (e: any) {
        const errorMsg = e?.message || '';
        if (errorMsg.includes('EXPERIENCE_NOT_FOUND')) {
            logger.warn('⚠️ Push Notifications: Projeto Expo não encontrado (EXPERIENCE_NOT_FOUND).');
            logger.log('💡 Dica: Execute "npx -y eas-cli project:init" no terminal para vincular o projeto à sua conta Expo.');
        } else {
            logger.error('Error getting Expo push token:', e);
        }
        return null;
    }
}

/**
 * Removes push token from Supabase (logout).
 */
export async function unregisterPushToken(userId: string): Promise<void> {
    if (!Notifications) return;

    try {
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;

        if (!projectId) return;

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });
        await supabase
            .from('push_tokens')
            .update({ is_active: false })
            .eq('user_id', userId)
            .eq('token', tokenData.data);
    } catch (e) {
        logger.warn('Failed to unregister push token:', e);
    }
}

/**
 * Listens for incoming notifications and returns cleanup function.
 */
export function setupNotificationListeners(
    onNotificationReceived?: (notification: NotificationsType.Notification) => void,
    onNotificationResponse?: (response: NotificationsType.NotificationResponse) => void
) {
    if (!Notifications) return () => {};

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
        onNotificationReceived?.(notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        onNotificationResponse?.(response);
    });

    return () => {
        receivedSub.remove();
        responseSub.remove();
    };
}

const PUSH_PERMISSION_DENIED_KEY = 'PUSH_PERMISSION_DENIED_DATE';

/**
 * Requests push permissions contextually.
 * If the user denied within the last 7 days, it aborts silently.
 */
export async function requestPushPermissionContextually(userId: string): Promise<string | null> {
    if (!Notifications || !Device.isDevice) return null;

    try {
        // 1. Check existing permission
        const { status: existingStatus } = await Notifications.getPermissionsAsync();

        if (existingStatus === 'granted') {
            // Already granted, just register and sync token
            return registerForPushNotificationsAsync(userId);
        }

        // 2. Not granted yet. Check if we are in the 7-day cooldown
        const deniedDateStr = await AsyncStorage.getItem(PUSH_PERMISSION_DENIED_KEY);
        if (deniedDateStr) {
            const deniedDate = new Date(deniedDateStr);
            const now = new Date();
            const diffInDays = (now.getTime() - deniedDate.getTime()) / (1000 * 3600 * 24);

            if (diffInDays < 7) {
                logger.log(`Push permission request skipped: in 7-day cooldown (${Math.round(diffInDays)} dias passados)`);
                return null;
            } else {
                // Cooldown expired, we can ask again
                await AsyncStorage.removeItem(PUSH_PERMISSION_DENIED_KEY);
            }
        }

        // 3. Request permissions
        const { status } = await Notifications.requestPermissionsAsync();

        if (status !== 'granted') {
            logger.log('Push permission denied by user. Starting 7-day cooldown.');
            await AsyncStorage.setItem(PUSH_PERMISSION_DENIED_KEY, new Date().toISOString());
            return null;
        }

        // 4. Granted! Register token.
        return registerForPushNotificationsAsync(userId);
    } catch (error) {
        logger.error('Error in requestPushPermissionContextually:', error);
        return null;
    }
}
