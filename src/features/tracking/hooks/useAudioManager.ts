import { useEffect, useRef, useCallback } from 'react';
import * as Speech from 'expo-speech';
import { useAudioPlayer, AudioSource } from 'expo-audio';
import { TimerPhase } from '../types/timer.types';
import { useSpotifyAudioControl } from './useSpotifyAudioControl';

/**
 * Audio Manager Hook
 * Centralizes all audio and voice functionality
 * Prevents duplicate audio logic across components
 * Integrates with Spotify audio ducking
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

    // Spotify audio control
    const { enableDucking, disableDucking } = useSpotifyAudioControl();

    // Audio players
    const tickPlayer = useAudioPlayer(
        tickSoundSource || (require('../../../../assets/tictac.mp3') as AudioSource)
    );
    const bellPlayer = useAudioPlayer(
        bellSoundSource || (require('../../../../assets/campana.mp3') as AudioSource)
    );

    const isTickPlayingRef = useRef(false);
    const isSpeakingRef = useRef(false);

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
                // Wrap in try-catch to avoid "released object" errors during unmount cleanup
                try {
                    if (tickPlayer?.playing) {
                        tickPlayer.pause();
                    }
                } catch (e) {
                    // Ignore release errors
                }

                try {
                    if (bellPlayer?.playing) {
                        bellPlayer.pause();
                    }
                } catch (e) {
                    // Ignore release errors
                }
            } catch (error) {
                // Ignore cleanup errors
            }
        };
    }, [tickPlayer, bellPlayer]);

    /**
     * Speak text if voice is enabled
     * Activates ducking to lower Spotify volume
     */
    const speak = useCallback(
        (text: string, options?: any) => {
            console.log('🎤 [AUDIO] Speak called', {
                text,
                voiceEnabled,
                textValid: !!text && text !== 'undefined',
            });

            if (!voiceEnabled || !text || text === 'undefined') {
                console.log('⚠️ [AUDIO] Speak skipped', {
                    reason: !voiceEnabled ? 'voice disabled' : 'invalid text',
                });
                return;
            }

            try {
                // Activar ducking cuando empieza a hablar
                enableDucking();
                isSpeakingRef.current = true;


                Speech.speak(text, {
                    language,
                    pitch: 0.65,       // Voz mucho más grave (default: 1.0)
                    rate: 0.9,         // Ligeramente más lento para claridad
                    volume: 1.0,       // Volumen máximo para que se escuche sobre Spotify
                    ...options,
                    onDone: () => {

                        // Desactivar ducking cuando termina de hablar
                        isSpeakingRef.current = false;
                        // Solo desactivar si el tick tampoco está sonando
                        if (!isTickPlayingRef.current) {
                            disableDucking();
                        }
                        options?.onDone?.();
                    },
                    onError: (error: any) => {
                        console.error('❌ [AUDIO] Speech error:', error);
                        isSpeakingRef.current = false;
                        if (!isTickPlayingRef.current) {
                            disableDucking();
                        }
                        options?.onError?.(error);
                    },
                });
            } catch (error) {
                console.error('❌ [AUDIO] Error speaking:', error);
                isSpeakingRef.current = false;
                if (!isTickPlayingRef.current) {
                    disableDucking();
                }
            }
        },
        [voiceEnabled, language, enableDucking, disableDucking]
    );

    /**
     * Speak countdown numbers (3, 2, 1)
     */
    const speakCountdown = useCallback(
        (count: number) => {
            speak(count.toString(), {
                pitch: 0.65,   // Mismo tono grave que el resto
                rate: 0.85,    // Pausado pero claro
            });
        },
        [speak]
    );

    /**
     * Start tick-tack sound
     * Activates ducking to lower Spotify volume
     */
    const startTickSound = useCallback(() => {
        if (!timerSoundEnabled || !tickPlayer) {
            return;
        }

        try {
            if (!tickPlayer.playing && !isTickPlayingRef.current) {
                // Activar ducking cuando empieza el tick-tock
                enableDucking();

                tickPlayer.loop = true;
                tickPlayer.volume = 1.0; // Volumen máximo para que se escuche sobre Spotify
                tickPlayer.play();
                isTickPlayingRef.current = true;

            }
        } catch (error) {
            console.error('❌ [AUDIO] Error starting tick sound:', error);
        }
    }, [timerSoundEnabled, tickPlayer, enableDucking]);

    /**
     * Stop tick-tack sound
     * Disables ducking to restore Spotify volume (if not speaking)
     */
    const stopTickSound = useCallback(() => {
        if (!tickPlayer) {
            return;
        }

        try {
            // Check if player is valid before accessing properties
            // The error "Cannot use shared object that was already released" happens here
            // if we try to access properties of a released player
            try {
                if (tickPlayer.playing || isTickPlayingRef.current) {
                    tickPlayer.pause();
                    isTickPlayingRef.current = false;

                    // Desactivar ducking solo si tampoco está hablando
                    if (!isSpeakingRef.current) {
                        disableDucking();

                    }
                }
            } catch (innerError: any) {
                // If the player is already released, we can assume it's stopped and ignore the error
                if (innerError?.message?.includes('already released') ||
                    innerError?.message?.includes('received class java.lang.Integer')) {
                    isTickPlayingRef.current = false;
                    // Still try to disable ducking if needed
                    if (!isSpeakingRef.current) {
                        disableDucking();
                    }
                    return;
                }
                throw innerError;
            }
        } catch (error) {
            console.error('❌ [AUDIO] Error stopping tick sound:', error);
        }
    }, [tickPlayer, disableDucking]);

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
            console.log('💪 [AUDIO] Announce exercise called', {
                exerciseName,
                details,
                valid: !!exerciseName && exerciseName !== 'undefined',
            });

            if (!exerciseName || exerciseName === 'undefined') {

                return;
            }

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
                pitch: 0.65,   // Voz mucho más grave y autoritaria
                rate: 0.85,    // Más lento para impacto
            });
        },
        [speak, playBell]
    );

    /**
     * Announce rest (for boxing)
     */
    const announceRest = useCallback(() => {
        speak('Descansa', {
            pitch: 0.65,   // Mismo tono grave que el resto
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
