import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useWorkoutStore } from '@/features/workouts/store/useWorkoutStore';
import { useUserStore } from '@/features/profile/store/userStore';
import { useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCompleteWorkout } from '@/hooks/useCompleteWorkout';
import { PhaseTransition } from '@/components/transitions';

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
import { PrepTimerScreen } from './PrepTimerScreen';
import { WorkoutCompletedModal } from '@/features/history/WorkoutCompletedModal';

// Utils
import { calculateTotalTimeRemaining, getPhaseColors } from './boxing/utils';

// 🔧 DEBUG MODE - Set to true to reduce all timers for faster testing
const DEBUG_MODE = false; // ← Production mode
const DEBUG_EXERCISE_DURATION = 5; // seconds per exercise in debug mode
const DEBUG_PREP_TIME = 5; // seconds for preparation in debug mode

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

    // Routine preview data for PrepTimerScreen
    const routinePreview = useMemo(() => {
        // Flatten all exercises from all rounds
        const allWorkoutExercises: Array<{ name: string; description: string; rounds: string }> = [];

        workoutRounds?.forEach((round: any) => {
            round.exercises.forEach((exercise: any) => {
                allWorkoutExercises.push({
                    name: exercise.name,
                    description: exercise.description || `Round ${round.roundNumber} • ${exercise.duration || 30}s`,
                    rounds: `R${round.roundNumber}`,
                });
            });
        });

        console.log('📋 [PREP_TIMER] Total workout exercises:', allWorkoutExercises.length);
        console.log('📋 [PREP_TIMER] First 5 exercises:', allWorkoutExercises.slice(0, 5).map(e => e.name));

        return {
            warmup: warmup.map((ex: any) => ({
                name: ex.name,
                duration: ex.duration || 300,
                description: ex.description,
            })),
            workout: allWorkoutExercises,
            cooldown: cooldown.map((ex: any) => ({
                name: ex.name,
                duration: ex.duration || 180,
                description: ex.description,
            })),
            stats: {
                duration: `${currentWorkout?.totalDuration || 45} min`,
                intensity: currentWorkout?.intensity || 'Alta',
                rounds: `${workoutRounds?.length || 12}`,
            },
        };
    }, [warmup, workoutRounds, cooldown, currentWorkout]);

    // State
    const [isSoundMuted, setIsSoundMuted] = useState(false);
    const [userHasStarted, setUserHasStarted] = useState(false);
    const [showCompletedModal, setShowCompletedModal] = useState(false);
    const [totalElapsedTime, setTotalElapsedTime] = useState(0);

    // Debug: log elapsed time changes
    useEffect(() => {
        console.log('⏱️ [ELAPSED_TIME] Changed:', totalElapsedTime);
    }, [totalElapsedTime]);

    // Phase management
    const { phase, transitionTo, reset: resetPhase, isPreview, isWarmup, isWorkout, isCooldown, isFinished } = useTimerStateMachine('preview');

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
        isPostWarmupRest,
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

    // Track elapsed time - count all active time (warmup, workout, cooldown)
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;
        const shouldCount = (isWarmup && phaseTimer.isActive) || (isWorkout && isActive && !isPreparing) || (isCooldown && phaseTimer.isActive);

        console.log('⏱️ [TIME_TRACKER] State changed', {
            isWarmup,
            isWorkout,
            isCooldown,
            phaseTimerActive: phaseTimer.isActive,
            workoutActive: isActive,
            isPreparing,
            shouldCount,
            currentTime: totalElapsedTime,
        });

        if (shouldCount) {
            console.log('⏱️ [TIME_TRACKER] ✅ Starting interval timer');
            intervalId = setInterval(() => {
                setTotalElapsedTime(prev => {
                    const newTime = prev + 1;
                    if (newTime % 5 === 0) { // Log every 5 seconds
                        console.log('⏱️ [TIME_TRACKER] Tick:', newTime);
                    }
                    return newTime;
                });
            }, 1000);
        } else {
            console.log('⏱️ [TIME_TRACKER] ❌ Not counting');
        }

        return () => {
            if (intervalId) {
                console.log('⏱️ [TIME_TRACKER] Clearing interval');
                clearInterval(intervalId);
            }
        };
    }, [isWarmup, isWorkout, isCooldown, phaseTimer.isActive, isActive, isPreparing]);

    // Show modal when finished
    useEffect(() => {
        console.log('🎯 [MODAL] isFinished changed:', isFinished);
        if (isFinished) {
            console.log('🎯 [MODAL] Setting showCompletedModal to true');
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


    // Keep screen awake
    useKeepAwake();

    // Call onTimeUpdate callback
    useEffect(() => {
        if (onTimeUpdate && totalElapsedTime > 0) {
            onTimeUpdate(totalElapsedTime);
        }
    }, [totalElapsedTime, onTimeUpdate]);

    // Call onComplete callback when finished - DISABLED: Was causing navigation before modal shows
    // useEffect(() => {
    //     if (onComplete && isFinished) {
    //         console.log('🚨 [ON_COMPLETE] onComplete callback being called!', { onComplete: !!onComplete, isFinished });
    //         onComplete();
    //     }
    // }, [isFinished, onComplete]);

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
            console.log('💾 [SAVE] Workout saved successfully');
        },
        [completeWorkout, totalElapsedTime, currentWorkout, round]
    );

    // Render phase content
    const renderContent = () => {
        console.log('🎬 [RENDER] Current phase:', phase, '| isPreview:', isPreview, '| isWarmup:', isWarmup, '| isWorkout:', isWorkout);

        // PREVIEW PHASE
        if (isPreview) {
            return (
                <PrepTimerScreen
                    exerciseName={currentWorkout?.title || 'Entrenamiento de Boxeo'}
                    timerType="boxing"
                    routinePreview={routinePreview}
                    onStart={() => {
                        if (warmup.length > 0) {
                            transitionTo('warmup');
                            if (prepTimeInSeconds > 0) {
                                toggleTimer(); // Start prep timer
                            }
                        } else {
                            transitionTo('workout');
                            toggleTimer();
                        }
                    }}
                    onBack={() => router.back()}
                    onEdit={() => router.push('/(tabs)/rutinas')}
                />
            );
        }

        if (isWarmup && (isPreparing || warmup.length > 0)) {
            const nextEx = isPreparing
                ? warmup[0]?.name
                : isPostWarmupRest
                    ? 'Entrenamiento Principal'
                    : warmup[warmupIndex + 1]?.name || 'Entrenamiento Principal';

            return (
                <WarmupPhase
                    isPreparing={isPreparing}
                    isPostWarmupRest={isPostWarmupRest}
                    displayTime={isPreparing ? timeLeft : phaseTimer.timeLeft || warmup[0]?.duration || 300}
                    currentExercise={warmup[warmupIndex]}
                    nextExercise={nextEx}
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
                    onComplete={() => {
                        console.log('🏁 [COMPLETE] Complete button pressed');
                        console.log('🏁 [COMPLETE] Current state:', {
                            phase,
                            cooldownIndex,
                            totalCooldown: cooldown.length,
                            isFinished,
                            showCompletedModal,
                        });
                        transitionTo('finished');
                        phaseTimer.pause();
                        console.log('🏁 [COMPLETE] Transitioned to finished, timer paused');
                    }}
                />
            );
        }

        if (isFinished) {
            console.log('🏆 [FINISHED_PHASE] Workout finished, showing last cooldown state');
            // Show the last cooldown exercise frozen while modal is displayed
            const currentCooldownExercise = cooldown[cooldownIndex];
            const nextCooldownExercise = cooldownIndex < cooldown.length - 1 ? cooldown[cooldownIndex + 1].name : '';

            return (
                <CooldownPhase
                    currentExercise={currentCooldownExercise}
                    nextExercise={nextCooldownExercise}
                    currentIndex={cooldownIndex}
                    totalExercises={cooldown.length}
                    timeLeft={phaseTimer.timeLeft}
                    totalTimeRemaining={0}
                    isPlaying={false}
                    isMuted={isSoundMuted}
                    onBack={handleBack}
                    onMuteToggle={handleMuteToggle}
                    onPlayPause={() => { }}
                    onSkip={() => { }}
                    showSkipButton={false}
                    onReset={handleResetRoutine}
                    onComplete={() => { }}
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
            <PhaseTransition
                phaseKey={phase}
                type="zoom"
                duration={500}
            >
                {renderContent()}
            </PhaseTransition>
            {!isFinished && !isPreview && <SpotifyButton position="top-right" />}

            {/* Skip Confirmation Dialog */}
            <SkipConfirmationDialog
                visible={showSkipConfirmation}
                message={confirmationMessage}
                skipsRemaining={skipsRemaining}
                onConfirm={executeSkip}
                onCancel={cancelSkip}
            />

            {/* Workout Completed Modal - Outside phase rendering to persist */}
            <WorkoutCompletedModal
                visible={showCompletedModal}
                duration={totalElapsedTime}
                calories={Math.round((totalElapsedTime / 60) * 12)}
                onSave={async (notes) => {
                    await handleSaveWorkout(notes);
                    setShowCompletedModal(false);
                    console.log('💾 [MODAL] Workout saved, navigating to dashboard');
                    router.replace('/(tabs)');
                }}
                onSkip={() => {
                    console.log('⏭️ [MODAL] Skip save pressed, navigating to dashboard');
                    setShowCompletedModal(false);
                    router.replace('/(tabs)');
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
