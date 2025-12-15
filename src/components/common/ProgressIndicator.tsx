import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

interface ProgressIndicatorProps {
    current: number;
    total: number;
    onBack?: () => void;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
    current,
    total,
    onBack,
}) => {
    return (
        <View style={styles.container}>
            {/* Back Button */}
            {onBack && (
                <Pressable onPress={onBack} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
                </Pressable>
            )}

            {/* Progress Dots */}
            <View style={styles.dotsContainer}>
                {Array.from({ length: total }).map((_, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === current;
                    const isCompleted = stepNumber < current;

                    return (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                isActive && styles.dotActive,
                                isCompleted && styles.dotCompleted,
                            ]}
                        />
                    );
                })}
            </View>

            {/* Spacer for alignment */}
            <View style={styles.spacer} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        position: 'absolute',
        left: 0,
        right: 0,
        justifyContent: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4b5563',
    },
    dotActive: {
        width: 32,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary.DEFAULT,
    },
    dotCompleted: {
        backgroundColor: COLORS.primary.DEFAULT,
    },
    spacer: {
        width: 40,
    },
});
