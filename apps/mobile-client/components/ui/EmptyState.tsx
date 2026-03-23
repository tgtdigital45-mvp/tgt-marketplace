import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../../utils/theme';
import FadeInView from './FadeInView';

type EmptyStateProps = {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
    isError?: boolean;
};

export default function EmptyState({
    icon,
    title,
    subtitle,
    actionLabel,
    onAction,
    isError = false,
}: EmptyStateProps) {
    return (
        <FadeInView style={styles.container}>
            <View style={[styles.iconContainer, isError && styles.iconContainerError]}>
                <Ionicons
                    name={icon}
                    size={40}
                    color={isError ? Colors.error : Colors.border}
                />
            </View>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            {actionLabel && onAction && (
                <TouchableOpacity
                    style={[styles.actionBtn, isError && styles.actionBtnError]}
                    onPress={onAction}
                    activeOpacity={0.8}
                >
                    <Text style={styles.actionText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </FadeInView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 40,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        ...Shadows.md,
        borderWidth: 1,
        borderColor: Colors.borderLight
    },
    iconContainerError: {
        backgroundColor: Colors.error + '10',
        borderColor: Colors.error + '20',
    },
    title: {
        ...Typography.h3,
        color: Colors.text,
        textAlign: 'center',
        fontWeight: '900',
        marginBottom: 8,
    },
    subtitle: {
        ...Typography.bodySmall,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '600'
    },
    actionBtn: {
        marginTop: 32,
        backgroundColor: Colors.text,
        paddingHorizontal: 32,
        paddingVertical: 18,
        borderRadius: 24,
        ...Shadows.md
    },
    actionBtnError: {
        backgroundColor: Colors.error,
    },
    actionText: {
        ...Typography.button,
        color: Colors.white,
        fontWeight: '900'
    },
});
