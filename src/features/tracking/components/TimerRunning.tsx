import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRunningIntervalTimer, RunningInterval } from '../hooks/useRunningIntervalTimer';
import { useGpsTracker } from '../hooks/useGpsTracker';
import { Text, IconButton, Surface } from 'react-native-paper';
import { useUserStore } from '@/features/profile/store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { SuccessAlert } from '@/components/common';
import { useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { WorkoutCompletedModal } from '@/features/history/WorkoutCompletedModal';
import { useCompleteWorkout } from '@/hooks/useCompleteWorkout';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TimerRunningProps {
    intervals: RunningInterval[];
    onTimeUpdate?: (elapsedTime: number) => void;
    onComplete?: () => void;
}

export const TimerRunning: React.FC<TimerRunningProps> = ({ intervals, onTimeUpdate, onComplete }) => {
    const { userData } = useUserStore();
    const router = useRouter();
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [showCompletedModal, setShowCompletedModal] = useState(false);
    const { completeWorkout } = useCompleteWorkout();

    // GPS Tracker for real distance and movement detection
    const {
        distance: gpsDistance,
        isTracking,
        startTracking,
        stopTracking,
        currentSpeed,
        isMoving
    } = useGpsTracker();

    // Calculate prep time from user settings
    const prepMinutes = userData?.prepTimeMinutes || 0;
    const prepSeconds = userData?.prepTimeSeconds !== undefined ? userData.prepTimeSeconds : 10;
    const prepTimeInSeconds = (prepMinutes * 60) + prepSeconds;

    const {
        state,
        toggleTimer,
        resetTimer,
        skipToNextInterval,
        getCurrentInterval,
        isPreparing,
        isFinished
    } = useRunningIntervalTimer({
        intervals,
        prepTime: prepTimeInSeconds,
        timerSoundEnabled: userData?.timerSoundEnabled
    });

    const { timeLeft, currentInterval, isActive } = state;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const [wasAutoPaused, setWasAutoPaused] = useState(false);

    // Calculate elapsed time and metrics
    const [elapsedTime, setElapsedTime] = useState(0);
    const [calories, setCalories] = useState(0);

    // Auto-pause when user stops moving
    useEffect(() => {
        if (!isPreparing() && isActive && !isMoving) {
            toggleTimer(); // Pause the timer
            setWasAutoPaused(true);
        } else if (!isPreparing() && !isActive && isMoving && wasAutoPaused) {
            toggleTimer(); // Resume the timer
            setWasAutoPaused(false);
        }
    }, [isMoving, isActive, isPreparing]);

    // Calculate metrics in real-time
    useEffect(() => {
        let elapsed = 0;

        if (isPreparing()) {
            elapsed = prepTimeInSeconds - timeLeft;
        } else if (currentInterval > 0) {
            // Add all completed intervals
            for (let i = 0; i < currentInterval - 1; i++) {
                elapsed += intervals[i].duration;
            }
            // Add current interval progress
            if (currentInterval <= intervals.length) {
                const currentDuration = intervals[currentInterval - 1].duration;
                const currentElapsed = currentDuration - timeLeft;
                elapsed += currentElapsed;
            }
        }

        setElapsedTime(elapsed);

        if (onTimeUpdate) {
            onTimeUpdate(elapsed);
        }
    }, [currentInterval, timeLeft, intervals, prepTimeInSeconds]);

    // Calculate calories based on GPS distance
    useEffect(() => {
        const userWeight = userData?.weight || 70;
        const cals = gpsDistance * userWeight * 0.75;
        setCalories(cals);
    }, [gpsDistance, userData]);

    // Start/stop GPS tracking based on timer state
    useEffect(() => {
        if (isActive && !isPreparing() && !isTracking) {
            startTracking();
        } else if (!isActive && isTracking) {
            stopTracking();
        }
    }, [isActive, isPreparing]);

    // Stop GPS when finished
    useEffect(() => {
        if (isFinished() && isTracking) {

            stopTracking();
        }
    }, [currentInterval, isActive]);

    // Helper function to parse pace string to minutes per km
    // Commented out for now - may be useful for future features
    // const parsePace = (paceStr: string): number => {
    //     try {
    //         // Parse "5:30 min/km" to 5.5
    //         const match = paceStr.match(/(\d+):(\d+)/);
    //         if (match) {
    //             const mins = parseInt(match[1]);
    //             const secs = parseInt(match[2]);
    //             return mins + (secs / 60);
    //         }
    //     } catch (e) {
    //         console.error('Error parsing pace:', e);
    //     }
    //     return 5.5; // Default pace
    // };

    // Calculate average pace - Commented out, now showing current speed instead
    // const averagePace = useMemo(() => {
    //     if (gpsDistance <= 0) return '0:00 min/km';
    //     const paceMinPerKm = (elapsedTime / 60) / gpsDistance;
    //     const mins = Math.floor(paceMinPerKm);
    //     const secs = Math.round((paceMinPerKm - mins) * 60);
    //     return `${mins}:${secs.toString().padStart(2, '0')} min/km`;
    // }, [elapsedTime, gpsDistance]);

    // Handle completion
    useEffect(() => {
        if (isFinished() && !showCompletedModal) {
            setShowCompletedModal(true);
            if (onComplete) {
                onComplete();
            }
        }
    }, [currentInterval, isActive]);

    // Mantener la pantalla activa durante entrenamientos
    useKeepAwake();

    // Pulse animation for timer
    useEffect(() => {
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );

        if (isActive && !isPreparing()) {
            pulseAnimation.start();
        } else {
            pulseAnimation.stop();
            pulseAnim.setValue(1);
        }

        return () => pulseAnimation.stop();
    }, [isActive, currentInterval]);

    // Glow animation for interval card
    useEffect(() => {
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

        if (!isPreparing()) {
            glowAnimation.start();
        } else {
            glowAnimation.stop();
            glowAnim.setValue(0);
        }

        return () => glowAnimation.stop();
    }, [currentInterval]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const currentIntervalData = getCurrentInterval();

    // Get colors based on interval type
    const getIntervalColors = (type: RunningInterval['type']) => {
        const colorMap = {
            'warm-up': { primary: '#fbbf24', secondary: '#f59e0b', icon: '🔥' },
            'run': { primary: '#3b82f6', secondary: '#2563eb', icon: '🏃' },
            'sprint': { primary: '#ef4444', secondary: '#dc2626', icon: '⚡' },
            'recovery': { primary: '#10b981', secondary: '#059669', icon: '💨' },
            'cool-down': { primary: '#8b5cf6', secondary: '#7c3aed', icon: '🧘' }
        };
        return colorMap[type] || colorMap.run;
    };

    const colors = currentIntervalData
        ? getIntervalColors(currentIntervalData.type)
        : { primary: '#fbbf24', secondary: '#f59e0b', icon: '⚡' };

    const timerColor = isPreparing() ? '#fbbf24' : colors.primary;
    const gradientColors = isPreparing()
        ? ['#fbbf24', '#f59e0b'] as const
        : [colors.primary, colors.secondary] as const;

    const glowColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [`rgba(${isPreparing() ? '251, 191, 36' : '59, 130, 246'}, 0.1)`, `rgba(${isPreparing() ? '251, 191, 36' : '59, 130, 246'}, 0.4)`],
    });

    // Render finished state
    if (isFinished()) {
        return (
            <Surface style={styles.container} elevation={3}>
                <View style={styles.finishedContainer}>
                    <Text style={styles.finishedIcon}>🏆</Text>
                    <Text variant="headlineMedium" style={styles.finishedTitle}>
                        ¡Carrera Completada!
                    </Text>
                    <Text variant="bodyLarge" style={styles.finishedSubtitle}>
                        Excelente trabajo 💪
                    </Text>
                    <IconButton
                        icon="refresh"
                        iconColor={colors.primary}
                        size={32}
                        onPress={resetTimer}
                        style={styles.resetButton}
                    />

                    <WorkoutCompletedModal
                        visible={showCompletedModal}
                        duration={elapsedTime}
                        calories={Math.round((elapsedTime / 60) * 10)}
                        onSave={async (notes: string) => {
                            await completeWorkout(
                                'running',
                                elapsedTime,
                                {
                                    title: 'Running Interval Training',
                                    difficulty: 'intermediate',
                                    distance: gpsDistance,
                                    intervals: intervals.map(i => ({
                                        type: i.type,
                                        duration: i.duration,
                                        pace: i.pace,
                                    })),
                                    totalDuration: intervals.reduce((sum, i) => sum + i.duration, 0),
                                },
                                notes
                            );

                            // Invalidar caché del dashboard para forzar refresh
                            await AsyncStorage.removeItem('@dashboard_stats');

                            setShowCompletedModal(false);
                            setShowSuccessAlert(true);
                        }}
                        onSkip={() => {
                            setShowCompletedModal(false);
                            setShowSuccessAlert(true);
                        }}
                    />

                    <SuccessAlert
                        visible={showSuccessAlert}
                        title="¡Excelente!"
                        message="Has completado tu rutina de running.\n¡Sigue así!"
                        onClose={() => setShowSuccessAlert(false)}
                        onContinue={() => {
                            setShowSuccessAlert(false);
                            router.back();
                        }}
                    />
                </View>
            </Surface>
        );
    }

    // Calculate circular progress
    const calculateProgress = () => {
        if (isPreparing()) {
            return (prepTimeInSeconds - timeLeft) / prepTimeInSeconds;
        }
        if (currentIntervalData) {
            return (currentIntervalData.duration - timeLeft) / currentIntervalData.duration;
        }
        return 0;
    };

    const progress = calculateProgress();
    const size = 240;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress * circumference);

    return (
        <Surface style={[styles.container, { backgroundColor: 'rgba(20, 20, 20, 0.95)' }]} elevation={3}>
            {/* Interval Badge */}
            {!isPreparing() && currentIntervalData && (
                <View style={styles.intervalBadge}>
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.badgeGradient}
                    >
                        <Text style={styles.badgeText}>
                            {colors.icon} INTERVALO {currentInterval}/{intervals.length}
                        </Text>
                    </LinearGradient>
                </View>
            )}

            {/* Circular Timer */}
            <View style={styles.circularTimerContainer}>
                <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                    {/* Background circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#374151"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    {/* Progress circle */}
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={timerColor}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </Svg>
                <View style={styles.circularTimerContent}>
                    <Animated.Text
                        style={[
                            styles.timerText,
                            {
                                color: timerColor,
                                transform: [{ scale: pulseAnim }]
                            }
                        ]}
                    >
                        {formatTime(timeLeft)}
                    </Animated.Text>
                    <Text style={styles.timerLabel}>
                        {isPreparing() ? 'PREPÁRATE' : currentIntervalData?.type.toUpperCase().replace('-', ' ')}
                    </Text>
                </View>
            </View>

            {/* Real-time Metrics - Horizontal Compact */}
            {!isPreparing() && (
                <View style={styles.metricsContainer}>
                    {/* Auto-pause indicator */}
                    {!isMoving && (
                        <Surface style={[styles.autoPauseBanner, { backgroundColor: '#f59e0b' }]} elevation={4}>
                            <Text style={styles.autoPauseText}>⏸️ AUTO-PAUSA</Text>
                        </Surface>
                    )}

                    {/* Compact horizontal metrics */}
                    <Surface style={styles.compactMetricsCard} elevation={3}>
                        <View style={styles.metricsRow}>
                            {/* Distance */}
                            <View style={styles.compactMetric}>
                                <Text style={styles.compactMetricIcon}>📍</Text>
                                <View>
                                    <Text style={styles.compactMetricValue}>{gpsDistance.toFixed(2)}</Text>
                                    <Text style={styles.compactMetricLabel}>km</Text>
                                </View>
                            </View>

                            <View style={styles.metricDivider} />

                            {/* Time */}
                            <View style={styles.compactMetric}>
                                <Text style={styles.compactMetricIcon}>⏱️</Text>
                                <View>
                                    <Text style={styles.compactMetricValue}>{formatTime(elapsedTime)}</Text>
                                    <Text style={styles.compactMetricLabel}>tiempo</Text>
                                </View>
                            </View>

                            <View style={styles.metricDivider} />

                            {/* Speed */}
                            <View style={styles.compactMetric}>
                                <Text style={styles.compactMetricIcon}>🏃</Text>
                                <View>
                                    <Text style={styles.compactMetricValue}>{currentSpeed.toFixed(1)}</Text>
                                    <Text style={styles.compactMetricLabel}>km/h</Text>
                                </View>
                            </View>

                            <View style={styles.metricDivider} />

                            {/* Calories */}
                            <View style={styles.compactMetric}>
                                <Text style={styles.compactMetricIcon}>🔥</Text>
                                <View>
                                    <Text style={styles.compactMetricValue}>{Math.round(calories)}</Text>
                                    <Text style={styles.compactMetricLabel}>kcal</Text>
                                </View>
                            </View>
                        </View>
                    </Surface>
                </View>
            )}

            {/* Interval Details */}
            {!isPreparing() && currentIntervalData && (
                <Animated.View style={[styles.intervalCard, { backgroundColor: glowColor }]}>
                    <Surface style={styles.intervalCardInner} elevation={4}>
                        <LinearGradient
                            colors={['rgba(30, 30, 30, 0.95)', 'rgba(20, 20, 20, 0.95)'] as const}
                            style={styles.intervalCardGradient}
                        >
                            <Text style={styles.intervalDescription}>
                                {currentIntervalData.description}
                            </Text>
                            {currentIntervalData.pace && (
                                <View style={styles.paceContainer}>
                                    <Text style={styles.paceLabel}>Ritmo objetivo:</Text>
                                    <Text style={[styles.paceValue, { color: colors.primary }]}>
                                        {currentIntervalData.pace}
                                    </Text>
                                </View>
                            )}
                        </LinearGradient>
                    </Surface>
                </Animated.View>
            )}

            {/* Preparation Message */}
            {isPreparing() && (
                <View style={styles.messageContainer}>
                    <Text style={styles.messageText}>
                        Prepárate para comenzar
                    </Text>
                </View>
            )}

            {/* Progress Dots */}
            {!isPreparing() && (
                <View style={styles.progressDots}>
                    {intervals.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: index < currentInterval - 1
                                        ? colors.primary
                                        : index === currentInterval - 1
                                            ? colors.primary
                                            : '#4b5563',
                                    width: index === currentInterval - 1 ? 24 : 8,
                                }
                            ]}
                        />
                    ))}
                </View>
            )}

            {/* Controls */}
            <View style={styles.controls}>
                <IconButton
                    icon={isActive ? "pause" : "play"}
                    iconColor="white"
                    size={48}
                    onPress={toggleTimer}
                    style={[styles.controlBtn, isActive && styles.controlBtnActive]}
                />

                <IconButton
                    icon="skip-next"
                    iconColor="white"
                    size={48}
                    onPress={skipToNextInterval}
                    style={styles.controlBtn}
                    disabled={currentInterval >= intervals.length}
                />

                <IconButton
                    icon="refresh"
                    iconColor="white"
                    size={40}
                    onPress={resetTimer}
                    style={[styles.controlBtn, styles.resetBtn]}
                />
            </View>

            {/* Control Labels */}
            <View style={styles.controlLabels}>
                <Text style={styles.controlLabel}>{isActive ? 'Pausar' : 'Iniciar'}</Text>
                <Text style={styles.controlLabel}>Siguiente</Text>
                <Text style={styles.controlLabel}>Reiniciar</Text>
            </View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 32,
        borderRadius: 24,
        width: '100%',
        alignItems: 'center',
    },
    intervalBadge: {
        marginBottom: 24,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 6,
    },
    badgeGradient: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    badgeText: {
        color: '#ffffff',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    circularTimerContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    circularTimerContent: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerText: {
        fontSize: 56,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    timerLabel: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 4,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    intervalCard: {
        borderRadius: 16,
        padding: 3,
        marginBottom: 24,
        width: '100%',
    },
    intervalCardInner: {
        backgroundColor: 'transparent',
        borderRadius: 16,
        overflow: 'hidden',
    },
    intervalCardGradient: {
        padding: 20,
        alignItems: 'center',
    },
    intervalDescription: {
        color: '#ffffff',
        fontSize: 18,
        textAlign: 'center',
        fontWeight: '600',
        marginBottom: 12,
    },
    paceContainer: {
        alignItems: 'center',
    },
    paceLabel: {
        color: '#9ca3af',
        fontSize: 12,
        marginBottom: 4,
    },
    paceValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    messageContainer: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    messageText: {
        color: '#d1d5db',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
    progressDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 8,
        flexWrap: 'wrap',
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 8,
        marginBottom: 8,
    },
    controlBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        margin: 0,
    },
    controlBtnActive: {
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
    },
    resetBtn: {
        backgroundColor: '#f59e0b',
    },
    controlLabels: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        width: '100%',
        marginTop: 4,
    },
    controlLabel: {
        fontSize: 11,
        color: '#9ca3af',
        textAlign: 'center',
        width: 80,
    },
    finishedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    finishedIcon: {
        fontSize: 80,
    },
    finishedTitle: {
        color: '#ffffff',
        fontWeight: 'bold',
        marginTop: 24,
        textAlign: 'center',
    },
    finishedSubtitle: {
        color: '#9ca3af',
        marginTop: 12,
        textAlign: 'center',
    },
    resetButton: {
        marginTop: 24,
    },
    metricsContainer: {
        width: '100%',
        marginBottom: 20,
    },
    compactMetricsCard: {
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        borderRadius: 16,
        padding: 12,
        width: '100%',
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    compactMetric: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    compactMetricIcon: {
        fontSize: 18,
    },
    compactMetricValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        fontVariant: ['tabular-nums'],
    },
    compactMetricLabel: {
        fontSize: 9,
        color: '#9ca3af',
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    metricDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#4b5563',
    },
    autoPauseBanner: {
        width: '100%',
        padding: 8,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    autoPauseText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
