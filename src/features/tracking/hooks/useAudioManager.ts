import { useEffect, useRef, useCallback } from 'react';
import * as Speech from 'expo-speech';
import { useAudioPlayer, AudioSource } from 'expo-audio';
import { TimerPhase } from '../types/timer.types';

/**
 * Audio Manager Hook
 * Centralizes all audio and voice functionality
 * Prevents duplicate audio logic across components
 */

interface AudioManagerConfig {
    voiceEnabled?: boolean;
    timerSoundEnabled?: boolean;
    language?: string;
    tickSoundSource?: AudioSource;
    bellSoundSource?: AudioSource;
}

export const useAudioManager = (config: AudioManagerConfig = {}) => {
    const {
        voiceEnabled = true,
        timerSoundEnabled = true,
        language = 'es-ES',
        tickSoundSource,
        bellSoundSource,
    } = config;

    // Audio players
    const tickPlayer = useAudioPlayer(
        tickSoundSource || (require('../../../../assets/tictac.mp3') as AudioSource)
    );
    const bellPlayer = useAudioPlayer(
        bellSoundSource || (require('../../../../assets/campana.mp3') as AudioSource)
    );

    const isTickPlayingRef = useRef(false);

    // Set volumes
    useEffect(() => {
        if (tickPlayer) {
            tickPlayer.volume = 0.8;
        }
        if (bellPlayer) {
            bellPlayer.volume = 1.0;
        }
    }, [tickPlayer, bellPlayer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            try {
                if (tickPlayer?.playing) {
                    tickPlayer.pause();
                }
                if (bellPlayer?.playing) {
                    bellPlayer.pause();
                }
            } catch (error) {
                // Ignore cleanup errors
            }
        };
    }, [tickPlayer, bellPlayer]);

    /**
     * Speak text if voice is enabled
     */
    const speak = useCallback(
        (text: string, options?: any) => {
            if (!voiceEnabled) return;

            Speech.speak(text, {
                language,
                ...options,
            });
        },
        [voiceEnabled, language]
    );

    /**
     * Speak countdown numbers (3, 2, 1)
     */
    const speakCountdown = useCallback(
        (count: number) => {
            speak(count.toString(), {
                pitch: 1.2,
                rate: 0.8,
            });
        },
        [speak]
    );

    /**
     * Start tick-tack sound
     */
    const startTickSound = useCallback(() => {
        if (!timerSoundEnabled || !tickPlayer) {

            return;
        }

        try {
            if (!tickPlayer.playing && !isTickPlayingRef.current) {

                tickPlayer.loop = true;
                tickPlayer.play();
                isTickPlayingRef.current = true;

            } else {

            }
        } catch (error) {
            console.error('❌ [AUDIO] Error starting tick sound:', error);
        }
    }, [timerSoundEnabled, tickPlayer]);

    /**
     * Stop tick-tack sound
     */
    const stopTickSound = useCallback(() => {
        if (!tickPlayer) {

            return;
        }

        try {
            if (tickPlayer.playing || isTickPlayingRef.current) {

                tickPlayer.pause();
                isTickPlayingRef.current = false;

            }
        } catch (error) {
            console.error('❌ [AUDIO] Error stopping tick sound:', error);
        }
    }, [tickPlayer]);

    /**
     * Play bell sound
     */
    const playBell = useCallback(() => {
        if (!timerSoundEnabled || !bellPlayer) return;

        try {
            bellPlayer.seekTo(0);
            bellPlayer.play();
        } catch (error) {
            console.error('Error playing bell sound:', error);
        }
    }, [timerSoundEnabled, bellPlayer]);

    /**
     * Announce phase transition
     */
    const announcePhaseTransition = useCallback(
        (fromPhase: TimerPhase, toPhase: TimerPhase, extraInfo?: string) => {
            const messages: Record<string, string> = {
                'preparing->warmup': 'Comienza el calentamiento',
                'warmup->workout': 'Comienza el entrenamiento',
                'workout->cooldown': 'Comienza el enfriamiento',
                'cooldown->finished': 'Entrenamiento finalizado, excelente trabajo',
                'preparing->workout': 'Comienza el entrenamiento',
            };

            const key = `${fromPhase}->${toPhase}`;
            const message = messages[key] || extraInfo;

            if (message) {
                speak(message);
            }

            // Play bell for major transitions
            if (
                toPhase === 'workout' ||
                toPhase === 'cooldown' ||
                toPhase === 'finished'
            ) {
                playBell();
            }
        },
        [speak, playBell]
    );

    /**
     * Announce exercise
     */
    const announceExercise = useCallback(
        (exerciseName: string, details?: string) => {
            const message = details
                ? `${exerciseName}, ${details}`
                : exerciseName;
            speak(message);
        },
        [speak]
    );

    /**
     * Announce set completion
     */
    const announceSetComplete = useCallback(
        (isRest: boolean = false) => {
            const message = isRest
                ? 'Serie completada, descansa'
                : 'Serie completada';
            speak(message);
        },
        [speak]
    );

    /**
     * Announce rest end
     */
    const announceRestEnd = useCallback(() => {
        speak('Descanso terminado, siguiente serie');
    }, [speak]);

    /**
     * Announce round start (for boxing)
     */
    const announceRoundStart = useCallback(
        (roundNumber?: number) => {
            playBell();
            speak(roundNumber ? `Round ${roundNumber}, Inicia!` : 'Inicia!', {
                pitch: 1.1,
                rate: 0.9,
            });
        },
        [speak, playBell]
    );

    /**
     * Announce rest (for boxing)
     */
    const announceRest = useCallback(() => {
        speak('Descansa', {
            pitch: 0.9,
            rate: 0.8,
        });
    }, [speak]);

    return {
        // Basic controls
        speak,
        speakCountdown,
        startTickSound,
        stopTickSound,
        playBell,

        // High-level announcements
        announcePhaseTransition,
        announceExercise,
        announceSetComplete,
        announceRestEnd,
        announceRoundStart,
        announceRest,

        // Players (for advanced use)
        tickPlayer,
        bellPlayer,
    };
};
