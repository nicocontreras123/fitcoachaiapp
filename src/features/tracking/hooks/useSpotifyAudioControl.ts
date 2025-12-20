import { useEffect, useCallback, useRef } from 'react';
import { Linking, Alert, Platform } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

/**
 * Hook para controlar la integración de audio con Spotify
 * Maneja el ducking de audio (bajar volumen de Spotify cuando suena el timer)
 */
export const useSpotifyAudioControl = () => {
    const isDuckingEnabledRef = useRef(false);

    // Configurar audio session para permitir audio en background y ducking
    useEffect(() => {
        configureAudioSession();
    }, []);

    const configureAudioSession = async () => {
        try {
            console.log('🎵 [SPOTIFY_AUDIO] Configuring audio session for mixing');
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: false, // Changed: Don't duck, mix instead
                playThroughEarpieceAndroid: false,

                // iOS audio mixing - Mix instead of Duck to avoid pausing Spotify
                interruptionModeIOS: InterruptionModeIOS.MixWithOthers,

                // Android audio mixing - Mix instead of Duck
                interruptionModeAndroid: InterruptionModeAndroid.DuckOthers, // Keep duck for Android as it works better
            });

            isDuckingEnabledRef.current = true;
            console.log('✅ [SPOTIFY_AUDIO] Audio session configured successfully');
        } catch (error) {
            console.error('❌ [SPOTIFY_AUDIO] Error configuring audio session:', error);
        }
    };

    /**
     * Activa el ducking - baja el volumen de Spotify
     * Llamar cuando empiece a sonar el tick-tock o la voz
     * OPTIMIZADO: Solo cambia el modo si no está ya activado
     */
    const enableDucking = useCallback(async () => {
        // Si ya está activado, no hacer nada (evita pausas en Spotify)
        if (isDuckingEnabledRef.current) {
            console.log('🎵 [SPOTIFY_AUDIO] Ducking already enabled, skipping');
            return;
        }

        try {
            console.log('🎵 [SPOTIFY_AUDIO] Enabling audio mixing');
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: false,
                playThroughEarpieceAndroid: false,
                interruptionModeIOS: InterruptionModeIOS.MixWithOthers, // Mix instead of Duck
                interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
            });

            isDuckingEnabledRef.current = true;
            console.log('✅ [SPOTIFY_AUDIO] Audio mixing enabled');
        } catch (error) {
            console.error('❌ [SPOTIFY_AUDIO] Error enabling ducking:', error);
        }
    }, []);

    /**
     * Desactiva el ducking - vuelve el volumen normal de Spotify
     * Llamar cuando se detenga el tick-tock o la voz
     * OPTIMIZADO: Solo cambia el modo si está activado
     */
    const disableDucking = useCallback(async () => {
        // Si ya está desactivado, no hacer nada (evita pausas en Spotify)
        if (!isDuckingEnabledRef.current) {
            console.log('🎵 [SPOTIFY_AUDIO] Ducking already disabled, skipping');
            return;
        }

        try {
            console.log('🎵 [SPOTIFY_AUDIO] Disabling audio mixing');
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: false,
                playThroughEarpieceAndroid: false,
                interruptionModeIOS: InterruptionModeIOS.MixWithOthers, // Keep mixing
                interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            });

            isDuckingEnabledRef.current = false;
            console.log('✅ [SPOTIFY_AUDIO] Audio mixing disabled');
        } catch (error) {
            console.error('❌ [SPOTIFY_AUDIO] Error disabling ducking:', error);
        }
    }, []);

    /**
     * Abre Spotify
     * Intenta abrir la app de Spotify, si no está instalada abre la web
     */
    const openSpotify = useCallback(async () => {
        const spotifyAppUrl = 'spotify://';
        const spotifyWebUrl = 'https://open.spotify.com';

        try {
            // Intentar abrir la app directamente
            // Esto es más confiable en Android 11+ donde canOpenURL puede fallar falsamente
            // si no están configuradas las queries en el manifiesto
            await Linking.openURL(spotifyAppUrl);

        } catch (error) {


            // Si falla abrir la app, ofrecer abrir la web
            if (Platform.OS === 'web') {
                Linking.openURL(spotifyWebUrl);
            } else {
                Alert.alert(
                    'Spotify no detectado',
                    'No pudimos abrir la app de Spotify directamente. ¿Deseas abrir la versión web?',
                    [
                        {
                            text: 'Cancelar',
                            style: 'cancel',
                        },
                        {
                            text: 'Abrir Web',
                            onPress: () => Linking.openURL(spotifyWebUrl),
                        },
                    ]
                );
            }
        }
    }, []);

    return {
        openSpotify,
        enableDucking,
        disableDucking,
    };
};
