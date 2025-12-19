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

    // Dynamic background color (very dark version of primary color)
    // If primary is orange (#ff8c00), bg could be roughly #331A00
    // If primary is red (#ec1313), bg could be roughly #330404
    // For now, let us use a generic dark overlay or try to mix it
    const dynamicBgColor = colors[0] === '#ff8c00' ? '#331a00' : '#330505';

    return (
        <Animated.View style={[styles.wrapper, animated && { backgroundColor: glowColor }]}>
            <Surface style={[styles.container, { backgroundColor: dynamicBgColor }]} elevation={4}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={[styles.badge, { backgroundColor: `${colors[0]}1A` }]}>
                        <Text style={[styles.badgeText, { color: colors[0] }]}>{currentStep || 'Ejercicio Actual'}</Text>
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
                            <Text style={[styles.combinationTime, { color: colors[0] }]}>
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
        // backgroundColor: '#331919', // Dynamic now
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
        // borderBottomWidth: 1, // Removed border
        // borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    badge: {
        // backgroundColor: dynamic
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontFamily: 'Lexend_700Bold',
        // color: dynamic
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
        paddingTop: 4, // Reduced padding top since header is closer
        gap: 8,
    },
    combinationTime: {
        fontSize: 12,
        fontFamily: 'Lexend_700Bold',
        // color: dynamic
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: 24, // Reduced from 30
        fontFamily: 'Lexend_800ExtraBold', // font-black
        color: '#ffffff',
        textTransform: 'uppercase',
        // fontStyle: 'italic', // Removed to preserve ExtraBold weight
        letterSpacing: -0.6, // tracking-tight
        lineHeight: 28, // leading-tight
    },
    description: {
        fontSize: 14,
        fontFamily: 'Lexend_500Medium',
        color: 'rgba(255, 255, 255, 0.7)', // white/70
        lineHeight: 20,
    },
    imageContainer: {
        width: 120,
        height: 140, // Slightly taller
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
