import { useEffect } from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

/**
 * Hook to configure audio session for background playback
 * This enables audio (voice coaching) to continue playing when:
 * - The screen is locked
 * - The app is in the background
 * - The device is in silent mode (iOS)
 */
export const useBackgroundAudio = () => {
    useEffect(() => {
        const configureAudioSession = async () => {
            try {
                console.log('🔊 [BACKGROUND_AUDIO] Configuring audio session...');

                // Configure audio mode for background playback
                await Audio.setAudioModeAsync({
                    // Allow audio to play in background
                    staysActiveInBackground: true,

                    // iOS specific: Play audio even when device is in silent mode
                    playsInSilentModeIOS: true,

                    // iOS specific: Allow mixing with other audio (like music apps)
                    // Set to false if you want to pause other audio when your app plays
                    allowsRecordingIOS: false,

                    // Android specific: Audio focus mode
                    // DoNotMix - Your app takes full audio focus
                    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,

                    // iOS specific: How to handle interruptions
                    // DoNotMix - Pause other audio
                    interruptionModeIOS: InterruptionModeIOS.DoNotMix,

                    // Should duck (lower volume of) other audio when playing
                    shouldDuckAndroid: true,

                    // Play through earpiece or speaker
                    // false = use earpiece for calls, speaker for media (default)
                    // true = always use speaker
                    playThroughEarpieceAndroid: false,
                });

                console.log('✅ [BACKGROUND_AUDIO] Audio session configured successfully');
            } catch (error) {
                console.error('❌ [BACKGROUND_AUDIO] Failed to configure audio session:', error);
            }
        };

        configureAudioSession();

        // Cleanup: Reset audio mode when component unmounts
        return () => {
            const resetAudioSession = async () => {
                try {
                    await Audio.setAudioModeAsync({
                        staysActiveInBackground: false,
                        playsInSilentModeIOS: false,
                        allowsRecordingIOS: false,
                        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                        shouldDuckAndroid: false,
                        playThroughEarpieceAndroid: false,
                    });
                    console.log('🔊 [BACKGROUND_AUDIO] Audio session reset');
                } catch (error) {
                    console.error('❌ [BACKGROUND_AUDIO] Failed to reset audio session:', error);
                }
            };

            resetAudioSession();
        };
    }, []);
};

/**
 * Alternative configuration for mixing with other audio (e.g., Spotify)
 * Use this if you want voice coaching to play over music
 */
export const useBackgroundAudioWithMixing = () => {
    useEffect(() => {
        const configureAudioSession = async () => {
            try {
                console.log('🔊 [BACKGROUND_AUDIO] Configuring audio session with mixing...');

                await Audio.setAudioModeAsync({
                    staysActiveInBackground: true,
                    playsInSilentModeIOS: true,
                    allowsRecordingIOS: false,

                    // Allow mixing with other audio (music apps)
                    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
                    interruptionModeIOS: InterruptionModeIOS.DuckOthers,

                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                });

                console.log('✅ [BACKGROUND_AUDIO] Audio session configured with mixing');
            } catch (error) {
                console.error('❌ [BACKGROUND_AUDIO] Failed to configure audio session:', error);
            }
        };

        configureAudioSession();

        return () => {
            const resetAudioSession = async () => {
                try {
                    await Audio.setAudioModeAsync({
                        staysActiveInBackground: false,
                        playsInSilentModeIOS: false,
                    });
                } catch (error) {
                    console.error('❌ [BACKGROUND_AUDIO] Failed to reset audio session:', error);
                }
            };

            resetAudioSession();
        };
    }, []);
};
