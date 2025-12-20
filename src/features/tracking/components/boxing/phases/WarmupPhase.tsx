import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatTime } from '@/utils/timeUtils';
import { ExerciseCard, BlurHeader } from '@/components/timer';
import { TimerControls } from '../../shared';

interface WarmupPhaseProps {
    isPreparing: boolean;
    isPostWarmupRest?: boolean;
    displayTime: number;
    currentExercise: any;
    nextExercise: string;
    phaseColors: {
        primary: string;
        gradient: [string, string];
        bg: string;
    };
    totalTimeRemaining: number;
    isPlaying: boolean;
    isMuted: boolean;
    onBack: () => void;
    onMuteToggle: () => void;
    onPlayPause: () => void;
    onSkip: () => void;
    onReset: () => void;
    showSkipButton?: boolean;
}

export const WarmupPhase: React.FC<WarmupPhaseProps> = ({
    isPreparing,
    isPostWarmupRest,
    displayTime,
    currentExercise,
    nextExercise,
    phaseColors,
    totalTimeRemaining,
    isPlaying,
    isMuted,
    onBack,
    onMuteToggle,
    onPlayPause,
    onSkip,
    onReset,
    showSkipButton = true,
}) => {
    const getTitle = () => {
        if (isPreparing) return 'Preparación';
        if (isPostWarmupRest) return 'Descanso';
        return 'Calentamiento';
    };

    const getPhaseTitle = () => {
        if (isPreparing) return 'PREPÁRATE';
        if (isPostWarmupRest) return 'DESCANSO';
        return currentExercise?.name?.toUpperCase() || 'CALENTAMIENTO';
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: phaseColors.bg }]} edges={['top', 'left', 'right']}>
            <BlurHeader
                title={getTitle()}
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
                {/* Phase Title */}
                <View style={styles.phaseIndicator}>
                    <Text style={styles.phaseTitle}>{getPhaseTitle()}</Text>
                    {!isPreparing && !isPostWarmupRest && (
                        <View style={styles.phaseBadge}>
                            <View style={[styles.pulseDot, { backgroundColor: '#ff8c00' }]} />
                            <Text style={[styles.phaseLabel, { color: '#ff8c00' }]}>Preparación Física</Text>
                        </View>
                    )}
                </View>

                {/* Timer Section - New Design */}
                <View style={styles.timerSection}>
                    {/* Background glow effect */}
                    <View style={[styles.timerGlow, { backgroundColor: 'rgba(255, 140, 0, 0.1)' }]} />

                    <View style={styles.timerContent}>
                        <Text style={styles.timerDisplay}>
                            {formatTime(displayTime)}
                        </Text>
                        <View style={styles.timerLabel}>
                            <Text style={styles.timerLabelIcon}>⏱</Text>
                            <Text style={styles.timerLabelText}>
                                {isPreparing ? 'Comienza en' : 'Tiempo Restante'}
                            </Text>
                        </View>
                    </View>
                </View>

                {isPreparing ? (
                    <View style={styles.messageContainer}>
                        <Text style={styles.messageLabel}>Primer Ejercicio</Text>
                        <Text style={styles.messageText}>{currentExercise?.name || 'Calentamiento'}</Text>
                        <Text style={styles.messageSubtext}>
                            {currentExercise?.description || 'Prepara tu cuerpo para el entrenamiento'}
                        </Text>
                    </View>
                ) : (
                    <>
                        <ExerciseCard
                            title={currentExercise?.name || 'Ejercicio de Calentamiento'}
                            description={currentExercise?.description || 'Prepara tu cuerpo para el entrenamiento'}
                            currentStep="Ejercicio Actual"
                            colors={['#ff8c00', '#f97316']}
                            animated={isPlaying}
                        />

                        <View style={styles.nextExercise}>
                            <Text style={styles.nextLabel}>Siguiente Ejercicio</Text>
                            <Text style={styles.nextText}>{nextExercise}</Text>
                        </View>
                    </>
                )}
            </ScrollView>

            <View style={styles.controlsContainer}>
                <TimerControls
                    isPlaying={isPlaying}
                    onPlayPause={onPlayPause}
                    onSkip={onSkip}
                    onReset={onReset}
                    showSkipButton={showSkipButton}
                    playButtonColor={isPreparing ? phaseColors.primary : '#ec1313'}
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
    // New Phase Indicator Styles
    phaseIndicator: {
        alignItems: 'center',
        paddingTop: 16,
        paddingBottom: 8,
    },
    phaseTitle: {
        fontSize: 40,
        fontFamily: 'Lexend_800ExtraBold',
        color: '#ffffff',
        letterSpacing: -1.2,
        lineHeight: 40,
        textAlign: 'center',
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
        fontFamily: 'Lexend_800ExtraBold',
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
        gap: 8,
    },
    messageLabel: {
        fontSize: 12,
        fontFamily: 'Lexend_700Bold',
        color: '#ff8c00',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    messageText: {
        fontSize: 24,
        fontFamily: 'Lexend_700Bold',
        color: '#ffffff',
        textAlign: 'center',
        lineHeight: 32,
    },
    messageSubtext: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 4,
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
        color: '#ff8c00',
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
