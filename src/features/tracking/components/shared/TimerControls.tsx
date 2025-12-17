import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TimerControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onSkip?: () => void;
    onPrevious?: () => void;
    onReset?: () => void;
    onComplete?: () => void;
    playButtonColor?: string;
    disabled?: boolean;
    disablePrevious?: boolean;
    disableSkip?: boolean;
    disableReset?: boolean;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
    isPlaying,
    onPlayPause,
    onSkip,
    onPrevious,
    onReset,
    onComplete,
    playButtonColor = '#ec1313',
    disabled = false,
    disablePrevious = false,
    disableSkip = false,
    disableReset = false,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.controlButtons}>
                {onReset && (
                    <Pressable
                        style={styles.skipButton}
                        onPress={onReset}
                        disabled={disabled || disableReset}
                    >
                        <MaterialCommunityIcons
                            name="restart"
                            size={28}
                            color={disabled || disableReset ? 'rgba(255,255,255,0.2)' : '#ffffff'}
                        />
                    </Pressable>
                )}

                {onPrevious && (
                    <Pressable
                        style={styles.skipButton}
                        onPress={onPrevious}
                        disabled={disabled || disablePrevious}
                    >
                        <MaterialCommunityIcons
                            name="skip-previous"
                            size={28}
                            color={
                                disabled || disablePrevious
                                    ? 'rgba(255,255,255,0.2)'
                                    : '#ffffff'
                            }
                        />
                    </Pressable>
                )}

                <Pressable
                    style={[styles.playButton, { backgroundColor: playButtonColor }]}
                    onPress={onPlayPause}
                    disabled={disabled}
                >
                    <MaterialCommunityIcons
                        name={isPlaying ? 'pause' : 'play'}
                        size={42}
                        color="#ffffff"
                    />
                </Pressable>

                {onComplete ? (
                    <Pressable
                        style={[styles.skipButton, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}
                        onPress={onComplete}
                        disabled={disabled}
                    >
                        <MaterialCommunityIcons
                            name="check"
                            size={28}
                            color="#10b981"
                        />
                    </Pressable>
                ) : onSkip ? (
                    <Pressable
                        style={styles.skipButton}
                        onPress={onSkip}
                        disabled={disabled || disableSkip}
                    >
                        <MaterialCommunityIcons
                            name="skip-next"
                            size={28}
                            color={
                                disabled || disableSkip
                                    ? 'rgba(255,255,255,0.2)'
                                    : '#ffffff'
                            }
                        />
                    </Pressable>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
    },
    controlButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    skipButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
