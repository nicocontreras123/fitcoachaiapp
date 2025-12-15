import { useState, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import { useAudioPlayer, AudioSource } from 'expo-audio';

interface TimerState {
    isActive: boolean;
    currentInterval: number;
    timeLeft: number; // seconds
    totalIntervals: number;
}

export interface RunningInterval {
    type: 'warm-up' | 'run' | 'sprint' | 'recovery' | 'cool-down';
    duration: number; // seconds
    pace?: string; // e.g., "5:30 min/km"
    description: string;
}

interface TimerConfig {
    intervals: RunningInterval[];
    prepTime?: number; // Preparation time in seconds (default: 10)
    timerSoundEnabled?: boolean;
}

export const useRunningIntervalTimer = (config: TimerConfig) => {
    const prepTime = config?.prepTime !== undefined ? config.prepTime : 10;
    const totalIntervals = config.intervals.length;
    const [state, setState] = useState<TimerState>({
        isActive: false,
        currentInterval: 0, // 0 means preparation phase
        timeLeft: prepTime,
        totalIntervals: totalIntervals,
    });

    const hasSpokenCountdownRef = useRef<Set<number>>(new Set());
    const tickPlayer = useAudioPlayer(require('../../../../assets/tictac.mp3') as AudioSource, { loop: true });
    const bellPlayer = useAudioPlayer(require('../../../../assets/campana.mp3') as AudioSource);
    const hasAnnouncedIntervalRef = useRef<boolean>(false);

    // Set audio player volumes
    useEffect(() => {
        tickPlayer.volume = 0.8;
        bellPlayer.volume = 1.0;
    }, []);

    // Play/pause tick-tack sound based on timer state
    useEffect(() => {
        const soundsEnabled = config?.timerSoundEnabled !== false;

        if (state.isActive && soundsEnabled) {
            tickPlayer.play();
        } else {
            tickPlayer.pause();
        }

        return () => {
            tickPlayer.pause();
        };
    }, [state.isActive, config?.timerSoundEnabled]);

    // Handle countdown announcement (3, 2, 1)
    useEffect(() => {
        if (state.isActive && state.timeLeft <= 3 && state.timeLeft > 0) {
            if (!hasSpokenCountdownRef.current.has(state.timeLeft)) {
                hasSpokenCountdownRef.current.add(state.timeLeft);
                Speech.speak(state.timeLeft.toString(), {
                    language: 'es-ES',
                    pitch: 1.2,
                    rate: 1.0,
                });
            }
        }

        if (state.timeLeft > 3) {
            hasSpokenCountdownRef.current.clear();
        }
    }, [state.timeLeft, state.isActive, state.currentInterval]);

    // Announce interval type when starting new interval
    useEffect(() => {
        if (state.isActive && state.currentInterval > 0 && !hasAnnouncedIntervalRef.current) {
            const interval = config.intervals[state.currentInterval - 1];
            const announcement = getIntervalAnnouncement(interval.type);

            Speech.speak(announcement, {
                language: 'es-ES',
                pitch: 1.0,
                rate: 0.9,
            });

            hasAnnouncedIntervalRef.current = true;
        }
    }, [state.currentInterval, state.isActive]);

    // Main timer loop
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (state.isActive && state.timeLeft > 0) {
            interval = setInterval(() => {
                setState(prev => ({
                    ...prev,
                    timeLeft: prev.timeLeft - 1
                }));
            }, 1000);
        } else if (state.timeLeft === 0) {
            handlePhaseChange();
        }
        return () => clearInterval(interval);
    }, [state.isActive, state.timeLeft]);

    const getIntervalAnnouncement = (type: RunningInterval['type']): string => {
        const announcements = {
            'warm-up': 'Calentamiento',
            'run': 'Ritmo constante',
            'sprint': '¡Sprint!',
            'recovery': 'Recuperación',
            'cool-down': 'Enfriamiento'
        };
        return announcements[type];
    };

    const handlePhaseChange = () => {
        hasSpokenCountdownRef.current.clear();
        hasAnnouncedIntervalRef.current = false;

        if (state.currentInterval === 0) {
            // Finish preparation, start first interval
            playBellSound();
            Speech.speak("¡Comienza!", {
                language: 'es-ES',
                pitch: 1.1,
                rate: 0.9,
            });
            updateState({
                currentInterval: 1,
                timeLeft: config.intervals[0].duration
            });
        } else if (state.currentInterval < totalIntervals) {
            // Start next interval
            const nextInterval = state.currentInterval + 1;
            playBellSound();
            updateState({
                currentInterval: nextInterval,
                timeLeft: config.intervals[nextInterval - 1].duration
            });
        } else {
            // Finished
            playBellSound();
            Speech.speak("¡Entrenamiento completo!", {
                language: 'es-ES',
                pitch: 1.0,
                rate: 0.9,
            });
            updateState({ isActive: false });
        }
    };

    const playBellSound = () => {
        if (config?.timerSoundEnabled === false) {
            return;
        }

        try {
            bellPlayer.seekTo(0);
            bellPlayer.play();
        } catch (error) {
            console.error('Error playing bell sound:', error);
        }
    };

    const updateState = (updates: Partial<TimerState>) => {
        setState(prev => ({ ...prev, ...updates }));
    };

    const toggleTimer = () => updateState({ isActive: !state.isActive });

    const resetTimer = () => {
        hasAnnouncedIntervalRef.current = false;
        updateState({
            currentInterval: 0,
            timeLeft: prepTime,
            isActive: false
        });
    };

    const skipToNextInterval = () => {
        hasSpokenCountdownRef.current.clear();
        hasAnnouncedIntervalRef.current = false;

        if (state.currentInterval === 0) {
            // Skip preparation
            Speech.speak("¡Comienza!", {
                language: 'es-ES',
                pitch: 1.1,
                rate: 0.9,
            });
            updateState({
                currentInterval: 1,
                timeLeft: config.intervals[0].duration
            });
        } else if (state.currentInterval < totalIntervals) {
            // Skip to next interval
            const nextInterval = state.currentInterval + 1;
            updateState({
                currentInterval: nextInterval,
                timeLeft: config.intervals[nextInterval - 1].duration
            });
        }
    };

    // Get current interval details
    const getCurrentInterval = (): RunningInterval | null => {
        if (state.currentInterval === 0 || state.currentInterval > config.intervals.length) {
            return null;
        }
        return config.intervals[state.currentInterval - 1];
    };

    const isPreparing = () => state.currentInterval === 0;
    const isFinished = () => !state.isActive && state.currentInterval === totalIntervals && state.timeLeft === 0;

    return {
        state,
        toggleTimer,
        resetTimer,
        skipToNextInterval,
        getCurrentInterval,
        isPreparing,
        isFinished
    };
};
