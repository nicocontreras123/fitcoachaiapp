import { useCallback } from 'react';

type Phase = 'preview' | 'warmup' | 'workout' | 'cooldown' | 'finished';

/**
 * Hook to manage all timer control handlers
 */
export const useTimerControls = ({
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
    totalRounds,
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
}: {
    userHasStarted: boolean;
    setUserHasStarted: (value: boolean) => void;
    isPreparing: boolean;
    isWorkout: boolean;
    isWarmup: boolean;
    isCooldown: boolean;
    isRest: boolean;
    warmupIndex: number;
    cooldownIndex: number;
    warmup: any[];
    cooldown: any[];
    round: number;
    totalRounds: number;
    toggleTimer: () => void;
    phaseTimer: any;
    skipToNextRound: () => void;
    transitionTo: (phase: Phase) => void;
    setWarmupIndex: (index: number) => void;
    setCooldownIndex: (index: number) => void;
    resetPhase: () => void;
    resetTimer: () => void;
    resetIndices: () => void;
    resetExerciseIndex: () => void;
    handleFinishWorkout: () => void;
    router: any;
    isSoundMuted: boolean;
    setIsSoundMuted: (value: boolean) => void;
}) => {
    const handlePlayPress = useCallback(() => {
        if (!userHasStarted) {
            setUserHasStarted(true);
        }

        if (isPreparing || isWorkout) {
            toggleTimer();
        } else {
            phaseTimer.toggle();
        }
    }, [userHasStarted, isPreparing, isWorkout, toggleTimer, phaseTimer, setUserHasStarted]);

    const handleSkipExercise = useCallback(() => {
        if (isPreparing) {
            if (!userHasStarted) {
                setUserHasStarted(true);
            }
            skipToNextRound();
        } else if (isWarmup) {
            if (warmupIndex < warmup.length - 1) {
                setWarmupIndex(warmupIndex + 1);
                phaseTimer.setTimeAndStart(warmup[warmupIndex + 1].duration);
            } else {
                transitionTo('workout');
                phaseTimer.pause();
            }
        } else if (isCooldown) {
            if (cooldownIndex < cooldown.length - 1) {
                setCooldownIndex(cooldownIndex + 1);
                phaseTimer.setTimeAndStart(cooldown[cooldownIndex + 1].duration);
            } else {
                transitionTo('finished');
                phaseTimer.pause();
            }
        } else if (isWorkout) {
            if (isRest && round >= totalRounds) {
                handleFinishWorkout();
            } else {
                skipToNextRound();
            }
        }
    }, [
        isPreparing,
        isWarmup,
        isCooldown,
        isWorkout,
        isRest,
        userHasStarted,
        warmupIndex,
        cooldownIndex,
        warmup,
        cooldown,
        round,
        totalRounds,
        skipToNextRound,
        phaseTimer,
        transitionTo,
        handleFinishWorkout,
        setUserHasStarted,
        setWarmupIndex,
        setCooldownIndex,
    ]);

    const handleResetRoutine = useCallback(() => {
        console.log('🔄 [RESET] handleResetRoutine called');

        // Reset all timers and indices
        resetTimer();
        phaseTimer.reset();
        resetIndices();
        setUserHasStarted(false);
        resetExerciseIndex();

        // Transition to preview screen (don't call resetPhase as it goes to 'idle')
        console.log('🔄 [RESET] Transitioning to preview...');
        transitionTo('preview');
        console.log('🔄 [RESET] Transition called');
    }, [resetTimer, phaseTimer, resetIndices, transitionTo, setUserHasStarted, resetExerciseIndex]);

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    const handleMuteToggle = useCallback(() => {
        setIsSoundMuted(!isSoundMuted);
    }, [isSoundMuted, setIsSoundMuted]);

    return {
        handlePlayPress,
        handleSkipExercise,
        handleResetRoutine,
        handleBack,
        handleMuteToggle,
    };
};
