import React from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSpotifyAudioControl } from '../../hooks/useSpotifyAudioControl';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SpotifyButtonProps {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    style?: any;
}

const getInitialPosition = (position: SpotifyButtonProps['position']) => {
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

export function SpotifyButton({ position = 'top-right', style }: SpotifyButtonProps) {
    const { openSpotify } = useSpotifyAudioControl();
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    // Get initial position based on prop
    const initialPosition = getInitialPosition(position);
    const pan = React.useRef(new Animated.ValueXY(initialPosition)).current;

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

                if (isTap) {
                    openSpotify();
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
            <View style={styles.button}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="spotify" size={28} color="#1DB954" />
                </View>
            </View>
        </Animated.View>
    );
}

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
        borderColor: '#1DB954',
        shadowColor: '#1DB954',
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
