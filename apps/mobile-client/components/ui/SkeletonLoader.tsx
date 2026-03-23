import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate,
} from 'react-native-reanimated';
import { Colors, BorderRadius } from '../../utils/theme';

type SkeletonProps = {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: any;
};

export function Skeleton({ width, height, borderRadius = BorderRadius.sm, style }: SkeletonProps) {
    const shimmer = useSharedValue(0);

    useEffect(() => {
        shimmer.value = withRepeat(
            withTiming(1, { duration: 1200 }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
    }));

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor: Colors.border,
                },
                animatedStyle,
                style,
            ]}
            aria-label="Carregando"
        />
    );
}

export function SkeletonCard({ style }: { style?: any }) {
    return (
        <View style={[styles.card, style]}>
            <Skeleton width="100%" height={180} borderRadius={BorderRadius.xl} />
            <View style={styles.cardContent}>
                <Skeleton width="70%" height={20} />
                <Skeleton width="50%" height={14} style={{ marginTop: 8 }} />
            </View>
        </View>
    );
}

export function SkeletonListItem({ style }: { style?: any }) {
    return (
        <View style={[styles.listItem, style]}>
            <Skeleton width={48} height={48} borderRadius={BorderRadius.lg} />
            <View style={styles.listItemContent}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
            </View>
        </View>
    );
}

export function SkeletonOrderCard({ style }: { style?: any }) {
    return (
        <View style={[styles.orderCard, style]}>
            <View style={styles.orderHeader}>
                <Skeleton width="40%" height={14} />
                <Skeleton width={70} height={24} borderRadius={BorderRadius.sm} />
            </View>
            <Skeleton width="80%" height={20} style={{ marginVertical: 10 }} />
            <View style={styles.orderFooter}>
                <Skeleton width="35%" height={14} />
                <Skeleton width={80} height={16} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
    },
    cardContent: {
        marginTop: 12,
        gap: 4,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    listItemContent: {
        flex: 1,
        marginLeft: 16,
    },
    orderCard: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: Colors.surface,
        paddingTop: 12,
        marginTop: 4,
    },
});
