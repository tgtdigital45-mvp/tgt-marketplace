import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withDelay,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { AnimationConfig } from '../../utils/theme';

type FadeInViewProps = {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    style?: ViewStyle | ViewStyle[];
    translateY?: number;
};

export default function FadeInView({
    children,
    delay = 0,
    duration = AnimationConfig.duration.normal,
    style,
    translateY = 20,
}: FadeInViewProps) {
    const opacity = useSharedValue(0);
    const y = useSharedValue(translateY);

    useEffect(() => {
        opacity.value = withDelay(
            delay,
            withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
        );
        y.value = withDelay(
            delay,
            withTiming(0, { duration, easing: Easing.out(Easing.cubic) })
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: y.value }],
    }));

    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
}
