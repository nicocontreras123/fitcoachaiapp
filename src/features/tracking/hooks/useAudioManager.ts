import { useEffect, useCallback } from 'react';
import * as Speech from 'expo-speech';
import { useAudioPlayer, AudioSource, AudioPlayer } from 'expo-audio';
import { TimerPhase } from '../types/timer.types';
import { useSpotifyAudioControl } from './useSpotifyAudioControl';

/**
 * Audio Manager Hook
 * Centralizes all audio and voice functionality
 * Prevents duplicate audio logic across components
 * Integrates with Spotify audio ducking
 * 
 * SINGLETON PATTERN: Only one instance of audio players and refs exist
 */

interface AudioManagerConfig {
    voiceEnabled?: boolean;
    timerSoundEnabled?: boolean;
    language?: string;
    tickSoundSource?: AudioSource;
    bellSoundSource?: AudioSource;
}

// Singleton state - shared across all hook instances
let singletonTickPlayer: AudioPlayer | null = null;
let singletonBellPlayer: AudioPlayer | null = null;
let isTickPlaying = false;
let isSpeaking = false;
let isInitialized = false;

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

    // Audio players (these are still created per component, but their instances are stored in the singleton)
    const tickPlayer = useAudioPlayer(
        tickSoundSource || (require('../../../../assets/tictac.mp3') as AudioSource)
    );
    const bellPlayer = useAudioPlayer(
        bellSoundSource || (require('../../../../assets/campana.mp3') as AudioSource)
    );

    // Store players in singleton on first initialization
    useEffect(() => {
        if (!isInitialized && tickPlayer && bellPlayer) {
            console.log('🎵 [AUDIO_MANAGER] Initializing singleton audio players');
            singletonTickPlayer = tickPlayer;
            singletonBellPlayer = bellPlayer;
            isInitialized = true;

            // Set volumes
            if (singletonTickPlayer) {
                singletonTickPlayer.volume = 0.8;
            }
            if (singletonBellPlayer) {
                singletonBellPlayer.volume = 1.0;
            }
        }
    }, [tickPlayer, bellPlayer]);

    // Cleanup on unmount
    useEffect(() => {
        console.log('🎵 [AUDIO_MANAGER] Hook mounted/updated');

        return () => {
            console.log('🎵 [AUDIO_MANAGER] Cleanup - stopping audio');
            try {
                // Wrap in try-catch to avoid "released object" errors during unmount cleanup
                try {
                    if (singletonTickPlayer?.playing) {
                        singletonTickPlayer.pause();
                    }
                } catch (e) {
                    // Ignore release errors
                }

                try {
                    if (singletonBellPlayer?.playing) {
                        singletonBellPlayer.pause();
                    }
                } catch (e) {
                    // Ignore release errors
                }

                // Reset singleton state on unmount
                isTickPlaying = false;
                isSpeaking = false;
                console.log('🎵 [AUDIO_MANAGER] Singleton state reset');
            } catch (error) {
                // Ignore cleanup errors
            }
        };
    }, []);

    /**
     * Speak text if voice is enabled
     * Activates ducking to lower Spotify volume
     */
    const speak = useCallback(
        async (text: string, options?: any) => {
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
                // Check if TTS is available
                const isSpeechAvailable = await Speech.isSpeakingAsync();
                console.log('🎤 [AUDIO] TTS Status:', {
                    isSpeaking: isSpeechAvailable,
                    hasText: !!text,
                });

                // Stop any ongoing speech first
                if (isSpeechAvailable) {
                    console.log('🎤 [AUDIO] Stopping previous speech');
                    await Speech.stop();
                }

                // Activar ducking cuando empieza a hablar
                enableDucking();
                isSpeaking = true;

                console.log('🎤 [AUDIO] Calling Speech.speak with:', {
                    text,
                    language,
                    pitch: 0.65,
                    rate: 0.9,
                });

                // Set a timeout to detect if TTS is stuck
                const timeoutId = setTimeout(() => {
                    console.warn('⚠️ [AUDIO] Speech timeout - TTS may not be working properly');
                    console.warn('⚠️ [AUDIO] Check: 1) Volume is up, 2) TTS engine installed, 3) Spanish language available');
                }, 10000); // 10 second timeout

                Speech.speak(text, {
                    language,
                    pitch: 1.0,        // Try default pitch first
                    rate: 1.0,         // Try default rate first  
                    volume: 1.0,       // Volumen máximo
                    ...options,
                    onDone: () => {
                        clearTimeout(timeoutId);
                        console.log('✅ [AUDIO] Speech completed');
                        isSpeaking = false;
                        options?.onDone?.();
                    },
                    onError: (error: any) => {
                        clearTimeout(timeoutId);
                        console.error('❌ [AUDIO] Speech error:', error);
                        console.error('❌ [AUDIO] Error type:', typeof error);
                        console.error('❌ [AUDIO] Error keys:', error ? Object.keys(error) : 'null');
                        isSpeaking = false;
                        options?.onError?.(error);
                    },
                    onStopped: () => {
                        clearTimeout(timeoutId);
                        console.log('⏹️ [AUDIO] Speech stopped');
                        isSpeaking = false;
                    },
                });

                console.log('🎤 [AUDIO] Speech.speak called successfully');
            } catch (error) {
                console.error('❌ [AUDIO] Error speaking:', error);
                isSpeaking = false;
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
     * SINGLETON: Uses shared state to prevent multiple play calls
     */
    const startTickSound = useCallback(() => {
        if (!timerSoundEnabled || !singletonTickPlayer) {
            console.log('⏭️ [TICK_SOUND] Tick sound disabled or player not ready');
            return;
        }

        try {
            // Check singleton state first - prevents multiple play calls
            if (isTickPlaying) {
                console.log('⏩ [TICK_SOUND] Tick sound already playing (singleton check)');
                return;
            }

            console.log('▶️ [TICK_SOUND] Starting tick sound', {
                playerPlaying: singletonTickPlayer.playing,
                singletonPlaying: isTickPlaying
            });

            // Activar ducking cuando empieza el tick-tock
            enableDucking();

            singletonTickPlayer.loop = true;
            singletonTickPlayer.volume = 1.0; // Volumen máximo para que se escuche sobre Spotify
            singletonTickPlayer.play();
            isTickPlaying = true;
            console.log('✅ [TICK_SOUND] Tick sound started successfully, singleton state:', isTickPlaying);
        } catch (error: any) {
            // Handle released player error gracefully
            if (error?.message?.includes('already released') ||
                error?.message?.includes('received class java.lang.Integer')) {
                console.log('⚠️ [TICK_SOUND] Player was released, skipping tick sound');
                isTickPlaying = false;
                return;
            }
            console.error('❌ [TICK_SOUND] Error starting tick sound:', error);
        }
    }, [timerSoundEnabled, enableDucking]);

    /**
     * Stop tick-tack sound
     * NOTA: Mantiene el ducking activo para evitar pausas en Spotify
     */
    const stopTickSound = useCallback(() => {
        if (!singletonTickPlayer) {
            return;
        }

        try {
            // Check if player is valid before accessing properties
            // The error "Cannot use shared object that was already released" happens here
            // if we try to access properties of a released player
            try {
                if (singletonTickPlayer.playing || isTickPlaying) {
                    singletonTickPlayer.pause();
                    isTickPlaying = false;
                    console.log('⏸️ [TICK_SOUND] Tick sound stopped');

                    // OPTIMIZACIÓN: No desactivar ducking durante el entrenamiento
                    // Mantenerlo activo evita pausas constantes en Spotify
                    // El ducking se maneja automáticamente por el sistema de audio
                }
            } catch (innerError: any) {
                // If the player is already released, we can assume it's stopped and ignore the error
                if (innerError?.message?.includes('already released') ||
                    innerError?.message?.includes('received class java.lang.Integer')) {
                    isTickPlaying = false;
                    return;
                }
                throw innerError;
            }
        } catch (error) {
            console.error('❌ [AUDIO] Error stopping tick sound:', error);
        }
    }, []);

    /**
     * Play bell sound
     */
    const playBell = useCallback(() => {
        if (!timerSoundEnabled || !singletonBellPlayer) return;

        try {
            singletonBellPlayer.seekTo(0);
            singletonBellPlayer.play();
        } catch (error: any) {
            // Handle released player error gracefully
            if (error?.message?.includes('already released') ||
                error?.message?.includes('received class java.lang.Integer')) {
                console.log('⚠️ [BELL_SOUND] Player was released, skipping bell sound');
                return;
            }
            console.error('❌ [BELL_SOUND] Error playing bell sound:', error);
        }
    }, [timerSoundEnabled]);

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
        tickPlayer: singletonTickPlayer,
        bellPlayer: singletonBellPlayer,
    };
};
