import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

interface PrimaryButtonProps {
    onPress: () => void;
    children: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    onPress,
    children,
    icon,
    disabled = false,
    style,
    textStyle,
}) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.98);
        opacity.value = withTiming(1, { duration: 150 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
        opacity.value = withTiming(0, { duration: 150 });
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={[styles.button, animatedStyle, disabled && styles.disabled, style]}
        >
            {/* Hover overlay */}
            <Animated.View style={[styles.overlay, overlayStyle]} />

            {/* Content */}
            <View style={styles.content}>
                <Text style={[styles.text, textStyle]}>{children}</Text>
                {icon && (
                    <MaterialCommunityIcons
                        name={icon}
                        size={20}
                        color={COLORS.background.dark}
                        style={styles.icon}
                    />
                )}
            </View>
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 56,
        borderRadius: 12,
        backgroundColor: COLORS.primary.DEFAULT,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: COLORS.primary.DEFAULT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 8,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: COLORS.background.dark,
        textTransform: 'uppercase',
    },
    icon: {
        marginLeft: 8,
    },
    disabled: {
        opacity: 0.5,
    },
});
