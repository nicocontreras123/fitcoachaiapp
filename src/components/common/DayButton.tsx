import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/theme';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface DayButtonProps {
    label: string;
    isSelected: boolean;
    onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const DayButton: React.FC<DayButtonProps> = ({
    label,
    isSelected,
    onPress,
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(isSelected ? 1.05 : 0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
                styles.button,
                animatedStyle,
                isSelected && styles.buttonSelected,
            ]}
        >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {label}
            </Text>
            {isSelected && <View style={styles.indicator} />}
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    button: {
        aspectRatio: 1,
        borderRadius: 8,
        backgroundColor: '#162e20',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        minHeight: 70,
        minWidth: 70,
    },
    buttonSelected: {
        backgroundColor: COLORS.primary.DEFAULT,
        borderColor: COLORS.primary.DEFAULT,
        shadowColor: COLORS.primary.DEFAULT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    label: {
        fontSize: 10,
        fontFamily: 'Lexend_700Bold',
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
    },
    labelSelected: {
        color: COLORS.background.dark,
    },
    indicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.background.dark,
        marginTop: 2,
    },
});
