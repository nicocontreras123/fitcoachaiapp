import React from 'react';
import { Pressable, ImageBackground, StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface SportCardProps {
    title: string;
    description: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    imageUrl: string;
    isSelected: boolean;
    onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SportCard: React.FC<SportCardProps> = ({
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
                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                    style={styles.gradient}
                />
            </ImageBackground>

            {/* Selection Indicator */}
            <View style={[styles.indicator, isSelected && styles.indicatorSelected]}>
                {isSelected && (
                    <MaterialCommunityIcons name="check" size={20} color={COLORS.background.dark} />
                )}
            </View>

            {/* Content */}
            <View style={styles.content}>
                <MaterialCommunityIcons
                    name={icon}
                    size={32}
                    color={isSelected ? COLORS.primary.DEFAULT : 'rgba(255,255,255,0.8)'}
                    style={styles.icon}
                />
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    card: {
        aspectRatio: 3 / 4,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderWidth: 2,
        borderColor: COLORS.primary.DEFAULT,
        shadowColor: COLORS.primary.DEFAULT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    indicator: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicatorSelected: {
        borderColor: COLORS.primary.DEFAULT,
        backgroundColor: COLORS.primary.DEFAULT,
    },
    content: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
    },
    icon: {
        marginBottom: 4,
    },
    title: {
        fontSize: 20,
        fontFamily: 'Lexend_700Bold',
        color: '#ffffff',
        marginBottom: 2,
    },
    description: {
        fontSize: 12,
        fontFamily: 'Lexend_500Medium',
        color: '#d1d5db',
    },
});
