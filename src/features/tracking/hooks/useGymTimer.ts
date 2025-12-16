import { useReducer, useCallback, useMemo } from 'react';
import { Exercise, PhaseExercise } from '../types/timer.types';

/**
 * Gym Timer Hook
 * Manages gym-specific workout logic (sets, reps, exercises)
 * Uses reducer pattern for predictable state management
 */

interface GymTimerState {
    currentExerciseIndex: number;
    currentSet: number;
    completedSets: Record<number, number>;
    isResting: boolean;
    restTimeLeft: number;
    warmupIndex: number;
    cooldownIndex: number;
}

type GymTimerAction =
    | { type: 'COMPLETE_SET' }
    | { type: 'SKIP_REST' }
    | { type: 'NEXT_EXERCISE' }
    | { type: 'PREVIOUS_EXERCISE' }
    | { type: 'START_REST'; payload: number }
    | { type: 'TICK_REST' }
    | { type: 'NEXT_WARMUP' }
    | { type: 'NEXT_COOLDOWN' }
    | { type: 'RESET' };

interface GymTimerConfig {
    exercises: Exercise[];
    warmup?: PhaseExercise[];
    cooldown?: PhaseExercise[];
    defaultRestTime?: number;
}

const createInitialState = (): GymTimerState => ({
    currentExerciseIndex: 0,
    currentSet: 1,
    completedSets: {},
    isResting: false,
    restTimeLeft: 60,
    warmupIndex: 0,
    cooldownIndex: 0,
});

const gymTimerReducer = (
    state: GymTimerState,
    action: GymTimerAction
): GymTimerState => {
    switch (action.type) {
        case 'COMPLETE_SET':
            return {
                ...state,
                completedSets: {
                    ...state.completedSets,
                    [state.currentExerciseIndex]:
                        (state.completedSets[state.currentExerciseIndex] || 0) + 1,
                },
                currentSet: state.currentSet + 1,
            };

        case 'START_REST':
            return {
                ...state,
                isResting: true,
                restTimeLeft: action.payload,
            };

        case 'SKIP_REST':
            return {
                ...state,
                isResting: false,
                restTimeLeft: 60,
            };

        case 'TICK_REST':
            return {
                ...state,
                restTimeLeft: Math.max(0, state.restTimeLeft - 1),
            };

        case 'NEXT_EXERCISE':
            return {
                ...state,
                currentExerciseIndex: state.currentExerciseIndex + 1,
                currentSet: 1,
                isResting: false,
                restTimeLeft: 60,
            };

        case 'PREVIOUS_EXERCISE':
            return {
                ...state,
                currentExerciseIndex: Math.max(0, state.currentExerciseIndex - 1),
                currentSet: 1,
                isResting: false,
                restTimeLeft: 60,
            };

        case 'NEXT_WARMUP':
            return {
                ...state,
                warmupIndex: state.warmupIndex + 1,
            };

        case 'NEXT_COOLDOWN':
            return {
                ...state,
                cooldownIndex: state.cooldownIndex + 1,
            };

        case 'RESET':
            return createInitialState();

        default:
            return state;
    }
};

export const useGymTimer = (config: GymTimerConfig) => {
    const { exercises, warmup = [], cooldown = [], defaultRestTime = 60 } = config;

    const [state, dispatch] = useReducer(gymTimerReducer, createInitialState());

    // Current exercise info
    const currentExercise = useMemo(
        () => exercises[state.currentExerciseIndex] || null,
        [exercises, state.currentExerciseIndex]
    );

    const currentWarmup = useMemo(
        () => warmup[state.warmupIndex] || null,
        [warmup, state.warmupIndex]
    );

    const currentCooldown = useMemo(
        () => cooldown[state.cooldownIndex] || null,
        [cooldown, state.cooldownIndex]
    );

    // Progress calculations
    const totalExercises = exercises.length;
    const exerciseProgress = useMemo(
        () => (state.currentExerciseIndex + 1) / totalExercises,
        [state.currentExerciseIndex, totalExercises]
    );

    const isExerciseComplete = useMemo(() => {
        if (!currentExercise?.sets) return false;
        return (
            (state.completedSets[state.currentExerciseIndex] || 0) >=
            currentExercise.sets
        );
    }, [currentExercise, state.completedSets, state.currentExerciseIndex]);

    const isLastExercise = useMemo(
        () => state.currentExerciseIndex >= exercises.length - 1,
        [state.currentExerciseIndex, exercises.length]
    );

    const isLastSet = useMemo(
        () => currentExercise && state.currentSet >= (currentExercise.sets || 1),
        [currentExercise, state.currentSet]
    );

    const hasMoreWarmup = useMemo(
        () => state.warmupIndex < warmup.length - 1,
        [state.warmupIndex, warmup.length]
    );

    const hasMoreCooldown = useMemo(
        () => state.cooldownIndex < cooldown.length - 1,
        [state.cooldownIndex, cooldown.length]
    );

    // Actions
    const completeSet = useCallback(() => {
        dispatch({ type: 'COMPLETE_SET' });

        if (!isLastSet) {
            // Start rest period
            dispatch({ type: 'START_REST', payload: defaultRestTime });
        }
    }, [isLastSet, defaultRestTime]);

    const skipRest = useCallback(() => {
        dispatch({ type: 'SKIP_REST' });
    }, []);

    const nextExercise = useCallback(() => {
        dispatch({ type: 'NEXT_EXERCISE' });
    }, []);

    const previousExercise = useCallback(() => {
        dispatch({ type: 'PREVIOUS_EXERCISE' });
    }, []);

    const nextWarmup = useCallback(() => {
        dispatch({ type: 'NEXT_WARMUP' });
    }, []);

    const nextCooldown = useCallback(() => {
        dispatch({ type: 'NEXT_COOLDOWN' });
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    const tickRest = useCallback(() => {
        dispatch({ type: 'TICK_REST' });
    }, []);

    return {
        // State
        currentExerciseIndex: state.currentExerciseIndex,
        currentSet: state.currentSet,
        completedSets: state.completedSets,
        isResting: state.isResting,
        restTimeLeft: state.restTimeLeft,
        warmupIndex: state.warmupIndex,
        cooldownIndex: state.cooldownIndex,

        // Current items
        currentExercise,
        currentWarmup,
        currentCooldown,

        // Progress
        totalExercises,
        exerciseProgress,
        isExerciseComplete,
        isLastExercise,
        isLastSet,
        hasMoreWarmup,
        hasMoreCooldown,

        // Actions
        completeSet,
        skipRest,
        nextExercise,
        previousExercise,
        nextWarmup,
        nextCooldown,
        reset,
        tickRest,
    };
};
