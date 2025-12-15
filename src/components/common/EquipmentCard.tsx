import React from 'react';
import { Pressable, ImageBackground, StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface EquipmentCardProps {
    title: string;
    description: string;
    imageUrl: string;
    isSelected: boolean;
    onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
    title,
    description,
    imageUrl,
    isSelected,
    onPress,
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
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
                    <MaterialCommunityIcons name="check" size={16} color={COLORS.background.dark} />
                )}
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={[styles.description, isSelected && styles.descriptionSelected]}>
                    {description}
                </Text>
            </View>
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    card: {
        aspectRatio: 4 / 5,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    cardSelected: {
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
        top: 12,
        right: 12,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
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
        padding: 16,
        zIndex: 5,
    },
    title: {
        fontSize: 16,
        fontFamily: 'Lexend_700Bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    description: {
        fontSize: 12,
        fontFamily: 'Lexend_500Medium',
        color: '#9ca3af',
    },
    descriptionSelected: {
        color: '#d1d5db',
    },
});
