import { useReducer, useCallback, useMemo } from 'react';
import { TimerPhase, TimerAction } from '../types/timer.types';

/**
 * State Machine for Timer Phases
 * Manages phase transitions in a predictable way
 */

interface StateMachineState {
    phase: TimerPhase;
    previousPhase: TimerPhase | null;
    canGoBack: boolean;
}

type StateMachineAction =
    | { type: 'TRANSITION'; payload: TimerPhase }
    | { type: 'RESET' }
    | { type: 'GO_BACK' };

// Valid phase transitions
const VALID_TRANSITIONS: Record<TimerPhase, TimerPhase[]> = {
    idle: ['preparing', 'warmup', 'workout'],
    preparing: ['warmup', 'workout'],
    warmup: ['workout', 'idle'],
    workout: ['cooldown', 'finished', 'warmup'],
    cooldown: ['finished', 'workout'],
    finished: ['idle'],
};

const stateMachineReducer = (
    state: StateMachineState,
    action: StateMachineAction
): StateMachineState => {
    switch (action.type) {
        case 'TRANSITION': {
            const targetPhase = action.payload;

            // Validate transition
            if (!VALID_TRANSITIONS[state.phase].includes(targetPhase)) {
                console.warn(
                    `Invalid transition from ${state.phase} to ${targetPhase}`
                );
                return state;
            }

            return {
                phase: targetPhase,
                previousPhase: state.phase,
                canGoBack: targetPhase !== 'finished' && targetPhase !== 'idle',
            };
        }

        case 'GO_BACK': {
            if (!state.canGoBack || !state.previousPhase) {
                return state;
            }

            return {
                phase: state.previousPhase,
                previousPhase: null,
                canGoBack: false,
            };
        }

        case 'RESET': {
            return {
                phase: 'idle',
                previousPhase: null,
                canGoBack: false,
            };
        }

        default:
            return state;
    }
};

export const useTimerStateMachine = (initialPhase: TimerPhase = 'idle') => {
    const [state, dispatch] = useReducer(stateMachineReducer, {
        phase: initialPhase,
        previousPhase: null,
        canGoBack: false,
    });

    const transitionTo = useCallback((targetPhase: TimerPhase) => {
        dispatch({ type: 'TRANSITION', payload: targetPhase });
    }, []);

    const goBack = useCallback(() => {
        dispatch({ type: 'GO_BACK' });
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    const canTransitionTo = useCallback(
        (targetPhase: TimerPhase): boolean => {
            return VALID_TRANSITIONS[state.phase].includes(targetPhase);
        },
        [state.phase]
    );

    // Phase checks
    const isIdle = useMemo(() => state.phase === 'idle', [state.phase]);
    const isPreparing = useMemo(() => state.phase === 'preparing', [state.phase]);
    const isWarmup = useMemo(() => state.phase === 'warmup', [state.phase]);
    const isWorkout = useMemo(() => state.phase === 'workout', [state.phase]);
    const isCooldown = useMemo(() => state.phase === 'cooldown', [state.phase]);
    const isFinished = useMemo(() => state.phase === 'finished', [state.phase]);

    return {
        // State
        phase: state.phase,
        previousPhase: state.previousPhase,
        canGoBack: state.canGoBack,

        // Actions
        transitionTo,
        goBack,
        reset,
        canTransitionTo,

        // Helpers
        isIdle,
        isPreparing,
        isWarmup,
        isWorkout,
        isCooldown,
        isFinished,
    };
};
