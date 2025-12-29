import { Linking, Platform } from 'react-native';

export type MusicApp = 'spotify' | 'youtube-music' | 'apple-music';

interface MusicAppConfig {
    name: string;
    urlScheme: string;
    packageName?: string; // For Android
    icon: string; // MaterialCommunityIcons name
    color: string;
}

const MUSIC_APPS: Record<MusicApp, MusicAppConfig> = {
    'spotify': {
        name: 'Spotify',
        urlScheme: 'spotify://',
        packageName: 'com.spotify.music',
        icon: 'spotify',
        color: '#1DB954',
    },
    'youtube-music': {
        name: 'YouTube Music',
        urlScheme: 'youtubemusic://',  // Official YouTube Music URL scheme
        packageName: 'com.google.android.apps.youtube.music',
        icon: 'youtube',
        color: '#FF0000',
    },
    'apple-music': {
        name: 'Apple Music',
        urlScheme: 'music://',
        icon: 'apple',
        color: '#FA243C',
    },
};

/**
 * Detect which music apps are installed on the device
 * Note: On Android, due to security restrictions, we can't reliably detect installed apps
 * without native modules. Instead, we show all apps and handle errors when opening.
 */
export async function detectInstalledMusicApps(): Promise<MusicApp[]> {
    // On Android, we can't reliably detect installed apps due to security restrictions
    // So we return all available apps (excluding Apple Music which is iOS-only)
    if (Platform.OS === 'android') {
        console.log('📱 [MUSIC_APP] Android detected - showing available music apps');
        return ['spotify', 'youtube-music'];
    }

    // On iOS, we can use URL schemes
    const installedApps: MusicApp[] = [];

    for (const [appKey, config] of Object.entries(MUSIC_APPS)) {
        try {
            const canOpen = await Linking.canOpenURL(config.urlScheme);
            if (canOpen) {
                installedApps.push(appKey as MusicApp);
                console.log(`✅ [MUSIC_APP] ${config.name} is installed`);
            } else {
                console.log(`❌ [MUSIC_APP] ${config.name} is not installed`);
            }
        } catch (error) {
            console.error(`Error checking ${config.name}:`, error);
        }
    }

    return installedApps;
}

/**
 * Open a specific music app
 */
export async function openMusicApp(app: MusicApp): Promise<boolean> {
    const config = MUSIC_APPS[app];
    if (!config) {
        console.error(`Unknown music app: ${app}`);
        return false;
    }

    try {
        if (Platform.OS === 'android' && config.packageName) {
            console.log(`🎵 [MUSIC_APP] Attempting to open ${config.name} on Android...`);

            // Special handling for YouTube Music using Intent URL
            if (app === 'youtube-music') {
                try {
                    // Try Intent URL first
                    const intentUrl = 'intent://music.youtube.com/#Intent;scheme=https;package=com.google.android.apps.youtube.music;end';
                    await Linking.openURL(intentUrl);
                    console.log(`✅ [MUSIC_APP] Opened ${config.name} via Intent URL`);
                    return true;
                } catch (intentError) {
                    console.log(`⚠️ [MUSIC_APP] Intent URL failed, trying HTTPS app link...`);
                    // Fallback to HTTPS app link
                    // If user has "Open links in app" enabled, Android will open YouTube Music
                    // Otherwise, it opens in browser
                    try {
                        await Linking.openURL('https://music.youtube.com');
                        console.log(`✅ [MUSIC_APP] Opened ${config.name} via HTTPS app link`);
                        return true;
                    } catch (httpsError) {
                        console.log(`⚠️ [MUSIC_APP] All methods failed for YouTube Music`);
                        return false;
                    }
                }
            }

            // For other apps (Spotify), try URL scheme first
            try {
                await Linking.openURL(config.urlScheme);
                console.log(`✅ [MUSIC_APP] Opened ${config.name} via URL scheme`);
                return true;
            } catch (urlError) {
                console.log(`⚠️ [MUSIC_APP] URL scheme failed, trying package launch...`);

                try {
                    // Fallback: Try to launch using package name with proper intent format
                    const packageIntent = `intent://launch#Intent;package=${config.packageName};scheme=app;end`;
                    await Linking.openURL(packageIntent);
                    console.log(`✅ [MUSIC_APP] Opened ${config.name} via package intent`);
                    return true;
                } catch (packageError) {
                    console.log(`⚠️ [MUSIC_APP] All methods failed, app may not be installed`);
                    return false;
                }
            }
        } else {
            // iOS uses URL schemes
            const canOpen = await Linking.canOpenURL(config.urlScheme);
            if (canOpen) {
                await Linking.openURL(config.urlScheme);
                console.log(`🎵 [MUSIC_APP] Opened ${config.name}`);
                return true;
            } else {
                console.warn(`⚠️ [MUSIC_APP] Cannot open ${config.name} - app may not be installed`);
                return false;
            }
        }
    } catch (error) {
        console.error(`❌ [MUSIC_APP] Error opening ${config.name}:`, error);
        return false;
    }
}

/**
 * Get music app configuration
 */
export function getMusicAppConfig(app: MusicApp): MusicAppConfig | null {
    return MUSIC_APPS[app] || null;
}

/**
 * Get all available music apps
 */
export function getAllMusicApps(): MusicApp[] {
    return Object.keys(MUSIC_APPS) as MusicApp[];
}
