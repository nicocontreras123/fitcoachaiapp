import { useState, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import { useAudioPlayer, AudioSource } from 'expo-audio';

interface TimerState {
    isActive: boolean;
    round: number;
    timeLeft: number; // seconds
    isRest: boolean;
    isPreparing: boolean; // New preparation phase
    totalRounds: number;
}

export interface RoundStructure {
    roundNumber: number;
    workTime: number;
    restTime: number;
    exercises?: { name: string; duration: number; description?: string }[];
}

interface TimerConfig {
    roundDuration?: number;
    restDuration?: number;
    totalRounds?: number;
    rounds?: RoundStructure[]; // Structured workout
    prepTime?: number; // Preparation time in seconds (default: 10)
    timerSoundEnabled?: boolean; // Control de sonidos (default: true)
}

export const useBoxeoTimer = (sessionId: string, config?: TimerConfig) => {
    // Determine initial duration based on first round if structured, else default
    const getRoundDuration = (roundNum: number) => {
        if (config?.rounds && config.rounds[roundNum - 1]) {
            return config.rounds[roundNum - 1].workTime;
        }
        return config?.roundDuration || 180;
    };

    const getRestDuration = (roundNum: number) => {
        if (config?.rounds && config.rounds[roundNum - 1]) {
            return config.rounds[roundNum - 1].restTime;
        }
        return config?.restDuration || 60;
    };

    const totalRounds = config?.rounds ? config.rounds.length : (config?.totalRounds || 12);
    const prepTime = config?.prepTime !== undefined ? config.prepTime : 10; // Default 10 seconds

    const [state, setState] = useState<TimerState>({
        isActive: false,
        round: 1,
        timeLeft: prepTime,
        isRest: false,
        isPreparing: true, // Start in preparation mode
        totalRounds: totalRounds,
    });

    const hasSpokenCountdownRef = useRef<Set<number>>(new Set());
    const tickPlayer = useAudioPlayer(require('../../../../assets/tictac.mp3') as AudioSource, { loop: true });
    const bellPlayer = useAudioPlayer(require('../../../../assets/campana.mp3') as AudioSource);
    const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Set audio player volumes
    useEffect(() => {
        tickPlayer.volume = 0.8;
        bellPlayer.volume = 1.0;
    }, []);

    // Play/pause tick-tack sound based on timer state
    useEffect(() => {
        const soundsEnabled = config?.timerSoundEnabled !== false;

        if (state.isActive && soundsEnabled) {

            try {
                if (tickPlayer && !tickPlayer.playing) {
                    tickPlayer.play();
                }
            } catch (error) {
                console.error('Error playing tick sound:', error);
            }
        } else {

            try {
                if (tickPlayer && tickPlayer.playing) {
                    tickPlayer.pause();
                }
            } catch (error) {
                console.error('Error pausing tick sound:', error);
            }
        }

        return () => {
            try {
                if (tickPlayer && tickPlayer.playing) {
                    tickPlayer.pause();
                }
            } catch (error) {
                // Silently ignore cleanup errors
            }
        };
    }, [state.isActive, config?.timerSoundEnabled]);

    // Handle countdown announcement (3, 2, 1)
    useEffect(() => {
        if (state.isActive && state.timeLeft <= 3 && state.timeLeft > 0) {
            // Check if we haven't spoken this number yet
            const currentPhaseKey = `${state.round}-${state.isRest ? 'rest' : state.isPreparing ? 'prep' : 'work'}-${state.timeLeft}`;

            if (!hasSpokenCountdownRef.current.has(state.timeLeft)) {
                hasSpokenCountdownRef.current.add(state.timeLeft);
                Speech.speak(state.timeLeft.toString(), {
                    language: 'es-ES',
                    pitch: 1.2,
                    rate: 1.0,
                });
            }
        }

        // Reset countdown tracking when phase changes
        if (state.timeLeft > 3) {
            hasSpokenCountdownRef.current.clear();
        }
    }, [state.timeLeft, state.isActive, state.round, state.isRest, state.isPreparing]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (state.isActive && state.timeLeft > 0) {
            interval = setInterval(() => {
                setState(prev => {
                    const newState = { ...prev, timeLeft: prev.timeLeft - 1 };
                    // Broadcast state (optimization: don't broadcast every second if not needed, but for realtime timer we might need to)
                    // To avoid flooding, maybe broadcast fewer times or rely on local timer + sync events
                    return newState;
                });
            }, 1000);
        } else if (state.timeLeft === 0) {
            handlePhaseChange();
        }
        return () => clearInterval(interval);
    }, [state.isActive, state.timeLeft, state.isRest]);

    const handlePhaseChange = () => {
        hasSpokenCountdownRef.current.clear(); // Reset countdown for next phase

        if (state.isPreparing) {
            // Finish preparation, start first round
            playBellSound(); // Play bell when starting first round
            Speech.speak("Inicia!", {
                language: 'es-ES',
                pitch: 1.1,
                rate: 0.9,
            });
            updateState({
                isPreparing: false,
                isRest: false,
                timeLeft: getRoundDuration(1)
            });
        } else if (state.isRest) {
            // Start next round
            if (state.round < state.totalRounds) {
                const nextRound = state.round + 1;
                playBellSound(); // Play bell when starting new round
                Speech.speak(`Inicia!`, {
                    language: 'es-ES',
                    pitch: 1.1,
                    rate: 0.9,
                });
                updateState({
                    round: nextRound,
                    isRest: false,
                    timeLeft: getRoundDuration(nextRound)
                });
            } else {
                // Finished
                Speech.speak("Entrenamiento completo!", {
                    language: 'es-ES',
                    pitch: 1.0,
                    rate: 0.9,
                });
                updateState({ isActive: false });
            }
        } else {
            // Start Rest
            Speech.speak("Descansa", {
                language: 'es-ES',
                pitch: 0.9,
                rate: 0.8,
            });
            updateState({
                isRest: true,
                timeLeft: getRestDuration(state.round)
            });
        }
    };

    const playBellSound = () => {
        // Verificar si los sonidos están habilitados
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
        setState(prev => {
            const next = { ...prev, ...updates };
            return next;
        });
    };

    const toggleTimer = () => {

        updateState({ isActive: !state.isActive });
    };

    const resetTimer = () => updateState({
        round: 1,
        timeLeft: prepTime,
        isRest: false,
        isPreparing: true,
        isActive: false
    });

    const skipToNextRound = () => {
        hasSpokenCountdownRef.current.clear(); // Reset countdown

        if (state.isPreparing) {
            // Skip preparation, go straight to round 1
            Speech.speak("Inicia!", {
                language: 'es-ES',
                pitch: 1.1,
                rate: 0.9,
            });
            updateState({
                isPreparing: false,
                isRest: false,
                round: 1,
                timeLeft: getRoundDuration(1)
            });
        } else if (state.isRest) {
            // Skip rest, go to next round
            if (state.round < state.totalRounds) {
                const nextRound = state.round + 1;
                Speech.speak(`Inicia!`, {
                    language: 'es-ES',
                    pitch: 1.1,
                    rate: 0.9,
                });
                updateState({
                    round: nextRound,
                    isRest: false,
                    timeLeft: getRoundDuration(nextRound)
                });
            }
        } else {
            // Skip current round, go to rest
            Speech.speak("Descansa", {
                language: 'es-ES',
                pitch: 0.9,
                rate: 0.8,
            });
            updateState({
                isRest: true,
                timeLeft: getRestDuration(state.round)
            });
        }
    };

    return { state, toggleTimer, resetTimer, skipToNextRound };
};
