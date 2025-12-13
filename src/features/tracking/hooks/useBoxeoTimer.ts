import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

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

    const channelRef = useRef<any>(null);
    const hasSpokenCountdownRef = useRef<Set<number>>(new Set());
    const tickSoundRef = useRef<Audio.Sound | null>(null);
    const bellSoundRef = useRef<Audio.Sound | null>(null);
    const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Load sounds once on mount
    useEffect(() => {
        const loadSounds = async () => {
            try {
                // Configure audio mode
                await Audio.setAudioModeAsync({
                    playsInSilentModeIOS: true,
                    staysActiveInBackground: false,
                    shouldDuckAndroid: false,
                });

                // Load the tick sound
                const { sound: tickSound } = await Audio.Sound.createAsync(
                    require('../../../../assets/tictac.mp3'),
                    {
                        shouldPlay: false,
                        volume: 0.8,
                        isLooping: true // Loop the sound continuously
                    }
                );
                tickSoundRef.current = tickSound;
                console.log('Tick sound loaded successfully with volume:', 0.8);

                // Load the bell sound
                const { sound: bellSound } = await Audio.Sound.createAsync(
                    require('../../../../assets/campana.mp3'),
                    {
                        shouldPlay: false,
                        volume: 1.0,
                        isLooping: false
                    }
                );
                bellSoundRef.current = bellSound;
                console.log('Bell sound loaded successfully');
            } catch (error) {
                console.error('Error loading sounds:', error);
            }
        };

        loadSounds();

        // Cleanup on unmount
        return () => {
            if (tickSoundRef.current) {
                tickSoundRef.current.unloadAsync().catch(() => { });
            }
            if (bellSoundRef.current) {
                bellSoundRef.current.unloadAsync().catch(() => { });
            }
        };
    }, []);

    // Play/pause tick-tack sound based on timer state
    useEffect(() => {
        const startTickSound = async () => {
            if (tickSoundRef.current) {
                try {
                    const status = await tickSoundRef.current.getStatusAsync();
                    if (status.isLoaded && !status.isPlaying) {
                        await tickSoundRef.current.playAsync();
                        console.log('Tick sound started (looping)');
                    }
                } catch (error) {
                    console.log('Error starting tick sound:', error);
                }
            }
        };

        const stopTickSound = async () => {
            if (tickSoundRef.current) {
                try {
                    const status = await tickSoundRef.current.getStatusAsync();
                    if (status.isLoaded && status.isPlaying) {
                        await tickSoundRef.current.stopAsync();
                        console.log('Tick sound stopped');
                    }
                } catch (error) {
                    console.log('Error stopping tick sound:', error);
                }
            }
        };

        // Verificar si los sonidos están habilitados
        const soundsEnabled = config?.timerSoundEnabled !== false;

        // Reproducir tictac cuando está activo (incluyendo preparación) Y sonidos habilitados
        if (state.isActive && soundsEnabled) {
            console.log('Starting tick sound - timer is active');
            startTickSound();
        } else {
            console.log('Timer paused - stopping tick sound');
            stopTickSound();
        }

        return () => {
            stopTickSound();
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
        // Supabase Realtime Sync
        channelRef.current = supabase
            .channel(`boxeo_timer:${sessionId}`)
            .on('broadcast', { event: 'sync_timer' }, ({ payload }) => {
                setState(prev => ({ ...prev, ...payload }));
            })
            .subscribe();

        return () => {
            if (channelRef.current) supabase.removeChannel(channelRef.current);
        };
    }, [sessionId]);

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

    const playBellSound = async () => {
        // Verificar si los sonidos están habilitados
        if (config?.timerSoundEnabled === false) {
            console.log('Bell sound disabled by user');
            return;
        }

        if (bellSoundRef.current) {
            try {
                // Stop and rewind to beginning
                await bellSoundRef.current.stopAsync();
                await bellSoundRef.current.setPositionAsync(0);
                // Play the bell
                await bellSoundRef.current.playAsync();
                console.log('Bell sound played');
            } catch (error) {
                console.error('Error playing bell sound:', error);
            }
        }
    };

    const updateState = (updates: Partial<TimerState>) => {
        setState(prev => {
            const next = { ...prev, ...updates };
            channelRef.current?.send({
                type: 'broadcast',
                event: 'sync_timer',
                payload: next,
            });
            return next;
        });
    };

    const toggleTimer = () => updateState({ isActive: !state.isActive });

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
