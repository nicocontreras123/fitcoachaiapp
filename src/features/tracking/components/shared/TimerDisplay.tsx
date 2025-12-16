import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { formatTime } from '@/utils/timeUtils';

interface TimerDisplayProps {
    timeLeft: number;
    label?: string;
    color?: string;
    size?: 'small' | 'medium' | 'large';
    animated?: boolean;
    scaleAnim?: Animated.Value;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
    timeLeft,
    label,
    color = '#ffffff',
    size = 'large',
    animated = false,
    scaleAnim,
}) => {
    const fontSize = size === 'large' ? 72 : size === 'medium' ? 48 : 32;
    const labelSize = size === 'large' ? 14 : size === 'medium' ? 12 : 10;

    const AnimatedText = animated && scaleAnim ? Animated.Text : Text;
    const animatedStyle = animated && scaleAnim ? { transform: [{ scale: scaleAnim }] } : {};

    return (
        <View style={styles.container}>
            <AnimatedText
                style={[
                    styles.timer,
                    { fontSize, color },
                    animatedStyle,
                ]}
            >
                {formatTime(timeLeft)}
            </AnimatedText>
            {label && (
                <Text style={[styles.label, { fontSize: labelSize }]}>
                    {label}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    timer: {
        fontWeight: '900',
        fontVariant: ['tabular-nums'],
    },
    label: {
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
