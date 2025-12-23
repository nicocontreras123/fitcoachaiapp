import { useReducer, useCallback, useMemo, useEffect, useRef } from 'react';
import { RoundStructure } from '../types/timer.types';
import { useAudioManager } from './useAudioManager';

/**
 * Refactored Boxing Timer Hook
 * Uses reducer pattern for predictable state management
 * Integrates with useAudioManager for centralized audio
 */

interface BoxingTimerState {
    isActive: boolean;
    round: number;
    timeLeft: number;
    isRest: boolean;
    isPreparing: boolean;
    totalRounds: number;
}

type BoxingTimerAction =
    | { type: 'START' }
    | { type: 'PAUSE' }
    | { type: 'TICK' }
    | { type: 'START_ROUND'; payload: { round: number; duration: number } }
    | { type: 'START_REST'; payload: { duration: number } }
    | { type: 'FINISH_PREP'; payload: { duration: number } }
    | { type: 'SKIP_TO_NEXT' }
    | { type: 'RESET'; payload: { prepTime: number; totalRounds: number } };

interface TimerConfig {
    roundDuration?: number;
    restDuration?: number;
    totalRounds?: number;
    rounds?: RoundStructure[];
    prepTime?: number;
    timerSoundEnabled?: boolean;
    voiceEnabled?: boolean;
    onWorkoutComplete?: () => void; // Callback when all rounds finish
}

const boxingTimerReducer = (
    state: BoxingTimerState,
    action: BoxingTimerAction
): BoxingTimerState => {
    switch (action.type) {
        case 'START':
            return { ...state, isActive: true };

        case 'PAUSE':
            return { ...state, isActive: false };

        case 'TICK':
            return {
                ...state,
                timeLeft: Math.max(0, state.timeLeft - 1),
            };

        case 'START_ROUND':
            return {
                ...state,
                round: action.payload.round,
                timeLeft: action.payload.duration,
                isRest: false,
                isPreparing: false,
            };

        case 'START_REST':
            return {
                ...state,
                timeLeft: action.payload.duration,
                isRest: true,
            };

        case 'FINISH_PREP':
            return {
                ...state,
                isPreparing: false,
                isRest: false,
                timeLeft: action.payload.duration,
            };

        case 'RESET':
            return {
                isActive: false,
                round: 1,
                timeLeft: action.payload.prepTime,
                isRest: false,
                isPreparing: true,
                totalRounds: action.payload.totalRounds,
            };

        default:
            return state;
    }
};

export const useBoxeoTimer = (_sessionId: string, config?: TimerConfig) => {
    const {
        roundDuration = 180,
        restDuration = 60,
        rounds,
        prepTime = 10,
        timerSoundEnabled = true,
        voiceEnabled = true,
        onWorkoutComplete,
    } = config || {};

    // Helper functions
    const getRoundDuration = useCallback(
        (roundNum: number) => {
            if (rounds && rounds[roundNum - 1]) {
                return rounds[roundNum - 1].workTime;
            }
            return roundDuration;
        },
        [rounds, roundDuration]
    );

    const getRestDuration = useCallback(
        (roundNum: number) => {
            if (rounds && rounds[roundNum - 1]) {
                return rounds[roundNum - 1].restTime;
            }
            return restDuration;
        },
        [rounds, restDuration]
    );

    const totalRounds = useMemo(
        () => rounds?.length || config?.totalRounds || 12,
        [rounds, config?.totalRounds]
    );

    // State
    const [state, dispatch] = useReducer(boxingTimerReducer, {
        isActive: false,
        round: 1,
        timeLeft: prepTime,
        isRest: false,
        isPreparing: true,
        totalRounds,
    });

    // Audio manager
    const audio = useAudioManager({
        voiceEnabled,
        timerSoundEnabled,
    });

    // Refs for countdown tracking
    const hasSpokenCountdownRef = useRef<Set<number>>(new Set());
    const prevTimeLeftRef = useRef(state.timeLeft);
    const hasAnnouncedPrepRef = useRef(false);

    // Announce preparation phase start
    useEffect(() => {
        if (state.isPreparing && state.isActive && !hasAnnouncedPrepRef.current) {
            audio.speak('Prepárate', { language: 'es-ES', pitch: 1.1, rate: 0.9 });
            hasAnnouncedPrepRef.current = true;
        }

        // Reset when not preparing
        if (!state.isPreparing) {
            hasAnnouncedPrepRef.current = false;
        }
    }, [state.isPreparing, state.isActive, audio]);

    // Timer tick effect
    useEffect(() => {
        console.log('⏱️ [TIMER_TICK] Effect triggered', {
            isActive: state.isActive,
            timeLeft: state.timeLeft,
            willCreateInterval: state.isActive && state.timeLeft > 0,
        });

        let interval: ReturnType<typeof setInterval>;

        if (state.isActive && state.timeLeft > 0) {

            interval = setInterval(() => {

                dispatch({ type: 'TICK' });
            }, 1000);
        } else {
            console.log('❌ [TIMER_TICK] Not creating interval', {
                reason: !state.isActive ? 'not active' : 'time is 0',
            });
        }

        return () => {
            if (interval) {

                clearInterval(interval);
            }
        };
    }, [state.isActive, state.timeLeft]);

    // Countdown announcements (3, 2, 1)
    useEffect(() => {
        if (state.isActive && state.timeLeft <= 3 && state.timeLeft > 0) {
            if (!hasSpokenCountdownRef.current.has(state.timeLeft)) {
                hasSpokenCountdownRef.current.add(state.timeLeft);
                audio.speakCountdown(state.timeLeft);
            }
        }

        // Reset countdown tracking when time > 3
        if (state.timeLeft > 3) {
            hasSpokenCountdownRef.current.clear();
        }
    }, [state.timeLeft, state.isActive, audio]);

    // Announce "Prepárate" at 10 seconds during rest
    const hasSpokenPrepareRef = useRef(false);

    useEffect(() => {
        // Only announce during rest period
        if (state.isRest && state.isActive && state.timeLeft === 10 && !hasSpokenPrepareRef.current) {
            audio.speak('Prepárate', { language: 'es-ES', pitch: 1.1, rate: 0.9 });
            hasSpokenPrepareRef.current = true;
            console.log('🗣️ [REST_PREPARE] Announced "Prepárate" at 10 seconds');
        }

        // Reset the flag when not in rest or when time changes significantly
        if (!state.isRest || state.timeLeft > 10) {
            hasSpokenPrepareRef.current = false;
        }
    }, [state.isRest, state.isActive, state.timeLeft, audio]);

    // Phase change when time reaches 0
    useEffect(() => {
        if (state.timeLeft === 0 && prevTimeLeftRef.current > 0) {
            handlePhaseChange();
        }
        prevTimeLeftRef.current = state.timeLeft;
    }, [state.timeLeft]);

    const handlePhaseChange = useCallback(() => {
        hasSpokenCountdownRef.current.clear();

        if (state.isPreparing) {
            // Finish preparation, start first round
            const duration = getRoundDuration(1);
            dispatch({ type: 'FINISH_PREP', payload: { duration } });
            audio.announceRoundStart(1);
        } else if (state.isRest) {
            // Start next round
            if (state.round < state.totalRounds) {
                const nextRound = state.round + 1;
                const duration = getRoundDuration(nextRound);
                dispatch({ type: 'START_ROUND', payload: { round: nextRound, duration } });
                audio.announceRoundStart(nextRound);
            } else {
                // Finished all rounds
                dispatch({ type: 'PAUSE' });
                audio.speak('Entrenamiento completo!');
                // Notify component that workout is complete
                if (onWorkoutComplete) {
                    onWorkoutComplete();
                }
            }
        } else {
            // Start rest
            const duration = getRestDuration(state.round);
            dispatch({ type: 'START_REST', payload: { duration } });
            audio.announceRest();
        }
    }, [
        state.isPreparing,
        state.isRest,
        state.round,
        state.totalRounds,
        getRoundDuration,
        getRestDuration,
        audio,
    ]);

    // Actions
    const toggleTimer = useCallback(() => {
        console.log('🎮 [TOGGLE_TIMER] Called', {
            currentIsActive: state.isActive,
            willDispatch: state.isActive ? 'PAUSE' : 'START',
        });
        dispatch({ type: state.isActive ? 'PAUSE' : 'START' });
    }, [state.isActive]);

    const resetTimer = useCallback(() => {
        dispatch({ type: 'RESET', payload: { prepTime, totalRounds } });
        hasSpokenCountdownRef.current.clear();
        hasSpokenPrepareRef.current = false;
    }, [prepTime, totalRounds]);

    const skipToNextRound = useCallback(() => {
        hasSpokenCountdownRef.current.clear();
        hasSpokenPrepareRef.current = false;

        if (state.isPreparing) {
            // Skip preparation, go straight to round 1
            const duration = getRoundDuration(1);
            dispatch({ type: 'FINISH_PREP', payload: { duration } });
            audio.announceRoundStart(1);
        } else if (state.isRest) {
            // Skip rest, go to next round
            if (state.round < state.totalRounds) {
                const nextRound = state.round + 1;
                const duration = getRoundDuration(nextRound);
                dispatch({ type: 'START_ROUND', payload: { round: nextRound, duration } });
                audio.announceRoundStart(nextRound);
            }
        } else {
            // Skip current round, go to rest
            const duration = getRestDuration(state.round);
            dispatch({ type: 'START_REST', payload: { duration } });
            audio.announceRest();
        }
    }, [
        state.isPreparing,
        state.isRest,
        state.round,
        state.totalRounds,
        getRoundDuration,
        getRestDuration,
        audio,
    ]);

    return {
        state,
        toggleTimer,
        resetTimer,
        skipToNextRound,
    };
};
