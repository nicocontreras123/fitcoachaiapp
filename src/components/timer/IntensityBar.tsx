import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';

interface IntensityBarProps {
    intensity: number; // 0 to 100
    label: string;
    color?: string;
    backgroundColor?: string;
}

export const IntensityBar: React.FC<IntensityBarProps> = ({
    intensity,
    label,
    color = '#ec1313',
    backgroundColor = 'rgba(0, 0, 0, 0.4)',
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: false,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: false,
                }),
            ])
        );
        pulseAnimation.start();

        return () => pulseAnimation.stop();
    }, [pulseAnim]);

    const getIntensityLabel = () => {
        if (intensity >= 75) return 'Alta';
        if (intensity >= 50) return 'Media';
        return 'Baja';
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.label}>{label}</Text>
                <Text style={[styles.intensityLabel, { color }]}>{getIntensityLabel()}</Text>
            </View>
            <View style={[styles.barBackground, { backgroundColor }]}>
                <Animated.View
                    style={[
                        styles.barFill,
                        {
                            width: `${intensity}%`,
                            backgroundColor: color,
                        },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.barPulse,
                            {
                                opacity: pulseAnim.interpolate({
                                    inputRange: [1, 1.1],
                                    outputRange: [0.3, 0.6],
                                }),
                            },
                        ]}
                    />
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.6)',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    intensityLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    barBackground: {
        height: 10,
        borderRadius: 9999,
        overflow: 'hidden',
        position: 'relative',
    },
    barFill: {
        height: '100%',
        borderRadius: 9999,
        position: 'relative',
    },
    barPulse: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 8,
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
});
