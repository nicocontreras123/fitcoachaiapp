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
        urlScheme: 'youtubemusic://',
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
 */
export async function detectInstalledMusicApps(): Promise<MusicApp[]> {
    const installedApps: MusicApp[] = [];

    for (const [appKey, config] of Object.entries(MUSIC_APPS)) {
        try {
            let canOpen = false;

            // On Android, try both URL scheme and package name
            if (Platform.OS === 'android' && config.packageName) {
                // Try package name first (more reliable on Android)
                try {
                    canOpen = await Linking.canOpenURL(`intent://#Intent;package=${config.packageName};end`);
                } catch (e) {
                    // Fallback to URL scheme
                    canOpen = await Linking.canOpenURL(config.urlScheme);
                }
            } else {
                // iOS uses URL schemes
                canOpen = await Linking.canOpenURL(config.urlScheme);
            }

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
        const canOpen = await Linking.canOpenURL(config.urlScheme);
        if (canOpen) {
            await Linking.openURL(config.urlScheme);
            console.log(`🎵 [MUSIC_APP] Opened ${config.name}`);
            return true;
        } else {
            console.warn(`⚠️ [MUSIC_APP] Cannot open ${config.name}`);
            return false;
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
