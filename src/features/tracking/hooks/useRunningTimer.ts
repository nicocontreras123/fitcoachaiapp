import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RunningWorkout } from '@/features/workouts/types';
import { useGpsTracker } from './useGpsTracker';
import { useAudioManager } from './useAudioManager';
import { useBackgroundTimer } from './useBackgroundTimer';

const STORAGE_KEY = 'running_workout_progress';

export interface RunningTimerState {
    phase: 'idle' | 'preparing' | 'active' | 'paused' | 'finished';
    currentIntervalIndex: number;
    timeLeft: number; // seconds remaining in current interval
    totalElapsedTime: number; // total workout time in seconds
    isPaused: boolean;
    completedIntervals: number[];
    failedIntervals: number[];
    notes: string;
}

interface UseRunningTimerConfig {
    workout: RunningWorkout;
    prepTime?: number;
    autoSave?: boolean;
}

export const useRunningTimer = (config: UseRunningTimerConfig) => {
    const { workout, prepTime = 10, autoSave = true } = config;
    const intervals = workout.intervals;

    // Initialize GPS tracker
    const gps = useGpsTracker();

    // Initialize audio manager
    const audio = useAudioManager({
        voiceEnabled: true,
        timerSoundEnabled: true,
    });

    // Initialize background timer
    const backgroundTimer = useBackgroundTimer();

    // Timer state
    const [state, setState] = useState<RunningTimerState>({
        phase: 'idle',
        currentIntervalIndex: 0,
        timeLeft: prepTime,
        totalElapsedTime: 0,
        isPaused: false,
        completedIntervals: [],
        failedIntervals: [],
        notes: '',
    });

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const appState = useRef(AppState.currentState);
    const hasAnnouncedIntervalRef = useRef(false);
    const lastSaveTimeRef = useRef(Date.now());

    // Load saved progress on mount
    useEffect(() => {
        loadProgress();
    }, []);

    // Main timer loop
    useEffect(() => {
        console.log('🏃 [RUNNING_TIMER] Timer effect triggered:', {
            phase: state.phase,
            isPaused: state.isPaused,
        });

        // Run timer during preparing AND active phases
        if ((state.phase === 'preparing' || state.phase === 'active') && !state.isPaused) {
            console.log('🏃 [RUNNING_TIMER] Starting interval');

            timerRef.current = setInterval(() => {
                setState(prev => {
                    // Don't tick if already at 0
                    if (prev.timeLeft <= 0) return prev;

                    if (prev.phase === 'active') {
                        console.log('🏃 [RUNNING_TIMER] Active phase tick');
                        return {
                            ...prev,
                            timeLeft: prev.timeLeft - 1,
                            totalElapsedTime: prev.totalElapsedTime + 1,
                        };
                    } else {
                        console.log('🏃 [RUNNING_TIMER] Preparing phase tick');
                        return {
                            ...prev,
                            timeLeft: prev.timeLeft - 1,
                        };
                    }
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                console.log('🏃 [RUNNING_TIMER] Clearing interval');
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [state.phase, state.isPaused]); // Only phase and pause state

    // Handle timeLeft reaching 0
    useEffect(() => {
        if (state.timeLeft === 0 && (state.phase === 'preparing' || state.phase === 'active')) {
            console.log('🏃 [RUNNING_TIMER] Time reached zero');

            (async () => {
                if (state.phase === 'preparing') {
                    const firstInterval = intervals[0];
                    console.log('🏃 [RUNNING_TIMER] Preparation complete, starting first interval:', firstInterval);

                    setState(prev => ({
                        ...prev,
                        phase: 'active',
                        currentIntervalIndex: 0,
                        timeLeft: firstInterval.duration * 60,
                    }));
                    audio.playBell();
                    audio.speak('¡Comienza!');
                    await backgroundTimer.startBackgroundTimer(0);
                    console.log('🏃 [RUNNING_TIMER] Background timer started');
                } else if (state.phase === 'active') {
                    console.log('🏃 [RUNNING_TIMER] Interval complete');
                    handleIntervalComplete();
                }
            })();
        }
    }, [state.timeLeft, state.phase]);

    // Auto-save progress periodically
    useEffect(() => {
        if (autoSave && state.phase === 'active') {
            const now = Date.now();
            if (now - lastSaveTimeRef.current > 10000) {
                // Save every 10 seconds
                saveProgress();
                lastSaveTimeRef.current = now;
            }
        }
    }, [state.totalElapsedTime, autoSave]);

    // Countdown announcements (3, 2, 1) - works during preparing and active phases
    useEffect(() => {
        if ((state.phase === 'preparing' || state.phase === 'active') && !state.isPaused && state.timeLeft <= 3 && state.timeLeft > 0) {
            audio.speakCountdown(state.timeLeft);
            audio.startTickSound();
        } else {
            audio.stopTickSound();
        }
    }, [state.timeLeft, state.phase, state.isPaused]);

    // Handle app state changes - sync time when returning from background
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
            console.log('🏃 [RUNNING_TIMER] AppState changed:', {
                from: appState.current,
                to: nextAppState,
                phase: state.phase,
                isPaused: state.isPaused,
            });

            // App is coming to foreground
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                if (state.phase === 'active' && !state.isPaused) {
                    // Get elapsed time including background time
                    const totalElapsed = await backgroundTimer.getElapsedTime();
                    const timeDifference = totalElapsed - state.totalElapsedTime;

                    console.log('🏃 [RUNNING_TIMER] Syncing time from background:', {
                        previousElapsed: state.totalElapsedTime,
                        newElapsed: totalElapsed,
                        difference: timeDifference,
                        currentTimeLeft: state.timeLeft,
                    });

                    // Update state with background time AND recalculate timeLeft
                    setState(prev => {
                        const newTimeLeft = Math.max(0, prev.timeLeft - timeDifference);

                        console.log('🏃 [RUNNING_TIMER] Updated state:', {
                            oldTimeLeft: prev.timeLeft,
                            newTimeLeft,
                            totalElapsed,
                        });

                        return {
                            ...prev,
                            totalElapsedTime: totalElapsed,
                            timeLeft: newTimeLeft,
                        };
                    });

                    // Restart background timer tracking with new time
                    await backgroundTimer.startBackgroundTimer(totalElapsed);
                }
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [state.phase, state.isPaused, state.totalElapsedTime, backgroundTimer]);

    // Announce interval when starting
    useEffect(() => {
        if (
            state.phase === 'active' &&
            state.currentIntervalIndex < intervals.length &&
            !hasAnnouncedIntervalRef.current
        ) {
            const interval = intervals[state.currentIntervalIndex];
            const announcement = getIntervalAnnouncement(interval.type);
            audio.speak(`${announcement}. ${interval.description}`);
            hasAnnouncedIntervalRef.current = true;
        }
    }, [state.currentIntervalIndex, state.phase]);

    const getIntervalAnnouncement = (type: string): string => {
        const announcements: Record<string, string> = {
            'warm-up': 'Calentamiento',
            'run': 'Ritmo constante',
            'sprint': '¡Sprint!',
            'recovery': 'Recuperación',
            'cool-down': 'Enfriamiento',
        };
        return announcements[type] || 'Siguiente intervalo';
    };

    const handleIntervalComplete = () => {
        audio.playBell();
        hasAnnouncedIntervalRef.current = false;

        // Mark current interval as completed
        const completedIntervalIndex = state.currentIntervalIndex;

        if (state.currentIntervalIndex < intervals.length - 1) {
            // Move to next interval
            const nextIndex = state.currentIntervalIndex + 1;
            const nextInterval = intervals[nextIndex];

            setState(prev => ({
                ...prev,
                currentIntervalIndex: nextIndex,
                timeLeft: nextInterval.duration * 60, // Convert minutes to seconds
                completedIntervals: [...prev.completedIntervals, completedIntervalIndex],
            }));
        } else {
            // Workout finished
            audio.speak('¡Entrenamiento completado! Excelente trabajo');
            gps.stopTracking();
            setState(prev => ({
                ...prev,
                phase: 'finished',
                completedIntervals: [...prev.completedIntervals, completedIntervalIndex],
            }));
            clearProgress();
        }
    };

    const start = useCallback(async () => {
        if (state.phase === 'idle') {
            // Start from preparation
            audio.speak('Prepárate para comenzar');

            // Start GPS tracking
            await gps.startTracking();

            // Start background timer tracking
            await backgroundTimer.startBackgroundTimer(0);

            // Set preparing phase - timer will countdown automatically
            setState(prev => ({
                ...prev,
                phase: 'preparing',
                timeLeft: prepTime,
            }));

            // No need for setTimeout - the timer effect will handle the transition when timeLeft reaches 0
        }
    }, [state.phase, prepTime, backgroundTimer]);

    const pause = useCallback(async () => {
        if ((state.phase === 'preparing' || state.phase === 'active') && !state.isPaused) {
            setState(prev => ({ ...prev, isPaused: true }));
            audio.stopTickSound();
            audio.speak('Pausado');

            // Pause background timer
            await backgroundTimer.pauseBackgroundTimer(state.totalElapsedTime);

            if (state.phase === 'active') {
                saveProgress();
            }
        }
    }, [state.phase, state.isPaused, state.totalElapsedTime, backgroundTimer]);

    const resume = useCallback(async () => {
        if (state.isPaused) {
            setState(prev => ({ ...prev, isPaused: false }));
            audio.speak('Continuando');

            // Resume background timer
            await backgroundTimer.startBackgroundTimer(state.totalElapsedTime);
        }
    }, [state.isPaused, state.totalElapsedTime, backgroundTimer]);

    const skip = useCallback(() => {
        if (state.currentIntervalIndex < intervals.length - 1) {
            const nextIndex = state.currentIntervalIndex + 1;
            const nextInterval = intervals[nextIndex];

            setState(prev => ({
                ...prev,
                currentIntervalIndex: nextIndex,
                timeLeft: nextInterval.duration * 60,
                completedIntervals: [...prev.completedIntervals, state.currentIntervalIndex],
            }));

            audio.speak('Siguiente intervalo');
            hasAnnouncedIntervalRef.current = false;
        }
    }, [state.currentIntervalIndex, intervals]);

    const markAsFailed = useCallback(() => {
        if (state.phase === 'active') {
            setState(prev => ({
                ...prev,
                failedIntervals: [...prev.failedIntervals, state.currentIntervalIndex],
            }));
            audio.speak('Ejercicio marcado como fallido');
            skip();
        }
    }, [state.phase, state.currentIntervalIndex, skip]);

    const addNote = useCallback((note: string) => {
        setState(prev => ({
            ...prev,
            notes: prev.notes ? `${prev.notes}\n${note}` : note,
        }));
    }, []);

    const reset = useCallback(async () => {
        await gps.stopTracking();
        await backgroundTimer.stopBackgroundTimer();

        setState({
            phase: 'idle',
            currentIntervalIndex: 0,
            timeLeft: prepTime,
            totalElapsedTime: 0,
            isPaused: false,
            completedIntervals: [],
            failedIntervals: [],
            notes: '',
        });
        clearProgress();
        hasAnnouncedIntervalRef.current = false;
    }, [prepTime, backgroundTimer]);

    const saveProgress = async () => {
        try {
            const progress = {
                state,
                gpsDistance: gps.distance,
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

        } catch (error) {
            console.error('❌ Failed to save progress:', error);
        }
    };

    const loadProgress = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);
            if (saved) {
                const progress = JSON.parse(saved);
                const timeSinceLastSave = Date.now() - progress.timestamp;

                // Only restore if less than 30 minutes old
                if (timeSinceLastSave < 30 * 60 * 1000) {
                    setState(progress.state);

                } else {
                    await clearProgress();
                }
            }
        } catch (error) {
            console.error('❌ Failed to load progress:', error);
        }
    };

    const clearProgress = async () => {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);

        } catch (error) {
            console.error('❌ Failed to clear progress:', error);
        }
    };

    // Current interval data
    const currentInterval =
        state.currentIntervalIndex < intervals.length
            ? intervals[state.currentIntervalIndex]
            : null;

    // Calculate pace from GPS
    const currentPace = gps.distance > 0 && state.totalElapsedTime > 0
        ? (state.totalElapsedTime / 60) / gps.distance // min/km
        : 0;

    const formatPace = (pace: number): string => {
        const minutes = Math.floor(pace);
        const seconds = Math.floor((pace - minutes) * 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Calculate estimated calories (rough estimate: 1 kcal per kg per km)
    const estimatedCalories = Math.round(gps.distance * 70); // Assuming 70kg user

    return {
        // State
        state,
        currentInterval,
        gps,

        // Calculated values
        currentPace: formatPace(currentPace),
        estimatedCalories,
        progress: state.currentIntervalIndex / intervals.length,

        // Controls
        start,
        pause,
        resume,
        skip,
        reset,
        markAsFailed,
        addNote,
        saveProgress,

        // Audio
        audio,
    };
};
