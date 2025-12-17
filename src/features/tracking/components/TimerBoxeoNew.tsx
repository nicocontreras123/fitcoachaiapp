import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Animated, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBoxeoTimer } from '../hooks/useBoxeoTimer';
import { Text, IconButton } from 'react-native-paper';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';
import { useUserStore } from '@/features/profile/store/userStore';
import { useRouter } from 'expo-router';
import { formatTime } from '@/utils/timeUtils';
import { PhaseBadge, IntensityBar, ExerciseCard, BlurHeader } from '@/components/timer';

// New hooks
import { useTimerStateMachine } from '../hooks/useTimerStateMachine';
import { usePhaseTimer } from '../hooks/usePhaseTimer';
import { useAudioManager } from '../hooks/useAudioManager';

// Shared components
import {
    TimerDisplay,
    TimerControls,
} from './shared';

interface TimerBoxeoProps {
    sessionId?: string;
    onTimeUpdate?: (elapsedTime: number) => void;
    workout?: any;
    onComplete?: () => void;
}

export const TimerBoxeoNew: React.FC<TimerBoxeoProps> = ({
    sessionId = 'default',
    onTimeUpdate,
    workout: workoutProp,
    onComplete,
}) => {
    const { currentWorkout: storeWorkout } = useWorkoutStore();
    const { userData } = useUserStore();
    const router = useRouter();

    // Use workout from props or store
    const currentWorkout = workoutProp || storeWorkout;

    const warmup = (currentWorkout as any)?.warmup || [];
    const cooldown = (currentWorkout as any)?.cooldown || [];

    // Map BoxingWorkout rounds to TimerConfig structure
    const workoutRounds =
        currentWorkout && 'rounds' in currentWorkout
            ? (currentWorkout as any).rounds.map((r: any) => ({
                roundNumber: r.roundNumber,
                workTime: r.workTime,
                restTime: r.restTime,
                exercises: r.exercises,
            }))
            : undefined;

    // 🔍 DEBUG: Log complete workout structure







    const prepMinutes = userData?.prepTimeMinutes || 0;
    const prepSeconds = userData?.prepTimeSeconds !== undefined ? userData.prepTimeSeconds : 10;
    const prepTimeInSeconds = prepMinutes * 60 + prepSeconds;

    // State
    const [isSoundMuted, setIsSoundMuted] = useState(false);
    const [userHasStarted, setUserHasStarted] = useState(false);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

    // State machine for phase management
    const {
        phase,
        transitionTo,
        reset: resetPhase,
        isWarmup,
        isWorkout,
        isCooldown,
        isFinished,
    } = useTimerStateMachine('warmup');

    // Boxing timer configuration
    const timerConfig = useMemo(
        () => ({
            roundDuration: (currentWorkout as any)?.roundDuration || 180,
            restDuration: (currentWorkout as any)?.restDuration || 60,
            totalRounds: (currentWorkout as any)?.rounds?.length || 12,
            rounds: workoutRounds,
            prepTime: prepTimeInSeconds,
            timerSoundEnabled: !isSoundMuted && userData?.timerSoundEnabled !== false,
            voiceEnabled: userData?.voiceEnabled !== false,
            onWorkoutComplete: () => {

                handleFinishWorkout();
            },
        }),
        [currentWorkout, workoutRounds, prepTimeInSeconds, isSoundMuted, userData]
    );

    // Boxing timer hook
    const { state, toggleTimer, resetTimer, skipToNextRound } = useBoxeoTimer(sessionId, timerConfig);
    const { timeLeft, round, isRest, isActive, isPreparing } = state;

    // Debug: Check totalRounds

    // Audio manager (separate from boxing timer for warmup/cooldown)
    const audio = useAudioManager({
        voiceEnabled: userData?.voiceEnabled !== false,
        timerSoundEnabled: !isSoundMuted && userData?.timerSoundEnabled !== false,
    });

    // Phase timer for warmup/cooldown
    const [warmupIndex, setWarmupIndex] = useState(0);
    const [cooldownIndex, setCooldownIndex] = useState(0);

    const phaseTimer = usePhaseTimer({
        initialTime: 0,
        autoStart: false,
        onTick: (timeLeft) => {
            if (timeLeft <= 3 && timeLeft > 0) {
                audio.speakCountdown(timeLeft);
            }
        },
        onComplete: () => {
            handlePhaseComplete();
        },
    });

    // Animations
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const prevIsPreparing = useRef(true);

    // Current round info
    const currentRoundInfo = workoutRounds?.[round - 1];
    const exercises = currentRoundInfo?.exercises || [
        { name: 'JAB - CROSS - HOOK', description: 'Gira el pie delantero al lanzar el Hook.', duration: 60 },
    ];
    const currentExercise = exercises[currentExerciseIndex];

    // Calculate current exercise based on time
    useEffect(() => {
        if (!isPreparing && !isRest && isActive && exercises.length > 0) {
            const roundDuration = currentRoundInfo?.workTime || 180;
            const timeElapsed = roundDuration - timeLeft;

            let accumulatedTime = 0;
            let newExerciseIndex = 0;

            for (let i = 0; i < exercises.length; i++) {
                const exerciseDuration = exercises[i].duration || 30;
                if (timeElapsed >= accumulatedTime && timeElapsed < accumulatedTime + exerciseDuration) {
                    newExerciseIndex = i;
                    break;
                }
                accumulatedTime += exerciseDuration;

                if (i === exercises.length - 1) {
                    newExerciseIndex = i;
                }
            }

            if (newExerciseIndex !== currentExerciseIndex) {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    setCurrentExerciseIndex(newExerciseIndex);
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }).start();
                });
            }
        }
    }, [timeLeft, isPreparing, isRest, isActive, exercises, currentRoundInfo]);

    // Ref to track spoken countdowns
    const hasSpokenExerciseCountdownRef = useRef<Set<string>>(new Set());
    const lastAnnouncedExerciseRef = useRef<string>('');

    // Announce exercise name when it changes (only during workout, not warmup/cooldown)
    useEffect(() => {
        if (isWorkout && !isPreparing && !isRest && isActive && exercises[currentExerciseIndex]) {
            const currentExercise = exercises[currentExerciseIndex];
            const exerciseKey = `${round}-${currentExerciseIndex}`;

            // Only announce if we haven't announced this exercise yet
            if (lastAnnouncedExerciseRef.current !== exerciseKey) {
                lastAnnouncedExerciseRef.current = exerciseKey;
                audio.announceExercise(currentExercise.name);
            }
        }
    }, [currentExerciseIndex, isPreparing, isRest, isActive, isWorkout, round, exercises, audio]);

    // Countdown 3-2-1 before changing to next exercise (only during workout)
    useEffect(() => {
        if (isWorkout && !isPreparing && !isRest && isActive && exercises.length > 1) {
            const roundDuration = currentRoundInfo?.workTime || 180;
            const timeElapsed = roundDuration - timeLeft;

            // Calculate time until next exercise
            let accumulatedTime = 0;
            for (let i = 0; i <= currentExerciseIndex; i++) {
                accumulatedTime += exercises[i].duration || 30;
            }

            const timeUntilNextExercise = accumulatedTime - timeElapsed;

            // If 3, 2, or 1 seconds until next exercise (and not the last one)
            if (timeUntilNextExercise <= 3 && timeUntilNextExercise > 0 && currentExerciseIndex < exercises.length - 1) {
                const countdownKey = `${round}-${currentExerciseIndex}-${Math.floor(timeUntilNextExercise)}`;

                if (!hasSpokenExerciseCountdownRef.current.has(countdownKey)) {
                    hasSpokenExerciseCountdownRef.current.add(countdownKey);
                    audio.speakCountdown(Math.floor(timeUntilNextExercise));
                }
            }

            // Clear the set when moving away from countdown zone
            if (timeUntilNextExercise > 3) {
                hasSpokenExerciseCountdownRef.current.clear();
            }
        }
    }, [timeLeft, isPreparing, isRest, isActive, isWorkout, currentExerciseIndex, exercises, round, currentRoundInfo, audio]);

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

    // Handle preparation finish -> warmup
    useEffect(() => {
        // Only handle if we were preparing and now we're not, AND we're still in warmup phase
        if (prevIsPreparing.current && !isPreparing && isWarmup) {
            if (warmup.length > 0) {
                // Pause boxing timer and start warmup

                if (isActive) {
                    toggleTimer();
                }
                phaseTimer.setTime(warmup[0].duration);
                phaseTimer.start();
                audio.announceExercise(warmup[0].name);
            } else {
                // No warmup, go to workout - keep timer running!

                transitionTo('workout');
            }
        }
        prevIsPreparing.current = isPreparing;
    }, [isPreparing, isActive, isWarmup, warmup]);

    // Tick sound management - play during warmup and workout, stop during preparation and cooldown
    useEffect(() => {
        const shouldPlayTickSound = (isWarmup && phaseTimer.isActive) || (isWorkout && isActive && !isPreparing && !isRest);

        console.log('🎵 [TICK_SOUND] Phase-based control', {
            phase,
            isWarmup,
            isWorkout,
            phaseTimerActive: phaseTimer.isActive,
            boxingTimerActive: isActive,
            isPreparing,
            isRest,
            shouldPlay: shouldPlayTickSound,
        });

        if (shouldPlayTickSound) {

            audio.startTickSound();
        } else {

            audio.stopTickSound();
        }

        return () => {
            audio.stopTickSound();
        };
    }, [isWarmup, isWorkout, phaseTimer.isActive, isActive, isPreparing, isRest, audio]);

    // Reset exercise index on round change
    useEffect(() => {
        setCurrentExerciseIndex(0);
        fadeAnim.setValue(1);
        hasSpokenExerciseCountdownRef.current.clear();
    }, [round, isPreparing, isRest]);

    // Calculate total time remaining
    const totalTimeRemaining = useMemo(() => {
        const totalWorkoutTime = (currentWorkout?.totalDuration || 30) * 60;

        if (isPreparing) {
            return totalWorkoutTime + timeLeft;
        }

        if (isWarmup) {
            const warmupCompleted = warmup.slice(0, warmupIndex).reduce((sum: number, w: any) => sum + w.duration, 0);
            const currentWarmupElapsed = (warmup[warmupIndex]?.duration || 0) - phaseTimer.timeLeft;
            return totalWorkoutTime - warmupCompleted - currentWarmupElapsed;
        }

        if (isCooldown) {
            const currentCooldownElapsed = (cooldown[cooldownIndex]?.duration || 0) - phaseTimer.timeLeft;
            const cooldownRemaining = cooldown.slice(cooldownIndex).reduce((sum: number, c: any) => sum + c.duration, 0) - currentCooldownElapsed;
            return cooldownRemaining;
        }

        // Workout phase - subtract warmup time already spent
        const totalWarmupTime = warmup.reduce((sum: number, w: any) => sum + w.duration, 0);
        const roundsCompleted = (round - 1) * ((currentRoundInfo?.workTime || 180) + (currentRoundInfo?.restTime || 60));
        const currentRoundElapsed = isRest
            ? (currentRoundInfo?.workTime || 180) + ((currentRoundInfo?.restTime || 60) - timeLeft)
            : (currentRoundInfo?.workTime || 180) - timeLeft;

        return totalWorkoutTime - totalWarmupTime - roundsCompleted - currentRoundElapsed;
    }, [phase, isPreparing, isRest, round, timeLeft, warmupIndex, cooldownIndex, phaseTimer.timeLeft, currentWorkout, warmup, cooldown, currentRoundInfo, isWarmup, isCooldown]);

    // Handlers
    const handlePhaseComplete = () => {
        if (isWarmup) {
            if (warmupIndex < warmup.length - 1) {
                setWarmupIndex(warmupIndex + 1);
                phaseTimer.setTime(warmup[warmupIndex + 1].duration);
                audio.announceExercise(warmup[warmupIndex + 1].name);
            } else {
                // Warmup complete, start workout
                transitionTo('workout');
                phaseTimer.pause();
                if (!isActive) {
                    toggleTimer();
                }
            }
        } else if (isCooldown) {
            if (cooldownIndex < cooldown.length - 1) {
                setCooldownIndex(cooldownIndex + 1);
                phaseTimer.setTime(cooldown[cooldownIndex + 1].duration);
                audio.announceExercise(cooldown[cooldownIndex + 1].name);
            } else {
                // Cooldown complete
                transitionTo('finished');
                phaseTimer.pause();
                onComplete?.();
            }
        }
    };

    const handlePlayPress = () => {
        if (!userHasStarted) {
            setUserHasStarted(true);
        }

        if (isPreparing || isWorkout) {
            toggleTimer();
        } else {
            phaseTimer.toggle();
        }
    };

    const handleSkipExercise = () => {
        if (isPreparing) {
            if (!userHasStarted) {
                setUserHasStarted(true);
            }
            skipToNextRound();
        } else if (isWarmup) {
            if (warmupIndex < warmup.length - 1) {
                setWarmupIndex(warmupIndex + 1);
                phaseTimer.setTime(warmup[warmupIndex + 1].duration);
            } else {
                transitionTo('workout');
                phaseTimer.pause();
            }
        } else if (isCooldown) {
            if (cooldownIndex < cooldown.length - 1) {
                setCooldownIndex(cooldownIndex + 1);
                phaseTimer.setTime(cooldown[cooldownIndex + 1].duration);
            } else {
                transitionTo('finished');
                phaseTimer.pause();
            }
        } else if (isWorkout) {
            // Check if we're in the last round's rest period
            if (isRest && round >= state.totalRounds) {

                handleFinishWorkout();
            } else {
                skipToNextRound();
            }
        }
    };

    const handleResetRoutine = () => {
        resetPhase();
        resetTimer();
        phaseTimer.reset();
        setWarmupIndex(0);
        setCooldownIndex(0);
        setUserHasStarted(false);
        setCurrentExerciseIndex(0);
        transitionTo('warmup');
    };

    const handleBack = () => {
        router.back();
    };

    const handleMuteToggle = () => {
        setIsSoundMuted(!isSoundMuted);
    };

    const handleStartWorkout = () => {
        transitionTo('workout');
        phaseTimer.pause();
        if (!isActive) {
            toggleTimer();
        }
    };

    const handleFinishWorkout = () => {
        transitionTo('cooldown');
        if (isActive) {
            toggleTimer();
        }
        if (cooldown.length > 0) {
            setCooldownIndex(0);
            phaseTimer.setTime(cooldown[0].duration);
            audio.announceExercise(`Comienza enfriamiento: ${cooldown[0].name}`);
        }
    };

    // Phase colors
    const phaseColors = isPreparing
        ? { primary: '#ff8c00', gradient: ['#ff8c00', '#f59e0b'] as [string, string], bg: '#221010' }
        : isRest
            ? { primary: '#2dd4bf', gradient: ['#2dd4bf', '#0891b2'] as [string, string], bg: '#0f172a' }
            : { primary: '#ec1313', gradient: ['#ec1313', '#dc2626'] as [string, string], bg: '#221010' };

    // WARMUP PHASE
    if (isWarmup && (isPreparing || warmup.length > 0)) {
        const currentWarmupExercise = warmup[warmupIndex];
        const displayTime = isPreparing ? timeLeft : phaseTimer.timeLeft || warmup[0]?.duration || 300;
        const displayTitle = isPreparing ? 'PREPÁRATE' : (currentWarmupExercise?.name || 'Calentamiento').toUpperCase();

        return (
            <SafeAreaView style={[styles.container, { backgroundColor: phaseColors.bg }]} edges={['top', 'left', 'right']}>
                <StatusBar hidden />
                <BlurHeader
                    subtitle={isPreparing ? 'Preparación' : 'Calentamiento'}
                    onBack={handleBack}
                    onMuteToggle={handleMuteToggle}
                    isMuted={isSoundMuted}
                    topBadge={
                        <View style={styles.topTimeBadge}>
                            <Text style={styles.topTimeText}>Restante: {formatTime(totalTimeRemaining)}</Text>
                        </View>
                    }
                />

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.phaseHeader}>
                        <Text style={styles.phaseTitle}>{displayTitle}</Text>
                        {!isPreparing && (
                            <View style={styles.phaseBadgeContainer}>
                                <View style={styles.phaseDot} />
                                <Text style={styles.phaseBadgeText}>Preparación Física</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.timerSection}>
                        <TimerDisplay
                            timeLeft={displayTime}
                            label={isPreparing ? 'Comienza en' : 'Tiempo de calentamiento'}
                            color={phaseColors.primary}
                            size="large"
                            animated={true}
                            scaleAnim={scaleAnim}
                        />
                    </View>

                    {isPreparing ? (
                        <View style={styles.messageContainer}>
                            <Text style={styles.messageText}>El calentamiento comenzará pronto</Text>
                        </View>
                    ) : (
                        <>
                            <ExerciseCard
                                title={currentWarmupExercise?.name || 'Ejercicio de Calentamiento'}
                                description={currentWarmupExercise?.description || 'Prepara tu cuerpo para el entrenamiento'}
                                currentStep="Ejercicio Actual"
                                colors={['#ff8c00', '#f97316']}
                                animated={phaseTimer.isActive}
                            />

                            <View style={styles.nextExercise}>
                                <Text style={styles.nextLabel}>Siguiente Ejercicio</Text>
                                <Text style={styles.nextText}>
                                    {warmup[warmupIndex + 1]?.name || 'Entrenamiento Principal'}
                                </Text>
                            </View>
                        </>
                    )}
                </ScrollView>

                <View style={styles.controlsContainer}>
                    <TimerControls
                        isPlaying={isPreparing ? isActive : phaseTimer.isActive}
                        onPlayPause={handlePlayPress}
                        onSkip={handleSkipExercise}
                        onReset={handleResetRoutine}
                        playButtonColor={isPreparing ? phaseColors.primary : '#ec1313'}
                    />
                </View>
            </SafeAreaView>
        );
    }

    // COOLDOWN PHASE
    if (isCooldown && cooldown.length > 0) {
        const currentCooldownExercise = cooldown[cooldownIndex];

        return (
            <SafeAreaView style={[styles.container, { backgroundColor: '#0f172a' }]} edges={['top', 'left', 'right']}>
                <StatusBar hidden />
                <BlurHeader
                    subtitle="Fase Final"
                    onBack={handleBack}
                    onMuteToggle={handleMuteToggle}
                    isMuted={isSoundMuted}
                    topBadge={
                        <View style={styles.topTimeBadge}>
                            <Text style={styles.topTimeText}>Restante: {formatTime(totalTimeRemaining)}</Text>
                        </View>
                    }
                />

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.phaseHeader}>
                        <Text style={styles.phaseTitle}>COOL DOWN</Text>
                        <View style={styles.phaseBadgeContainer}>
                            <View style={[styles.phaseDot, { backgroundColor: '#2dd4bf' }]} />
                            <Text style={[styles.phaseBadgeText, { color: '#2dd4bf' }]}>Recuperación</Text>
                        </View>
                    </View>

                    <View style={styles.timerSection}>
                        <TimerDisplay
                            timeLeft={phaseTimer.timeLeft}
                            label="Tiempo Restante"
                            color="#2dd4bf"
                            size="large"
                            animated={true}
                            scaleAnim={scaleAnim}
                        />
                    </View>

                    {currentCooldownExercise && (
                        <ExerciseCard
                            title={currentCooldownExercise.name}
                            description={currentCooldownExercise.description}
                            currentStep="Estiramiento Actual"
                            colors={['#2dd4bf', '#0891b2']}
                            totalSteps={cooldown.length}
                            currentStepIndex={cooldownIndex}
                            animated={phaseTimer.isActive}
                        />
                    )}

                    <View style={styles.nextExercise}>
                        <Text style={[styles.nextLabel, { color: '#2dd4bf' }]}>Siguiente</Text>
                        <Text style={styles.nextText}>
                            {cooldown[cooldownIndex + 1]?.name || 'Finalizar'}
                        </Text>
                    </View>
                </ScrollView>

                <View style={styles.controlsContainer}>
                    <TimerControls
                        isPlaying={phaseTimer.isActive}
                        onPlayPause={() => phaseTimer.toggle()}
                        onSkip={handleSkipExercise}
                        onReset={handleResetRoutine}
                        playButtonColor="#2dd4bf"
                    />
                </View>
            </SafeAreaView>
        );
    }

    // FINISHED PHASE
    if (isFinished) {
        return (
            <SafeAreaView
                style={[styles.container, { backgroundColor: '#221010', justifyContent: 'center', alignItems: 'center' }]}
                edges={['top', 'left', 'right']}
            >
                <StatusBar hidden />
                <Text style={styles.finishedIcon}>🏆</Text>
                <Text style={styles.finishedTitle}>¡Entrenamiento Completado!</Text>
                <Text style={styles.finishedSubtitle}>Excelente trabajo 💪</Text>
                <IconButton
                    icon="refresh"
                    iconColor="#ec1313"
                    size={32}
                    onPress={handleResetRoutine}
                    style={styles.resetButton}
                />
            </SafeAreaView>
        );
    }

    // WORKOUT PHASE
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: phaseColors.bg }]} edges={['top', 'left', 'right']}>
            <StatusBar hidden />
            <BlurHeader
                subtitle="Entrenamiento"
                onBack={handleBack}
                onMuteToggle={handleMuteToggle}
                isMuted={isSoundMuted}
                topBadge={
                    <View style={styles.topTimeBadge}>
                        <Text style={styles.topTimeText}>Restante: {formatTime(totalTimeRemaining)}</Text>
                    </View>
                }
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Round badge */}
                {!isPreparing && !isRest && (
                    <View style={styles.roundBadgeContainer}>
                        <PhaseBadge
                            text={`ROUND ${round}/${state.totalRounds || 12}`}
                            colors={phaseColors.gradient}
                            animated={true}
                        />
                    </View>
                )}

                {/* Phase indicator */}
                <View style={styles.phaseHeader}>
                    <Text style={[styles.phaseTitle, { fontSize: 32 }]}>
                        {isPreparing ? 'PREPÁRATE' : isRest ? 'DESCANSO' : `ROUND ${round}`}
                        {!isPreparing && !isRest && <Text style={styles.phaseSubtitle}> / {state.totalRounds}</Text>}
                    </Text>
                    <View style={styles.phaseBadgeContainer}>
                        <View style={[styles.phaseDot, { backgroundColor: phaseColors.primary }]} />
                        <Text style={[styles.phaseBadgeText, { color: phaseColors.primary }]}>
                            {isPreparing ? 'Preparación' : isRest ? 'Recuperación' : 'Fase de Trabajo'}
                        </Text>
                    </View>
                </View>

                {/* Timer */}
                <View style={styles.timerSection}>
                    <TimerDisplay
                        timeLeft={timeLeft}
                        label="Tiempo Restante"
                        color={phaseColors.primary}
                        size="large"
                        animated={true}
                        scaleAnim={scaleAnim}
                    />
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
                            animated={isActive}
                            combinationTimeLeft={(() => {
                                const roundDuration = currentRoundInfo?.workTime || 180;
                                const timeElapsed = roundDuration - timeLeft;
                                let accumulatedTime = 0;
                                for (let i = 0; i < currentExerciseIndex; i++) {
                                    accumulatedTime += exercises[i].duration || 30;
                                }
                                const exerciseTimeElapsed = timeElapsed - accumulatedTime;
                                const exerciseDuration = currentExercise.duration || 30;
                                return Math.max(0, Math.ceil(exerciseDuration - exerciseTimeElapsed));
                            })()}
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
                    isPlaying={isActive}
                    onPlayPause={handlePlayPress}
                    onSkip={handleSkipExercise}
                    onReset={handleResetRoutine}
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
    phaseHeader: {
        alignItems: 'center',
        paddingVertical: 24,
        gap: 8,
    },
    phaseTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#ffffff',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    phaseSubtitle: {
        fontSize: 20,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    phaseBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
    },
    phaseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ff8c00',
    },
    phaseBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    timerSection: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    timerLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
    },
    timerLabelText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
        textTransform: 'uppercase',
        letterSpacing: 1,
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
        padding: 24,
        alignItems: 'center',
        gap: 8,
    },
    nextLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ff8c00',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    nextText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        textAlign: 'center',
    },
    roundBadgeContainer: {
        alignItems: 'center',
        paddingTop: 16,
    },
    controlsContainer: {
        padding: 16,
        paddingBottom: 32,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        gap: 16,
    },
    finishedIcon: {
        fontSize: 80,
    },
    finishedTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        marginTop: 24,
        textAlign: 'center',
    },
    finishedSubtitle: {
        fontSize: 18,
        color: '#9ca3af',
        marginTop: 12,
        textAlign: 'center',
    },
    resetButton: {
        marginTop: 24,
    },
});
