import React from 'react';
import { Pressable, ImageBackground, StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface GoalCardProps {
    title: string;
    description: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    imageUrl: string;
    isSelected: boolean;
    onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GoalCard: React.FC<GoalCardProps> = ({
    title,
    description,
    icon,
    imageUrl,
    isSelected,
    onPress,
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(1.02);
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
                styles.card,
                animatedStyle,
                isSelected && styles.cardSelected,
            ]}
        >
            {/* Background Image */}
            <ImageBackground
                source={{ uri: imageUrl }}
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                {/* Gradient Overlay */}
                <LinearGradient
                    colors={
                        isSelected
                            ? ['rgba(0,0,0,0)', 'rgba(19,236,91,0.1)', 'rgba(0,0,0,0.9)']
                            : ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.9)']
                    }
                    style={styles.gradient}
                />
            </ImageBackground>

            {/* Selection Indicator */}
            {isSelected && (
                <View style={styles.checkmark}>
                    <MaterialCommunityIcons name="check" size={18} color={COLORS.background.dark} />
                </View>
            )}

            {/* Content */}
            <View style={styles.content}>
                <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                    <MaterialCommunityIcons
                        name={icon}
                        size={28}
                        color={isSelected ? COLORS.background.dark : COLORS.primary.DEFAULT}
                    />
                </View>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    card: {
        aspectRatio: 16 / 10,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderWidth: 2,
        borderColor: COLORS.primary.DEFAULT,
        shadowColor: COLORS.primary.DEFAULT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    checkmark: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary.DEFAULT,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: COLORS.primary.DEFAULT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 8,
    },
    content: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        zIndex: 5,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconContainerSelected: {
        backgroundColor: COLORS.primary.DEFAULT,
        borderColor: COLORS.primary.DEFAULT,
        shadowColor: COLORS.primary.DEFAULT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    title: {
        fontSize: 20,
        fontFamily: 'Lexend_700Bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        fontFamily: 'Lexend_400Regular',
        color: '#d1d5db',
    },
});
