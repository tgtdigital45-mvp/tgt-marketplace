import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { AnimationConfig } from '../../utils/theme';

type AnimatedCardProps = {
    children: React.ReactNode;
    onPress?: () => void;
    style?: ViewStyle | ViewStyle[];
    disabled?: boolean;
    haptic?: boolean;
};

export default function AnimatedCard({
    children,
    onPress,
    style,
    disabled = false,
    haptic = true,
}: AnimatedCardProps) {
    const scale = useSharedValue(1);

    const gesture = Gesture.Tap()
        .onBegin(() => {
            if (!disabled) {
                scale.value = withSpring(AnimationConfig.pressScale, {
                    damping: AnimationConfig.spring.damping,
                    stiffness: AnimationConfig.spring.stiffness,
                });
            }
        })
        .onFinalize(() => {
            scale.value = withSpring(1, {
                damping: AnimationConfig.spring.damping,
                stiffness: AnimationConfig.spring.stiffness,
            });
        })
        .onEnd(() => {
            if (!disabled && onPress) {
                if (haptic) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onPress();
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[animatedStyle, style]} aria-label="Cartão Animado">
                {children}
            </Animated.View>
        </GestureDetector>
    );
}
