import { View, StyleSheet, Animated } from 'react-native';
import { Text, Surface, Button, IconButton } from 'react-native-paper';
import { COLORS, FONT_WEIGHT, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

// Instrucciones dinámicas que se mostrarán con fade
const BOXING_INSTRUCTIONS = [
    { label: 'COMBO ACTUAL', text: 'JAB + CROSS + UPPERCUT', color: COLORS.boxing.accent },
    { label: 'SIGUIENTE COMBO', text: 'HOOK + HOOK + CROSS', color: '#F59E0B' },
    { label: 'DEFENSA', text: 'SLIP + ROLL + COUNTER', color: '#10B981' },
    { label: 'POTENCIA', text: 'CROSS + HOOK + UPPERCUT', color: '#EF4444' },
    { label: 'VELOCIDAD', text: 'JAB + JAB + JAB + CROSS', color: '#3B82F6' },
];

export function BoxingTimer() {
    const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Efecto de fade constante para las instrucciones
    useEffect(() => {
        const fadeInterval = setInterval(() => {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }).start(() => {
                // Cambiar instrucción
                setCurrentInstructionIndex((prev) => (prev + 1) % BOXING_INSTRUCTIONS.length);

                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }).start();
            });
        }, 4000); // Cambiar cada 4 segundos

        return () => clearInterval(fadeInterval);
    }, [fadeAnim]);

    // Efecto de pulso constante para el badge del round
    useEffect(() => {
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulseAnimation.start();

        return () => pulseAnimation.stop();
    }, [pulseAnim]);

    // Efecto de glow para la tarjeta de instrucciones
    useEffect(() => {
        const glowAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: false,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: false,
                }),
            ])
        );
        glowAnimation.start();

        return () => glowAnimation.stop();
    }, [glowAnim]);

    // Efecto de escala para el texto del timer
    useEffect(() => {
        const scaleAnimation = Animated.loop(
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
        scaleAnimation.start();

        return () => scaleAnimation.stop();
    }, [scaleAnim]);

    const currentInstruction = BOXING_INSTRUCTIONS[currentInstructionIndex];

    const glowColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.2)'],
    });

    return (
        <Surface style={styles.container}>
            {/* Header / Round Info */}
            <View style={styles.header}>
                <Animated.View style={[styles.badge, { transform: [{ scale: pulseAnim }] }]}>
                    <LinearGradient
                        colors={[COLORS.boxing.primary, '#DC2626']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.badgeGradient}
                    >
                        <Text style={styles.badgeText}>ROUND 3 / 12</Text>
                    </LinearGradient>
                </Animated.View>
                <View style={styles.voiceIndicator}>
                    <IconButton icon="waveform" iconColor={COLORS.white} size={20} />
                    <Text style={styles.voiceText}>AI COACH ACTIVO</Text>
                </View>
            </View>

            {/* Main Timer con efecto de escala */}
            <View style={styles.timerContainer}>
                <Animated.Text style={[styles.timerText, { transform: [{ scale: scaleAnim }] }]}>
                    02:45
                </Animated.Text>
                <Text style={styles.timerSubtext}>TRABAJO INTENSO</Text>
            </View>

            {/* Dynamic Instruction con efectos fade y glow */}
            <Animated.View style={{ opacity: fadeAnim }}>
                <Animated.View style={[styles.instructionCardWrapper, { backgroundColor: glowColor }]}>
                    <Surface style={[styles.instructionCard, { borderLeftColor: currentInstruction.color }]}>
                        <LinearGradient
                            colors={['rgba(45, 55, 72, 0.95)', 'rgba(30, 41, 59, 0.95)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.instructionGradient}
                        >
                            <Text style={styles.instructionLabel}>{currentInstruction.label}</Text>
                            <Text style={[styles.instructionText, { color: currentInstruction.color }]}>
                                {currentInstruction.text}
                            </Text>

                            {/* Indicador visual de progreso */}
                            <View style={styles.progressDots}>
                                {BOXING_INSTRUCTIONS.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.dot,
                                            index === currentInstructionIndex && styles.activeDot,
                                            { backgroundColor: index === currentInstructionIndex ? currentInstruction.color : COLORS.gray[600] }
                                        ]}
                                    />
                                ))}
                            </View>
                        </LinearGradient>
                    </Surface>
                </Animated.View>
            </Animated.View>

            {/* Controls */}
            <View style={styles.controls}>
                <Button
                    mode="contained"
                    style={styles.pauseButton}
                    contentStyle={{ height: 56 }}
                    labelStyle={styles.buttonLabel}
                    icon="pause"
                >
                    PAUSAR
                </Button>
            </View>
        </Surface>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.boxing.secondary, // Dark Slate Background
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        elevation: 4,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    badge: {
        borderRadius: BORDER_RADIUS.sm,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: COLORS.boxing.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    badgeGradient: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
    },
    badgeText: {
        color: COLORS.white,
        fontWeight: FONT_WEIGHT.bold,
        fontSize: 12,
    },
    voiceIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: BORDER_RADIUS.full,
        paddingRight: SPACING.md,
    },
    voiceText: {
        color: COLORS.accent, // Amber for active state
        fontSize: 10,
        fontWeight: FONT_WEIGHT.bold,
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    timerText: {
        fontSize: 80,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.white, // High contrast
        lineHeight: 88,
        textShadowColor: COLORS.boxing.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    timerSubtext: {
        color: COLORS.accent, // Energy Yellow
        fontSize: 16,
        fontWeight: FONT_WEIGHT.medium,
        letterSpacing: 2,
        marginTop: -8,
    },
    instructionCardWrapper: {
        borderRadius: BORDER_RADIUS.lg,
        padding: 3,
        marginBottom: SPACING.xl,
    },
    instructionCard: {
        backgroundColor: 'transparent',
        borderRadius: BORDER_RADIUS.lg,
        borderLeftWidth: 4,
        overflow: 'hidden',
        elevation: 8,
    },
    instructionGradient: {
        padding: SPACING.lg,
    },
    instructionLabel: {
        color: COLORS.gray[400],
        fontSize: 12,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    instructionText: {
        fontSize: 28,
        fontWeight: FONT_WEIGHT.bold,
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    progressDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.md,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    activeDot: {
        width: 24,
        height: 8,
        borderRadius: 4,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    pauseButton: {
        backgroundColor: COLORS.gray[700],
        borderRadius: BORDER_RADIUS.full,
        width: '100%',
    },
    buttonLabel: {
        fontSize: 18,
        fontWeight: FONT_WEIGHT.bold,
        letterSpacing: 1,
    },
});
