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
    const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const hasCalledCountdownRef = useRef<Set<number>>(new Set());

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
            startTimestampRef.current = Date.now();
            totalDurationRef.current = timeLeft;
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

            if (newTime <= 0) {
                clearInterval(intervalRef.current!);
                intervalRef.current = undefined;
                startTimestampRef.current = null;
                setTimeLeft(0);
                return;
            }

            setTimeLeft(newTime);

            // Call onTick callback
            onTick?.(newTime);

            // Call countdown callback for 3, 2, 1
            if (
                newTime <= 3 &&
                newTime > 0 &&
                !hasCalledCountdownRef.current.has(newTime)
            ) {
                hasCalledCountdownRef.current.add(newTime);
                onCountdown?.(newTime);
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
    }, [isActive]);

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

    // Handle completion
    useEffect(() => {
        if (timeLeft === 0 && isActive) {
            setIsActive(false);
            onComplete?.();
        }
    }, [timeLeft, isActive, onComplete]);

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
        setTimeLeft(newTime);
        startTimestampRef.current = Date.now();
        totalDurationRef.current = newTime;
        hasCalledCountdownRef.current.clear();
        setIsActive(true);
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
