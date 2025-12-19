import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Phase Timer Hook
 * Manages countdown logic for a single phase
 * Uses timestamps to continue running in background
 */

interface PhaseTimerConfig {
    initialTime: number;
    autoStart?: boolean;
    onTick?: (timeLeft: number) => void;
    onComplete?: () => void;
    onCountdown?: (count: number) => void; // Called at 3, 2, 1
}

export const usePhaseTimer = (config: PhaseTimerConfig) => {
    const {
        initialTime,
        autoStart = false,
        onTick,
        onComplete,
        onCountdown,
    } = config;

    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [isActive, setIsActive] = useState(autoStart);
    const [restartCounter, setRestartCounter] = useState(0); // Force interval recreation
    const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const hasCalledCountdownRef = useRef<Set<number>>(new Set());

    // Store callbacks in refs to avoid dependency issues
    const onCompleteRef = useRef(onComplete);
    const onTickRef = useRef(onTick);
    const onCountdownRef = useRef(onCountdown);

    // Update refs when callbacks change
    useEffect(() => {
        onCompleteRef.current = onComplete;
        onTickRef.current = onTick;
        onCountdownRef.current = onCountdown;
    }, [onComplete, onTick, onCountdown]);

    // Timestamp-based tracking for background support
    const startTimestampRef = useRef<number | null>(null);
    const totalDurationRef = useRef<number>(initialTime);

    // Timer tick effect using timestamps for background support
    useEffect(() => {
        if (!isActive) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = undefined;
            }
            startTimestampRef.current = null;
            return;
        }

        // Initialize start timestamp if not set
        if (startTimestampRef.current === null) {
            console.log('🚀 [PHASE_TIMER] Initializing interval', {
                timeLeft,
                totalDuration: totalDurationRef.current,
                restartCounter
            });
            startTimestampRef.current = Date.now();
            // totalDurationRef should already be set by setTimeAndStart or other methods
            // Only use timeLeft as fallback if totalDurationRef is somehow 0
            if (totalDurationRef.current === 0) {
                console.warn('⚠️ [PHASE_TIMER] totalDurationRef was 0, using timeLeft:', timeLeft);
                totalDurationRef.current = timeLeft;
            }
        }

        // Don't recreate interval if already exists
        if (intervalRef.current) {

            return;
        }



        const calculateTimeLeft = () => {
            if (startTimestampRef.current === null) return timeLeft;

            const elapsed = Math.floor((Date.now() - startTimestampRef.current) / 1000);
            const remaining = Math.max(0, totalDurationRef.current - elapsed);
            return remaining;
        };

        intervalRef.current = setInterval(() => {
            const newTime = calculateTimeLeft();
            console.log('⏲️ [PHASE_TIMER] Interval tick', {
                newTime,
                totalDuration: totalDurationRef.current,
                timestamp: startTimestampRef.current,
                elapsed: startTimestampRef.current ? Math.floor((Date.now() - startTimestampRef.current) / 1000) : 0
            });

            if (newTime <= 0) {

                clearInterval(intervalRef.current!);
                intervalRef.current = undefined;
                startTimestampRef.current = null;
                setTimeLeft(0);
                return;
            }

            setTimeLeft(newTime);

            // Call onTick callback
            onTickRef.current?.(newTime);

            // Call countdown callback for 3, 2, 1
            if (
                newTime <= 3 &&
                newTime > 0 &&
                !hasCalledCountdownRef.current.has(newTime)
            ) {
                hasCalledCountdownRef.current.add(newTime);
                onCountdownRef.current?.(newTime);
            }

            // Reset countdown tracking when time > 3
            if (newTime > 3) {
                hasCalledCountdownRef.current.clear();
            }
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = undefined;
            }
        };
    }, [isActive, restartCounter]);

    // AppState listener to sync when returning from background
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active' && isActive && startTimestampRef.current !== null) {
                // App returned from background, recalculate time
                const elapsed = Math.floor((Date.now() - startTimestampRef.current) / 1000);
                const remaining = Math.max(0, totalDurationRef.current - elapsed);
                setTimeLeft(remaining);
            }
        });

        return () => {
            subscription.remove();
        };
    }, [isActive]);

    // Handle completion - use ref to avoid re-running when callback changes
    useEffect(() => {
        console.log('🔍 [PHASE_TIMER] Completion check', {
            timeLeft,
            isActive,
            hasTimestamp: startTimestampRef.current !== null,
            willComplete: timeLeft === 0 && isActive && startTimestampRef.current === null
        });
        // Only complete if:
        // 1. Time is 0
        // 2. Timer is active
        // 3. No timestamp (meaning interval already cleared it when naturally reaching 0)
        if (timeLeft === 0 && isActive && startTimestampRef.current === null) {

            setIsActive(false);
            onCompleteRef.current?.();
        }
    }, [timeLeft, isActive]);

    // Control functions
    const start = useCallback(() => {
        startTimestampRef.current = Date.now();
        totalDurationRef.current = timeLeft;
        setIsActive(true);
    }, [timeLeft]);

    const pause = useCallback(() => {
        setIsActive(false);
        startTimestampRef.current = null;
    }, []);

    const resume = useCallback(() => {
        if (timeLeft > 0) {
            startTimestampRef.current = Date.now();
            totalDurationRef.current = timeLeft;
            setIsActive(true);
        }
    }, [timeLeft]);

    const reset = useCallback((newTime?: number) => {
        setIsActive(false);
        setTimeLeft(newTime ?? initialTime);
        startTimestampRef.current = null;
        totalDurationRef.current = newTime ?? initialTime;
        hasCalledCountdownRef.current.clear();
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = undefined;
        }
    }, [initialTime]);

    const setTime = useCallback((newTime: number) => {
        setTimeLeft(newTime);
        startTimestampRef.current = null;
        totalDurationRef.current = newTime;
        hasCalledCountdownRef.current.clear();
    }, []);

    const toggle = useCallback(() => {
        setIsActive((prev) => {
            if (!prev) {
                // Starting
                startTimestampRef.current = Date.now();
                totalDurationRef.current = timeLeft;
            } else {
                // Pausing
                startTimestampRef.current = null;
            }
            return !prev;
        });
    }, [timeLeft]);

    const setTimeAndStart = useCallback((newTime: number) => {


        // Clear existing interval if any
        if (intervalRef.current) {

            clearInterval(intervalRef.current);
            intervalRef.current = undefined;
        }

        setTimeLeft(newTime);
        startTimestampRef.current = Date.now();
        totalDurationRef.current = newTime;
        hasCalledCountdownRef.current.clear();
        setIsActive(true);
        setRestartCounter(prev => prev + 1); // Force interval recreation

    }, []);

    return {
        // State
        timeLeft,
        isActive,
        isComplete: timeLeft === 0,

        // Controls
        start,
        pause,
        resume,
        reset,
        setTime,
        setTimeAndStart,
        toggle,
    };
};
