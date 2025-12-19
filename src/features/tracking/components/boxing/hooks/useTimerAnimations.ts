import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Hook to manage animations (pulse and fade)
 */
export const useTimerAnimations = ({
    isActive,
    isPreparing,
}: {
    isActive: boolean;
    isPreparing: boolean;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation
    useEffect(() => {
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.05,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );

        if (isActive && !isPreparing) {
            pulseAnimation.start();
        } else {
            pulseAnimation.stop();
            scaleAnim.setValue(1);
        }

        return () => pulseAnimation.stop();
    }, [isActive, isPreparing, scaleAnim]);

    return { scaleAnim };
};
