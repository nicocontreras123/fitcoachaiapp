/**
 * Calculate total time remaining in the workout
 */
export const calculateTotalTimeRemaining = ({
    phase,
    isPreparing,
    isRest,
    timeLeft,
    warmup,
    warmupIndex,
    cooldown,
    cooldownIndex,
    phaseTimerTimeLeft,
    currentWorkout,
    currentRoundInfo,
    round,
}: {
    phase: string;
    isPreparing: boolean;
    isRest: boolean;
    timeLeft: number;
    warmup: any[];
    warmupIndex: number;
    cooldown: any[];
    cooldownIndex: number;
    phaseTimerTimeLeft: number;
    currentWorkout: any;
    currentRoundInfo: any;
    round: number;
}): number => {
    const totalWorkoutTime = (currentWorkout?.totalDuration || 30) * 60;

    if (isPreparing) {
        return totalWorkoutTime + timeLeft;
    }

    if (phase === 'warmup') {
        const warmupCompleted = warmup.slice(0, warmupIndex).reduce((sum: number, w: any) => sum + w.duration, 0);
        const currentWarmupElapsed = (warmup[warmupIndex]?.duration || 0) - phaseTimerTimeLeft;
        return totalWorkoutTime - warmupCompleted - currentWarmupElapsed;
    }

    if (phase === 'cooldown') {
        const currentCooldownElapsed = (cooldown[cooldownIndex]?.duration || 0) - phaseTimerTimeLeft;
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
};

/**
 * Get phase colors based on current state
 */
export const getPhaseColors = (isPreparing: boolean, isRest: boolean) => {
    if (isPreparing) {
        return {
            primary: '#ff8c00',
            gradient: ['#ff8c00', '#f59e0b'] as [string, string],
            bg: '#221010',
        };
    }
    if (isRest) {
        return {
            primary: '#2dd4bf',
            gradient: ['#2dd4bf', '#0891b2'] as [string, string],
            bg: '#0f172a',
        };
    }
    return {
        primary: '#ec1313',
        gradient: ['#ec1313', '#dc2626'] as [string, string],
        bg: '#221010',
    };
};

/**
 * Calculate current exercise index based on elapsed time
 */
export const calculateCurrentExerciseIndex = (
    timeElapsed: number,
    exercises: any[]
): number => {
    let accumulatedTime = 0;
    let exerciseIndex = 0;

    for (let i = 0; i < exercises.length; i++) {
        const exerciseDuration = exercises[i].duration || 30;
        if (timeElapsed >= accumulatedTime && timeElapsed < accumulatedTime + exerciseDuration) {
            exerciseIndex = i;
            break;
        }
        accumulatedTime += exerciseDuration;

        if (i === exercises.length - 1) {
            exerciseIndex = i;
        }
    }

    return exerciseIndex;
};
