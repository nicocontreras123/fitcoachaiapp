import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';
import { useUserStore } from '@/features/profile/store/userStore';
import { useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCompleteWorkout } from '@/hooks/useCompleteWorkout';

// Hooks
import { useBoxeoTimer } from '../hooks/useBoxeoTimer';
import { useTimerStateMachine } from '../hooks/useTimerStateMachine';
import { usePhaseTimer } from '../hooks/usePhaseTimer';
import { useAudioManager } from '../hooks/useAudioManager';
import {
    useBoxingPhaseHandlers,
    useWorkoutExercises,
    useTimerAnimations,
    useTimerControls,
    useWarmupInitialization,
    useSmartSkip,
} from './boxing/hooks';

// Components
import { SpotifyButton } from './shared';
import { WarmupPhase, WorkoutPhase, CooldownPhase, FinishedPhase } from './boxing/phases';
import { SkipConfirmationDialog } from './boxing/components';

// Utils
import { calculateTotalTimeRemaining, getPhaseColors } from './boxing/utils';

// 🔧 DEBUG MODE - Set to true to reduce all timers for faster testing
const DEBUG_MODE = false; // ← Production mode
const DEBUG_EXERCISE_DURATION = 10; // seconds per exercise in debug mode
const DEBUG_PREP_TIME = 3; // seconds for preparation in debug mode

interface TimerBoxeoProps {
    sessionId?: string;
    workout?: any;
    onTimeUpdate?: (elapsedTime: number) => void;
    onComplete?: () => void;
}

export const TimerBoxeoNew: React.FC<TimerBoxeoProps> = ({
    sessionId = 'default',
    workout: workoutProp,
    onTimeUpdate,
    onComplete,
}) => {
    const { currentWorkout: storeWorkout } = useWorkoutStore();
    const { userData } = useUserStore();
    const router = useRouter();
    const { completeWorkout } = useCompleteWorkout();

    // Workout data
    const currentWorkout = workoutProp || storeWorkout;

    // Apply debug mode to warmup/cooldown durations
    const warmup = DEBUG_MODE
        ? ((currentWorkout as any)?.warmup || []).map((ex: any) => ({ ...ex, duration: DEBUG_EXERCISE_DURATION }))
        : (currentWorkout as any)?.warmup || [];

    const cooldown = DEBUG_MODE
        ? ((currentWorkout as any)?.cooldown || []).map((ex: any) => ({ ...ex, duration: DEBUG_EXERCISE_DURATION }))
        : (currentWorkout as any)?.cooldown || [];

    const workoutRounds = useMemo(
        () =>
            currentWorkout && 'rounds' in currentWorkout
                ? (currentWorkout as any).rounds.map((r: any) => ({
                    roundNumber: r.roundNumber,
                    workTime: DEBUG_MODE ? DEBUG_EXERCISE_DURATION * 3 : r.workTime, // 3 exercises in debug
                    restTime: DEBUG_MODE ? 5 : r.restTime,
                    exercises: DEBUG_MODE
                        ? r.exercises.map((ex: any) => ({ ...ex, duration: DEBUG_EXERCISE_DURATION }))
                        : r.exercises,
                }))
                : undefined,
        [currentWorkout]
    );

    const prepMinutes = userData?.prepTimeMinutes || 0;
    const prepSeconds = userData?.prepTimeSeconds !== undefined ? userData.prepTimeSeconds : 10;
    const prepTimeInSeconds = DEBUG_MODE ? DEBUG_PREP_TIME : (prepMinutes * 60 + prepSeconds);

    // State
    const [isSoundMuted, setIsSoundMuted] = useState(false);
    const [userHasStarted, setUserHasStarted] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [showCompletedModal, setShowCompletedModal] = useState(false);
    const [totalElapsedTime, setTotalElapsedTime] = useState(0);

    // Phase management
    const { phase, transitionTo, reset: resetPhase, isWarmup, isWorkout, isCooldown, isFinished } = useTimerStateMachine('warmup');

    // Phase transition animation
    const [phaseTransitionAnim] = useState(new Animated.Value(1));
    const previousPhaseRef = useRef(phase);

    // Audio
    const audio = useAudioManager({
        voiceEnabled: userData?.voiceEnabled !== false,
        timerSoundEnabled: !isSoundMuted && userData?.timerSoundEnabled !== false,
    });

    // Create ref for finish workout handler (defined later)
    const finishWorkoutHandlerRef = useRef<(() => void) | undefined>(undefined);

    // Boxing timer
    const { state, toggleTimer, resetTimer, skipToNextRound } = useBoxeoTimer(sessionId, {
        roundDuration: (currentWorkout as any)?.roundDuration || 180,
        restDuration: (currentWorkout as any)?.restDuration || 60,
        totalRounds: (currentWorkout as any)?.rounds?.length || 12,
        rounds: workoutRounds,
        prepTime: prepTimeInSeconds,
        timerSoundEnabled: !isSoundMuted && userData?.timerSoundEnabled !== false,
        voiceEnabled: userData?.voiceEnabled !== false,
        onWorkoutComplete: () => {

            finishWorkoutHandlerRef.current?.();
        },
    });
    const { timeLeft, round, isRest, isActive, isPreparing } = state;

    // Phase timer
    const phaseCompleteHandlerRef = useRef<(() => void) | undefined>(undefined);
    const phaseTimer = usePhaseTimer({
        initialTime: 0,
        autoStart: false,
        onTick: (timeLeft) => {
            if (timeLeft <= 3 && timeLeft > 0) {
                audio.speakCountdown(timeLeft);
            }
        },
        onComplete: () => {
            phaseCompleteHandlerRef.current?.();
        },
    });

    // Phase handlers
    const {
        warmupIndex,
        cooldownIndex,
        setWarmupIndex,
        setCooldownIndex,
        handlePhaseComplete,
        resetIndices,
    } = useBoxingPhaseHandlers({
        phaseTimer,
        warmup,
        cooldown,
        isActive,
        toggleTimer,
        transitionTo,
        audio,
    });
    phaseCompleteHandlerRef.current = handlePhaseComplete;

    // Finish workout handler
    const handleFinishWorkout = useCallback(() => {

        transitionTo('cooldown');
        if (isActive) {

            toggleTimer();
        }
        if (cooldown.length > 0) {
            setCooldownIndex(0);
            phaseTimer.setTimeAndStart(cooldown[0].duration);
            audio.announceExercise(`Comienza enfriamiento: ${cooldown[0].name}`);
        } else {

            transitionTo('finished');
        }
    }, [cooldown, audio, transitionTo, isActive, toggleTimer, phaseTimer, setCooldownIndex]);

    // Assign to ref so onWorkoutComplete can call it
    finishWorkoutHandlerRef.current = handleFinishWorkout;

    // Round info
    const currentRoundInfo = workoutRounds?.[round - 1];
    const exercises = currentRoundInfo?.exercises || [
        { name: 'JAB - CROSS - HOOK', description: 'Gira el pie delantero al lanzar el Hook.', duration: 60 },
    ];

    // Workout exercises hook
    const { currentExerciseIndex, fadeAnim, resetExerciseIndex } = useWorkoutExercises({
        isPreparing,
        isRest,
        isActive,
        isWorkout,
        timeLeft,
        round,
        exercises,
        currentRoundInfo,
        audio,
    });

    // Animations
    useTimerAnimations({ isActive, isPreparing });

    // Warmup initialization
    useWarmupInitialization({
        isPreparing,
        isWarmup,
        warmup,
        isActive,
        toggleTimer,
        setWarmupIndex,
        phaseTimer,
        audio,
        transitionTo,
    });

    // Timer controls
    const { handlePlayPress, handleSkipExercise, handleResetRoutine, handleBack, handleMuteToggle } = useTimerControls({
        userHasStarted,
        setUserHasStarted,
        isPreparing,
        isWorkout,
        isWarmup,
        isCooldown,
        isRest,
        warmupIndex,
        cooldownIndex,
        warmup,
        cooldown,
        round,
        totalRounds: state.totalRounds,
        toggleTimer,
        phaseTimer,
        skipToNextRound,
        transitionTo,
        setWarmupIndex,
        setCooldownIndex,
        resetPhase,
        resetTimer,
        resetIndices,
        resetExerciseIndex,
        handleFinishWorkout,
        router,
        isSoundMuted,
        setIsSoundMuted,
    });

    // Smart skip system
    const {
        canSkip,
        showSkipConfirmation,
        skipsRemaining,
        confirmationMessage,
        handleSkipPress,
        executeSkip,
        cancelSkip,
        resetSkipCounter,
    } = useSmartSkip({
        currentPhase: (isWarmup ? 'warmup' : isWorkout ? 'workout' : isCooldown ? 'cooldown' : 'finished') as 'warmup' | 'workout' | 'cooldown' | 'finished',
        isPreparing,
        isRest,
        onSkip: handleSkipExercise,
        isDebugMode: DEBUG_MODE,
    });

    // Reset skip counter when workout resets
    useEffect(() => {
        if (!userHasStarted) {
            resetSkipCounter();
        }
    }, [userHasStarted, resetSkipCounter]);

    // Track elapsed time
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;
        if (isActive && !isPreparing && isWorkout) {
            intervalId = setInterval(() => setTotalElapsedTime(prev => prev + 1), 1000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isActive, isPreparing, isWorkout]);

    // Show modal when finished
    useEffect(() => {

        if (isFinished) {

            setShowCompletedModal(true);
        }
    }, [isFinished]);

    // Tick sound management
    useEffect(() => {
        const shouldPlayTickSound = (isWarmup && phaseTimer.isActive) || (isWorkout && isActive && !isPreparing && !isRest);
        if (shouldPlayTickSound) {
            audio.startTickSound();
        } else {
            audio.stopTickSound();
        }
        return () => audio.stopTickSound();
    }, [isWarmup, isWorkout, phaseTimer.isActive, isActive, isPreparing, isRest, audio]);

    // Phase transition animation
    useEffect(() => {
        if (previousPhaseRef.current !== phase) {
            // Fade out
            Animated.timing(phaseTransitionAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                // Update phase reference
                previousPhaseRef.current = phase;

                // Fade in
                Animated.timing(phaseTransitionAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }).start();
            });
        }
    }, [phase, phaseTransitionAnim]);

    // Keep screen awake
    useKeepAwake();

    // Call onTimeUpdate callback
    useEffect(() => {
        if (onTimeUpdate && totalElapsedTime > 0) {
            onTimeUpdate(totalElapsedTime);
        }
    }, [totalElapsedTime, onTimeUpdate]);

    // Call onComplete callback when finished
    useEffect(() => {
        if (onComplete && isFinished) {
            onComplete();
        }
    }, [isFinished, onComplete]);

    // Calculate total time remaining
    const totalTimeRemaining = useMemo(() => {
        return calculateTotalTimeRemaining({
            phase,
            isPreparing,
            isRest,
            timeLeft,
            warmup,
            warmupIndex,
            cooldown,
            cooldownIndex,
            phaseTimerTimeLeft: phaseTimer.timeLeft,
            currentWorkout,
            currentRoundInfo,
            round,
        });
    }, [phase, isPreparing, isRest, round, timeLeft, warmupIndex, cooldownIndex, phaseTimer.timeLeft, currentWorkout, warmup, cooldown, currentRoundInfo]);

    // Phase colors
    const phaseColors = getPhaseColors(isPreparing, isRest);

    // Save workout handler
    const handleSaveWorkout = useCallback(
        async (notes: string) => {
            await completeWorkout('boxing', totalElapsedTime, {
                title: (currentWorkout as any)?.title || 'Entrenamiento de Boxeo',
                difficulty: (currentWorkout as any)?.difficulty || 'intermediate',
                rounds: (currentWorkout as any)?.rounds?.length || round,
                roundDuration: (currentWorkout as any)?.roundDuration || 180,
                restDuration: (currentWorkout as any)?.restDuration || 60,
            }, notes);
            await AsyncStorage.removeItem('@dashboard_stats');
            setShowCompletedModal(false);
            setShowSuccessAlert(true);
        },
        [completeWorkout, totalElapsedTime, currentWorkout, round]
    );

    // Render phase content
    const renderContent = () => {
        if (isWarmup && (isPreparing || warmup.length > 0)) {
            return (
                <WarmupPhase
                    isPreparing={isPreparing}
                    displayTime={isPreparing ? timeLeft : phaseTimer.timeLeft || warmup[0]?.duration || 300}

                    currentExercise={warmup[warmupIndex]}
                    nextExercise={warmup[warmupIndex + 1]?.name || 'Entrenamiento Principal'}
                    phaseColors={phaseColors}
                    totalTimeRemaining={totalTimeRemaining}
                    isPlaying={isPreparing ? isActive : phaseTimer.isActive}
                    isMuted={isSoundMuted}
                    onBack={handleBack}
                    onMuteToggle={handleMuteToggle}
                    onPlayPause={handlePlayPress}
                    onSkip={handleSkipPress}
                    showSkipButton={canSkip}
                    onReset={handleResetRoutine}
                />
            );
        }

        if (isCooldown && cooldown.length > 0) {
            return (
                <CooldownPhase
                    currentExercise={cooldown[cooldownIndex]}
                    nextExercise={cooldown[cooldownIndex + 1]?.name || 'Finalizar'}
                    currentIndex={cooldownIndex}
                    totalExercises={cooldown.length}
                    timeLeft={phaseTimer.timeLeft}
                    totalTimeRemaining={totalTimeRemaining}
                    isPlaying={phaseTimer.isActive}
                    isMuted={isSoundMuted}
                    onBack={handleBack}
                    onMuteToggle={handleMuteToggle}
                    onPlayPause={() => phaseTimer.toggle()}
                    onSkip={handleSkipPress}
                    showSkipButton={canSkip}
                    onReset={handleResetRoutine}
                />
            );
        }

        if (isFinished) {
            return (
                <FinishedPhase
                    showCompletedModal={showCompletedModal}
                    showSuccessAlert={showSuccessAlert}
                    totalElapsedTime={totalElapsedTime}
                    onSaveWorkout={handleSaveWorkout}
                    onSkipSave={() => {
                        setShowCompletedModal(false);
                        setShowSuccessAlert(true);
                    }}
                    onCloseSuccess={() => setShowSuccessAlert(false)}
                    onContinue={() => {
                        setShowSuccessAlert(false);
                        router.back();
                    }}
                    onReset={handleResetRoutine}
                />
            );
        }

        // Workout phase
        const currentExercise = exercises[currentExerciseIndex];
        const combinationTimeLeft = (() => {
            const roundDuration = currentRoundInfo?.workTime || 180;
            const timeElapsed = roundDuration - timeLeft;
            let accumulatedTime = 0;
            for (let i = 0; i < currentExerciseIndex; i++) {
                accumulatedTime += exercises[i].duration || 30;
            }
            const exerciseTimeElapsed = timeElapsed - accumulatedTime;
            const exerciseDuration = currentExercise.duration || 30;
            return Math.max(0, Math.ceil(exerciseDuration - exerciseTimeElapsed));
        })();

        return (
            <WorkoutPhase
                isPreparing={isPreparing}
                isRest={isRest}
                timeLeft={timeLeft}
                round={round}
                totalRounds={state.totalRounds || 12}
                currentExercise={currentExercise}
                exercises={exercises}
                currentExerciseIndex={currentExerciseIndex}
                combinationTimeLeft={combinationTimeLeft}
                phaseColors={phaseColors}
                totalTimeRemaining={totalTimeRemaining}
                isPlaying={isActive}
                fadeAnim={fadeAnim}
                isMuted={isSoundMuted}
                onBack={handleBack}
                onMuteToggle={handleMuteToggle}
                onPlayPause={handlePlayPress}
                onSkip={handleSkipPress}
                showSkipButton={canSkip}
                onReset={handleResetRoutine}
            />
        );
    };

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.phaseContainer,
                    {
                        opacity: phaseTransitionAnim,
                        transform: [{
                            scale: phaseTransitionAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.95, 1]
                            })
                        }]
                    }
                ]}
            >
                {renderContent()}
            </Animated.View>
            {!isFinished && <SpotifyButton position="top-right" />}

            {/* Skip Confirmation Dialog */}
            <SkipConfirmationDialog
                visible={showSkipConfirmation}
                message={confirmationMessage}
                skipsRemaining={skipsRemaining}
                onConfirm={executeSkip}
                onCancel={cancelSkip}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    phaseContainer: {
        flex: 1,
    },
});
