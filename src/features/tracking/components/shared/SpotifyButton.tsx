import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '@/features/profile/store/userStore';
import { openMusicApp, getMusicAppConfig, detectInstalledMusicApps, MusicApp } from '@/services/musicAppService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MusicAppButtonProps {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    style?: any;
}

const getInitialPosition = (position: MusicAppButtonProps['position']) => {
    switch (position) {
        case 'top-left':
            return { x: 16, y: 80 };
        case 'top-right':
            return { x: SCREEN_WIDTH - 72, y: 80 }; // 56 button + 16 padding
        case 'bottom-left':
            return { x: 16, y: SCREEN_HEIGHT - 172 };
        case 'bottom-right':
            return { x: SCREEN_WIDTH - 72, y: SCREEN_HEIGHT - 172 };
        default:
            return { x: SCREEN_WIDTH - 72, y: 80 };
    }
};

export function MusicAppButton({ position = 'top-right', style }: MusicAppButtonProps) {
    const { userData } = useUserStore();
    const [shouldShow, setShouldShow] = useState(false);
    const [appConfig, setAppConfig] = useState<ReturnType<typeof getMusicAppConfig>>(null);

    // Use ref to avoid stale closure in panResponder
    const currentAppRef = React.useRef<MusicApp | null>(null);

    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    // Get initial position based on prop
    const initialPosition = getInitialPosition(position);
    const pan = React.useRef(new Animated.ValueXY(initialPosition)).current;

    // Check if user has a preferred app and if it's installed
    useEffect(() => {
        const checkMusicApp = async () => {
            const preferredApp = userData?.preferredMusicApp;

            // Update ref with current value
            currentAppRef.current = preferredApp || null;

            if (!preferredApp) {
                console.log('🎵 [MUSIC_BUTTON] No preferred music app configured');
                setShouldShow(false);
                return;
            }

            // Detect installed apps
            const installedApps = await detectInstalledMusicApps();

            // Check if preferred app is installed
            if (installedApps.includes(preferredApp)) {
                const config = getMusicAppConfig(preferredApp);
                setAppConfig(config);
                setShouldShow(true);
                console.log(`🎵 [MUSIC_BUTTON] Showing ${config?.name} button`);
            } else {
                console.log(`⚠️ [MUSIC_BUTTON] Preferred app ${preferredApp} not installed`);
                setShouldShow(false);
            }
        };

        checkMusicApp();
    }, [userData?.preferredMusicApp]);

    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: (pan.x as any)._value,
                    y: (pan.y as any)._value,
                });
                pan.setValue({ x: 0, y: 0 });

                Animated.spring(scaleAnim, {
                    toValue: 0.9,
                    useNativeDriver: false,
                }).start();
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (_, gesture) => {
                pan.flattenOffset();

                // Check if it was a tap (minimal movement)
                const isTap = Math.abs(gesture.dx) < 10 && Math.abs(gesture.dy) < 10;

                if (isTap && currentAppRef.current) {
                    openMusicApp(currentAppRef.current);
                }

                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 3,
                    tension: 40,
                    useNativeDriver: false,
                }).start();

                // Keep button within screen bounds
                const currentX = (pan.x as any)._value;
                const currentY = (pan.y as any)._value;

                const maxX = SCREEN_WIDTH - 72; // 56 button width + 16 padding
                const maxY = SCREEN_HEIGHT - 172; // 56 button height + 116 bottom padding

                const boundedX = Math.max(0, Math.min(currentX, maxX));
                const boundedY = Math.max(80, Math.min(currentY, maxY)); // 80 top padding

                if (currentX !== boundedX || currentY !== boundedY) {
                    Animated.spring(pan, {
                        toValue: { x: boundedX, y: boundedY },
                        useNativeDriver: false,
                    }).start();
                }
            },
        })
    ).current;

    // Don't render if no app is configured or installed
    if (!shouldShow || !appConfig) {
        return null;
    }

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.container,
                {
                    transform: [
                        { translateX: pan.x },
                        { translateY: pan.y },
                        { scale: scaleAnim },
                    ],
                },
                style,
            ]}
        >
            <View style={[styles.button, { borderColor: appConfig.color }]}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name={appConfig.icon as any} size={28} color={appConfig.color} />
                </View>
            </View>
        </Animated.View>
    );
}

// Keep SpotifyButton as alias for backward compatibility
export const SpotifyButton = MusicAppButton;

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 1000,
    },
    button: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
