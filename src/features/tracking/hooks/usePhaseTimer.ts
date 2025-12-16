import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Phase Timer Hook
 * Manages countdown logic for a single phase
 * Replaces multiple useEffect hooks with a single, focused timer
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
    const intervalRef = useRef<NodeJS.Timeout>();
    const hasCalledCountdownRef = useRef<Set<number>>(new Set());

    // Timer tick effect
    useEffect(() => {
        if (!isActive || timeLeft <= 0) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = undefined;
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                const newTime = Math.max(0, prev - 1);

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

                return newTime;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = undefined;
            }
        };
    }, [isActive, timeLeft, onTick, onCountdown]);

    // Handle completion
    useEffect(() => {
        if (timeLeft === 0 && isActive) {
            setIsActive(false);
            onComplete?.();
        }
    }, [timeLeft, isActive, onComplete]);

    // Control functions
    const start = useCallback(() => {
        setIsActive(true);
    }, []);

    const pause = useCallback(() => {
        setIsActive(false);
    }, []);

    const resume = useCallback(() => {
        if (timeLeft > 0) {
            setIsActive(true);
        }
    }, [timeLeft]);

    const reset = useCallback((newTime?: number) => {
        setIsActive(false);
        setTimeLeft(newTime ?? initialTime);
        hasCalledCountdownRef.current.clear();
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = undefined;
        }
    }, [initialTime]);

    const setTime = useCallback((newTime: number) => {
        setTimeLeft(newTime);
        hasCalledCountdownRef.current.clear();
    }, []);

    const toggle = useCallback(() => {
        setIsActive((prev) => !prev);
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
        toggle,
    };
};
