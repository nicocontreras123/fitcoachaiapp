import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatTime } from '@/utils/timeUtils';
import { ExerciseCard, BlurHeader, IntensityBar } from '@/components/timer';
import { TimerControls } from '../../shared';

interface WorkoutPhaseProps {
    isPreparing: boolean;
    isRest: boolean;
    timeLeft: number;
    round: number;
    totalRounds: number;
    currentExercise: any;
    exercises: any[];
    currentExerciseIndex: number;
    combinationTimeLeft: number;
    phaseColors: {
        primary: string;
        gradient: [string, string];
        bg: string;
    };
    totalTimeRemaining: number;
    isPlaying: boolean;
    fadeAnim: any;
    isMuted: boolean;
    onBack: () => void;
    onMuteToggle: () => void;
    onPlayPause: () => void;
    onSkip: () => void;
    onReset: () => void;
    showSkipButton?: boolean;
}

export const WorkoutPhase: React.FC<WorkoutPhaseProps> = ({
    isPreparing,
    isRest,
    timeLeft,
    round,
    totalRounds,
    currentExercise,
    exercises,
    currentExerciseIndex,
    combinationTimeLeft,
    phaseColors,
    totalTimeRemaining,
    isPlaying,
    fadeAnim,
    isMuted,
    onBack,
    onMuteToggle,
    onPlayPause,
    onSkip,
    onReset,
    showSkipButton = true,
}) => {
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: phaseColors.bg }]} edges={['top', 'left', 'right']}>
            <StatusBar hidden />

            <BlurHeader
                title="Entrenamiento"
                onBack={onBack}
                onMuteToggle={onMuteToggle}
                isMuted={isMuted}
                topBadge={
                    <View style={styles.topTimeBadge}>
                        <Text style={styles.topTimeText}>🕐 Total: {formatTime(totalTimeRemaining)}</Text>
                    </View>
                }
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Round Indicator - New Design */}
                <View style={styles.roundIndicator}>
                    {!isPreparing && !isRest ? (
                        <View style={styles.roundTitleContainer}>
                            <Text style={styles.roundTitle}>ROUND {round} </Text>
                            <Text style={styles.roundSubtitle}>/ {totalRounds}</Text>
                        </View>
                    ) : (
                        <Text style={styles.roundTitle}>
                            {isPreparing ? 'PREPÁRATE' : 'DESCANSO'}
                        </Text>
                    )}
                    <View style={styles.phaseBadge}>
                        <View style={[styles.pulseDot, { backgroundColor: phaseColors.primary }]} />
                        <Text style={[styles.phaseLabel, { color: phaseColors.primary }]}>
                            {isPreparing ? 'Preparación' : isRest ? 'Recuperación' : 'Fase de Trabajo'}
                        </Text>
                    </View>
                </View>

                {/* Timer Section - New Design */}
                <View style={styles.timerSection}>
                    {/* Background glow effect */}
                    <View style={[styles.timerGlow, { backgroundColor: `${phaseColors.primary}10` }]} />

                    <View style={styles.timerContent}>
                        <Text style={styles.timerDisplay}>
                            {formatTime(timeLeft)}
                        </Text>
                        <View style={styles.timerLabel}>
                            <Text style={styles.timerLabelIcon}>⏱</Text>
                            <Text style={styles.timerLabelText}>Tiempo Restante</Text>
                        </View>
                    </View>
                </View>

                {/* Exercise card */}
                {!isPreparing && !isRest && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <ExerciseCard
                            title={currentExercise.name}
                            description={currentExercise.description}
                            currentStep="Combinación Actual"
                            totalSteps={exercises.length}
                            currentStepIndex={currentExerciseIndex}
                            colors={phaseColors.gradient}
                            animated={isPlaying}
                            combinationTimeLeft={combinationTimeLeft}
                        />
                    </Animated.View>
                )}

                {(isPreparing || isRest) && (
                    <View style={styles.messageContainer}>
                        <Text style={styles.messageText}>
                            {isPreparing ? 'El entrenamiento comenzará pronto' : 'Respira profundo y recupérate'}
                        </Text>
                    </View>
                )}

                {!isPreparing && !isRest && (
                    <View style={styles.nextExercise}>
                        <Text style={[styles.nextLabel, { color: phaseColors.primary }]}>Siguiente</Text>
                        <Text style={styles.nextText}>
                            {exercises[currentExerciseIndex + 1]?.name || 'Fin del Round'}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Controls */}
            <View style={styles.controlsContainer}>
                <IntensityBar
                    intensity={isPreparing ? 0 : isRest ? 30 : 78}
                    label="Intensidad"
                    color={phaseColors.primary}
                />

                <TimerControls
                    isPlaying={isPlaying}
                    onPlayPause={onPlayPause}
                    onSkip={onSkip}
                    onReset={onReset}
                    showSkipButton={showSkipButton}
                    playButtonColor={phaseColors.primary}
                />
            </View>
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    topTimeBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    topTimeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    // New Round Indicator Styles
    roundIndicator: {
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 8,
    },
    roundTitleContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    roundTitle: {
        fontSize: 40,
        fontFamily: 'Lexend_800ExtraBold', // font-black
        color: '#ffffff',
        letterSpacing: -1.2,
        lineHeight: 40,
        textAlign: 'center',
    },
    roundSubtitle: {
        fontSize: 24, // text-2xl
        fontFamily: 'Lexend_700Bold', // font-bold
        fontStyle: 'normal', // not-italic
        color: 'rgba(255, 255, 255, 0.3)', // text-white/30
        letterSpacing: -0.5,
        lineHeight: 28,
    },
    phaseBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    phaseLabel: {
        fontSize: 14,
        fontFamily: 'Lexend_700Bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    // New Timer Styles
    timerSection: {
        position: 'relative',
        width: '100%',
        paddingVertical: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerGlow: {
        position: 'absolute',
        width: '75%',
        height: '75%',
        borderRadius: 9999,
        opacity: 0.5,
    },
    timerContent: {
        zIndex: 10,
        alignItems: 'center',
    },
    timerDisplay: {
        fontSize: 100,
        fontFamily: 'Lexend_800ExtraBold', // Closest to font-black (900)
        color: '#ffffff',
        letterSpacing: -4,
        lineHeight: 85,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 12,
    },
    timerLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    timerLabelIcon: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    timerLabelText: {
        fontSize: 12,
        fontFamily: 'Lexend_500Medium',
        color: 'rgba(255, 255, 255, 0.6)',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    messageContainer: {
        padding: 24,
        alignItems: 'center',
    },
    messageText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        lineHeight: 24,
    },
    nextExercise: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginTop: 8,
        opacity: 0.6,
    },
    nextLabel: {
        fontSize: 12,
        fontFamily: 'Lexend_700Bold',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    nextText: {
        fontSize: 14,
        fontFamily: 'Lexend_600SemiBold',
        color: '#ffffff',
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
    controlsContainer: {
        padding: 16,
        paddingBottom: 32,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        gap: 16,
    },
});
