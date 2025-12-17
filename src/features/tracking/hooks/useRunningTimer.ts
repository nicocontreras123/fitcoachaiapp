import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RunningWorkout } from '@/features/workouts/types';
import { useGpsTracker } from './useGpsTracker';
import { useAudioManager } from './useAudioManager';

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

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const hasAnnouncedIntervalRef = useRef(false);
    const lastSaveTimeRef = useRef(Date.now());

    // Load saved progress on mount
    useEffect(() => {
        loadProgress();
    }, []);

    // Main timer loop
    useEffect(() => {
        if (state.phase === 'active' && !state.isPaused && state.timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setState(prev => ({
                    ...prev,
                    timeLeft: prev.timeLeft - 1,
                    totalElapsedTime: prev.totalElapsedTime + 1,
                }));
            }, 1000);
        } else if (state.timeLeft === 0 && state.phase === 'active') {
            handleIntervalComplete();
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [state.phase, state.isPaused, state.timeLeft]);

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

    // Countdown announcements (3, 2, 1)
    useEffect(() => {
        if (state.phase === 'active' && state.timeLeft <= 3 && state.timeLeft > 0) {
            audio.speakCountdown(state.timeLeft);
            audio.startTickSound();
        } else {
            audio.stopTickSound();
        }
    }, [state.timeLeft, state.phase]);

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
            setState(prev => ({
                ...prev,
                phase: 'preparing',
                timeLeft: prepTime,
            }));

            // Start GPS tracking
            await gps.startTracking();

            // Auto-transition to first interval after prep time
            setTimeout(() => {
                const firstInterval = intervals[0];
                setState(prev => ({
                    ...prev,
                    phase: 'active',
                    currentIntervalIndex: 0,
                    timeLeft: firstInterval.duration * 60,
                }));
                audio.playBell();
                audio.speak('¡Comienza!');
            }, prepTime * 1000);
        }
    }, [state.phase, prepTime]);

    const pause = useCallback(() => {
        if (state.phase === 'active' && !state.isPaused) {
            setState(prev => ({ ...prev, isPaused: true }));
            audio.stopTickSound();
            audio.speak('Pausado');
            saveProgress();
        }
    }, [state.phase, state.isPaused]);

    const resume = useCallback(() => {
        if (state.isPaused) {
            setState(prev => ({ ...prev, isPaused: false }));
            audio.speak('Continuando');
        }
    }, [state.isPaused]);

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
    }, [prepTime]);

    const saveProgress = async () => {
        try {
            const progress = {
                state,
                gpsDistance: gps.distance,
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
            console.log('💾 Progress saved');
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
                    console.log('📥 Progress restored');
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
            console.log('🗑️ Progress cleared');
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
    };
};
