import { useEffect, useCallback } from 'react';
import { Linking, Alert, Platform } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';

/**
 * Hook para controlar la integración de audio con Spotify
 * Maneja el ducking de audio (bajar volumen de Spotify cuando suena el timer)
 */
export const useSpotifyAudioControl = () => {
    // Configurar audio session para permitir audio en background y ducking
    useEffect(() => {
        configureAudioSession();
    }, []);

    const configureAudioSession = async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true, // Baja el volumen de otras apps en Android
                playThroughEarpieceAndroid: false,

                // iOS audio mixing
                interruptionModeIOS: InterruptionModeIOS.DuckOthers, // Baja el volumen de Spotify

                // Android audio mixing
                interruptionModeAndroid: InterruptionModeAndroid.DuckOthers, // Baja el volumen de Spotify
            });

            console.log('🎵 Audio session configured for Spotify ducking');
        } catch (error) {
            console.error('❌ Error configuring audio session:', error);
        }
    };

    /**
     * Activa el ducking - baja el volumen de Spotify
     * Llamar cuando empiece a sonar el tick-tock o la voz
     */
    const enableDucking = useCallback(async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
                interruptionModeIOS: InterruptionModeIOS.DuckOthers,
                interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
            });
            console.log('🔉 Ducking enabled - Spotify volume lowered');
        } catch (error) {
            console.error('❌ Error enabling ducking:', error);
        }
    }, []);

    /**
     * Desactiva el ducking - vuelve el volumen normal de Spotify
     * Llamar cuando se detenga el tick-tock o la voz
     */
    const disableDucking = useCallback(async () => {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: false, // Desactiva el ducking
                playThroughEarpieceAndroid: false,
                interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
                interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            });
            console.log('🔊 Ducking disabled - Spotify volume restored');
        } catch (error) {
            console.error('❌ Error disabling ducking:', error);
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
            const canOpen = await Linking.canOpenURL(spotifyAppUrl);

            if (canOpen) {
                // Abrir app de Spotify
                await Linking.openURL(spotifyAppUrl);
                console.log('📱 Opened Spotify app');
            } else {
                // Si no tiene la app instalada, preguntar si quiere abrir la web
                if (Platform.OS === 'web') {
                    window.open(spotifyWebUrl, '_blank');
                } else {
                    Alert.alert(
                        'Spotify no instalado',
                        '¿Deseas abrir Spotify en el navegador?',
                        [
                            {
                                text: 'Cancelar',
                                style: 'cancel',
                            },
                            {
                                text: 'Abrir',
                                onPress: () => Linking.openURL(spotifyWebUrl),
                            },
                        ]
                    );
                }
            }
        } catch (error) {
            console.error('❌ Error opening Spotify:', error);
            Alert.alert('Error', 'No se pudo abrir Spotify');
        }
    }, []);

    return {
        openSpotify,
        enableDucking,
        disableDucking,
    };
};
