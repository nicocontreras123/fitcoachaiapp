import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

interface ExerciseCardProps {
    title: string;
    description: string;
    imageUrl?: string;
    currentStep?: string;
    totalSteps?: number;
    currentStepIndex?: number;
    onPlayDemo?: () => void;
    colors?: [string, string];
    animated?: boolean;
    combinationTimeLeft?: number; // Time left for current combination in seconds
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
    title,
    description,
    imageUrl,
    currentStep,
    totalSteps,
    currentStepIndex = 0,
    onPlayDemo,
    colors = ['#ec1313', '#f97316'],
    animated = true,
    combinationTimeLeft,
}) => {
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!animated) return;

        const glowAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: false,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: false,
                }),
            ])
        );
        glowAnimation.start();

        return () => glowAnimation.stop();
    }, [animated, glowAnim]);

    const glowColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [`${colors[0]}1A`, `${colors[0]}66`],
    });

    return (
        <Animated.View style={[styles.wrapper, animated && { backgroundColor: glowColor }]}>
            <Surface style={styles.container} elevation={4}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{currentStep || 'Combinación Actual'}</Text>
                    </View>
                    {totalSteps && (
                        <View style={styles.dots}>
                            {Array.from({ length: totalSteps }).map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        index === currentStepIndex && styles.dotActive,
                                        {
                                            backgroundColor: index === currentStepIndex
                                                ? colors[0]
                                                : `${colors[0]}4D`,
                                        },
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.textContent}>
                        {combinationTimeLeft !== undefined && (
                            <Text style={styles.combinationTime}>
                                Tiempo combinación: {combinationTimeLeft}s
                            </Text>
                        )}
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.description}>{description}</Text>
                    </View>

                    {/* Image with demo button */}
                    {imageUrl && (
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: imageUrl }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.6)']}
                                style={styles.imageOverlay}
                            >
                                {onPlayDemo && (
                                    <IconButton
                                        icon="play-circle"
                                        iconColor="#ffffff"
                                        size={20}
                                        onPress={onPlayDemo}
                                        style={styles.demoButton}
                                    />
                                )}
                            </LinearGradient>
                        </View>
                    )}
                </View>
            </Surface>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: 16,
        padding: 2,
    },
    container: {
        backgroundColor: '#331919',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    badge: {
        backgroundColor: 'rgba(236, 19, 19, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ec1313',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    dots: {
        flexDirection: 'row',
        gap: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    dotActive: {
        width: 6,
        height: 6,
    },
    content: {
        flexDirection: 'row',
    },
    textContent: {
        flex: 1,
        padding: 20,
        gap: 8,
    },
    combinationTime: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ec1313',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#ffffff',
        textTransform: 'uppercase',
        fontStyle: 'italic',
        letterSpacing: 0.5,
    },
    description: {
        fontSize: 14,
        fontWeight: '500',
        color: '#c99292',
        lineHeight: 20,
    },
    imageContainer: {
        width: 120,
        height: 128,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: 8,
    },
    demoButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        margin: 0,
    },
});
